'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, ImagePlus, X } from 'lucide-react';

export default function NewPurchasePage() {
    const { user, profile } = useAuth();
    const t = useTranslations('PurchaseOrders');
    const router = useRouter();

    const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [storeId, setStoreId] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [ownerName, setOwnerName] = useState('');
    const [ownerCity, setOwnerCity] = useState('');
    const [ownerMobile, setOwnerMobile] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    useEffect(() => {
        // Fetch stores
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

        // Pre-fill from profile
        if (profile) {
            setOwnerName(profile.full_name || '');
            setOwnerMobile(profile.mobile?.replace('+91', '') || '');
        }
    }, [profile]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setError(null);
            if (!e.target.files || e.target.files.length === 0) return;

            const file = e.target.files[0];

            // 5MB file size limit
            const MAX_SIZE = 5 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
                setError(t('fileTooLarge'));
                setUploading(false);
                return;
            }

            // Show preview
            const reader = new FileReader();
            reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
            reader.readAsDataURL(file);

            if (!user) throw new Error('User not authenticated');

            const fileExt = file.name.split('.').pop();
            const filePath = `purchase-orders/${user.id}/${Date.now()}.${fileExt}`;
            const storageRef = ref(storage, filePath);

            await uploadBytes(storageRef, file);
            const publicUrl = await getDownloadURL(storageRef);

            setPhotoUrl(publicUrl);
        } catch (err: any) {
            setError(err.message || 'Failed to upload photo');
            setPhotoPreview(null);
        } finally {
            setUploading(false);
        }
    };

    const removePhoto = () => {
        setPhotoUrl(null);
        setPhotoPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        // Validate mobile
        const cleanMobile = ownerMobile.replace(/\D/g, '');
        if (cleanMobile.length !== 10) {
            setError(t('invalidMobile'));
            setLoading(false);
            return;
        }

        try {
            await addDoc(collection(db, 'purchase_orders'), {
                user_id: user.id,
                store_id: storeId,
                purchase_date: purchaseDate,
                item_name: itemName,
                quantity: parseInt(quantity) || 1,
                owner_name: ownerName,
                owner_city: ownerCity,
                owner_mobile: `+91${cleanMobile}`,
                invoice_number: invoiceNumber || null,
                photo_url: photoUrl,
                verification_status: 'pending',
                created_at: serverTimestamp(),
            });

            setSuccess(true);
            setTimeout(() => router.push('/purchases'), 1500);
        } catch (insertError: any) {
            setError(insertError.message);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 animate-in fade-in zoom-in duration-500">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold">{t('submitSuccess')}</h2>
                <p className="text-muted-foreground text-sm">{t('submitSuccessDesc')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto pb-20">
            <Card>
                <CardHeader>
                    <CardTitle>{t('newPurchase')}</CardTitle>
                    <CardDescription>{t('formDescription')}</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-4">
                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg font-medium text-center">
                                {error}
                            </div>
                        )}

                        {/* Store Location */}
                        <div className="grid gap-2">
                            <Label>{t('storeLocation')}</Label>
                            <Select value={storeId} onValueChange={setStoreId} required>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('selectStore')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {stores.map((store) => (
                                        <SelectItem key={store.id} value={store.id}>
                                            {store.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Purchase Date */}
                        <div className="grid gap-2">
                            <Label>{t('purchaseDate')}</Label>
                            <Input
                                type="date"
                                value={purchaseDate}
                                onChange={(e) => setPurchaseDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>

                        {/* Item Name & Quantity */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 grid gap-2">
                                <Label>{t('itemName')}</Label>
                                <Input
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    placeholder={t('itemNamePlaceholder')}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>{t('quantity')}</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Owner Name */}
                        <div className="grid gap-2">
                            <Label>{t('ownerName')}</Label>
                            <Input
                                value={ownerName}
                                onChange={(e) => setOwnerName(e.target.value)}
                                placeholder={t('ownerNamePlaceholder')}
                                required
                            />
                        </div>

                        {/* Owner City */}
                        <div className="grid gap-2">
                            <Label>{t('ownerCity')}</Label>
                            <Input
                                value={ownerCity}
                                onChange={(e) => setOwnerCity(e.target.value)}
                                placeholder={t('ownerCityPlaceholder')}
                                required
                            />
                        </div>

                        {/* Owner Mobile */}
                        <div className="grid gap-2">
                            <Label>{t('ownerMobile')}</Label>
                            <div className="flex gap-2">
                                <div className="flex items-center px-3 border rounded-md bg-muted text-muted-foreground font-medium">
                                    +91
                                </div>
                                <Input
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={10}
                                    value={ownerMobile}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) setOwnerMobile(val);
                                    }}
                                    placeholder="00000 00000"
                                    required
                                />
                            </div>
                        </div>

                        {/* Invoice Number (optional) */}
                        <div className="grid gap-2">
                            <Label>
                                {t('invoiceNumber')}
                                <span className="text-muted-foreground text-xs ml-1">({t('optional')})</span>
                            </Label>
                            <Input
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                placeholder={t('invoicePlaceholder')}
                            />
                        </div>

                        {/* Photo Upload (optional) */}
                        <div className="grid gap-2">
                            <Label>
                                {t('uploadPhoto')}
                                <span className="text-muted-foreground text-xs ml-1">({t('optional')})</span>
                            </Label>
                            {photoPreview ? (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                                    <img
                                        src={photoPreview}
                                        alt="Invoice"
                                        className="w-full h-full object-contain"
                                    />
                                    <button
                                        type="button"
                                        onClick={removePhoto}
                                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                    {uploading ? (
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    ) : (
                                        <>
                                            <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                                            <span className="text-sm text-muted-foreground">{t('tapToUpload')}</span>
                                            <span className="text-xs text-muted-foreground/60 mt-1">{t('maxFileSize')}</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="py-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || uploading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    {t('submitting')}
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    {t('submit')}
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
