'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    limit,
    Timestamp
} from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { Loader2, Store } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ScanPage() {
    const tNav = useTranslations('Navigation');
    const t = useTranslations('Scan');
    const tc = useTranslations('Checkout');
    const searchParams = useSearchParams();
    const router = useRouter();
    const [scanResult, setScanResult] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pointsWon, setPointsWon] = useState<number | null>(null);
    const { user, refreshProfile } = useAuth();

    // New state for store selection
    const [stores, setStores] = useState<{ id: string, name: string }[]>([]);
    const [selectedStore, setSelectedStore] = useState<string>('');
    const [scanLogId, setScanLogId] = useState<string | null>(null);
    const [isUpdatingStore, setIsUpdatingStore] = useState(false);
    const [urlCodeProcessed, setUrlCodeProcessed] = useState(false);
    const isProcessing = useRef(false);

    // Helper to extract code from raw value or URL
    const extractCode = (scannedValue: string): string => {
        try {
            const url = new URL(scannedValue);
            const code = url.searchParams.get('code');
            return code || scannedValue;
        } catch {
            // Not a URL, return as-is
            return scannedValue;
        }
    };

    useEffect(() => {
        // Fetch stores on mount
        const fetchStores = async () => {
            try {
                const q = query(
                    collection(db, 'stores'),
                    where('active', '==', true)
                );
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
                if (data) setStores(data);
            } catch (err) {
                console.error("Error fetching stores:", err);
            }
        };
        fetchStores();
    }, []);

    // Universal scan flow: Check for code in URL params
    useEffect(() => {
        const codeFromUrl = searchParams.get('code');
        if (codeFromUrl && !urlCodeProcessed && user) {
            setUrlCodeProcessed(true);
            processScan(codeFromUrl);
            // Clean the URL after processing
            router.replace('/scan');
        }
    }, [searchParams, user, urlCodeProcessed]);

    const processScan = async (code: string) => {
        if (!user) {
            setError(t("loginRequired") || "You must be logged in to scan.");
            return;
        }

        if (isProcessing.current) return;
        isProcessing.current = true;

        setIsLoading(true);
        setError(null);

        try {
            // 1. Check if QR exists and is active
            const qrQuery = query(
                collection(db, 'qr_codes'),
                where('code', '==', code),
                where('active', '==', true),
                limit(1)
            );

            const qrSnapshot = await getDocs(qrQuery);
            if (qrSnapshot.empty) {
                setError(t("invalidQr"));
                setIsLoading(false);
                isProcessing.current = false;
                return;
            }

            const qrDoc = qrSnapshot.docs[0];
            const qrData = { id: qrDoc.id, ...qrDoc.data() } as any;

            // 2. Insert transaction
            await addDoc(collection(db, 'transactions'), {
                user_id: user.id,
                type: 'EARN',
                amount: qrData.points,
                description: `Scanned QR Code: ${code}`,
                created_at: serverTimestamp()
            });

            // 3. Deactivate QR code
            const qrRef = doc(db, 'qr_codes', qrData.id);
            await updateDoc(qrRef, { active: false });

            // 4. Log the scan to qr_scan_logs (initially without store)
            const logRef = await addDoc(collection(db, 'qr_scan_logs'), {
                user_id: user.id,
                qr_code_id: qrData.id,
                store_id: null,
                created_at: serverTimestamp()
            });

            setScanLogId(logRef.id);
            setPointsWon(qrData.points);
            setScanResult(code);
            await refreshProfile(); // Update balance immediately
        } catch (err) {
            console.error("Scan processing error:", err);
            setError(t("error") || "An error occurred while processing the scan. Please try again.");
        } finally {
            setIsLoading(false);
            isProcessing.current = false;
        }
    };

    const handleUpdateStore = async () => {
        if (!scanLogId || !selectedStore) return;
        setIsUpdatingStore(true);

        try {
            const logRef = doc(db, 'qr_scan_logs', scanLogId);
            await updateDoc(logRef, { store_id: selectedStore });

            await refreshProfile();
            // Success: reset
            handleReset();
        } catch (err) {
            console.error("Failed to update store:", err);
        } finally {
            setIsUpdatingStore(false);
        }
    };

    // Flag to track if we are currently starting the scanner to prevent race conditions
    const isStarting = useRef(false);

    useEffect(() => {
        // ID of the element to render the QR code scanner to.
        const scannerId = "reader";
        let isMounted = true;

        async function startScanner() {
            // If we have a result, don't start scanner
            if (scanResult) return;

            // Skip scanner if we have a code from URL (universal flow)
            const codeFromUrl = searchParams.get('code');
            if (codeFromUrl) return;

            // Prevent multiple start attempts
            if (isStarting.current) return;
            isStarting.current = true;

            try {
                // Check if element exists
                if (!document.getElementById(scannerId)) return;

                // Initialize scanner if used for the first time
                if (!scannerRef.current) {
                    scannerRef.current = new Html5Qrcode(scannerId);
                }

                const scanner = scannerRef.current;

                // Start scanning
                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        if (!isMounted) return;
                        const code = extractCode(decodedText);
                        console.log(`Code matched = ${code}`);

                        // Stop scanning on success
                        if (scanner.isScanning) {
                            scanner.stop().then(() => {
                                scanner.clear();
                                processScan(code);
                            }).catch(err => console.warn("Failed to stop scanner", err));
                        }
                    },
                    (errorMessage) => {
                        // console.warn(`Code scan error = ${errorMessage}`);
                    }
                );
            } catch (err) {
                if (isMounted) {
                    if ((err as string)?.includes?.("already under transition")) {
                        console.log("Scanner transition race ignored.");
                    } else {
                        console.error("Error starting scanner", err);
                        setError(t("cameraError"));
                    }
                }
            } finally {
                isStarting.current = false;
            }
        }

        const timer = setTimeout(() => {
            if (!scanResult) startScanner();
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        scannerRef.current.stop().then(() => {
                            scannerRef.current?.clear();
                        }).catch(err => {
                            console.warn("Cleanup stop error", err);
                        });
                    } else {
                        // Just clear if not scanning
                        scannerRef.current.clear();
                    }
                } catch (e) {
                    console.warn("Cleanup error", e);
                }
            }
        };
    }, [scanResult, error]); // Re-run if scanResult or error changes (to restart if cleared)

    const handleReset = () => {
        setScanResult(null);
        setPointsWon(null);
        setError(null);
        setScanLogId(null);
        setSelectedStore('');
        // window.location.reload(); // Removed reload to make it smoother
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 gap-4 pb-20">
            <h1 className="text-2xl font-bold">{tNav('scan')}</h1>

            {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('processing')}
                </div>
            )}

            {scanResult ? (
                <Card className="w-full max-w-md bg-green-50 dark:bg-green-900/20 border-green-200 animate-in fade-in zoom-in duration-300">
                    <CardHeader>
                        <CardTitle className="text-green-700 dark:text-green-300 text-center">{t('success')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <div className="text-center">
                            <p className="text-5xl font-bold text-green-600 mb-2">{t('pointsWon', { points: (pointsWon || 0).toString() })}</p>
                            <div className="p-2 bg-background/50 rounded text-xs font-mono break-all border inline-block max-w-full">
                                {scanResult}
                            </div>
                        </div>

                        <div className="bg-background/80 p-4 rounded-lg border shadow-sm">
                            <Label htmlFor="store-select" className="mb-2 block font-medium flex items-center gap-2">
                                <Store className="h-4 w-4" />
                                {t('whereScan')}
                            </Label>
                            <Select
                                value={selectedStore}
                                onValueChange={setSelectedStore}
                            >
                                <SelectTrigger id="store-select">
                                    <SelectValue placeholder={tc('selectShop')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {stores.map(store => (
                                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground mt-2">
                                {t('optionalDesc')}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                className="flex-1"
                            >
                                {t('skip')}
                            </Button>
                            <Button
                                onClick={handleUpdateStore}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                disabled={!selectedStore || isUpdatingStore}
                            >
                                {isUpdatingStore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('confirm')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : error ? (
                <Card className="w-full max-w-md bg-red-50 dark:bg-red-900/20 border-red-200 animate-in fade-in zoom-in duration-300">
                    <CardHeader>
                        <CardTitle className="text-red-700 dark:text-red-300 text-center">{t('invalidQr')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <p className="text-center text-muted-foreground">{error}</p>
                        <Button onClick={handleReset} className="w-full">
                            {t('scanAgain')}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="w-full max-w-md">
                    <CardContent className="p-0 overflow-hidden relative min-h-[300px] h-[300px] bg-black">
                        <div id="reader" className="w-full h-full"></div>
                    </CardContent>
                    <div className="p-4 bg-muted/30 text-center text-sm text-muted-foreground">
                        {t('centerQr')}
                    </div>
                </Card>
            )}
        </div>
    );
}
