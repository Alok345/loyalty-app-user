'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Mail, Phone, MapPin, Store, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

type StoreInfo = {
    id: string;
    name: string;
    location: string | null;
};

export default function ContactPage() {
    const tNav = useTranslations('Navigation');
    const t = useTranslations('Contact');
    const [stores, setStores] = useState<StoreInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const q = query(
                    collection(db, 'stores'),
                    where('active', '==', true)
                );
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as StoreInfo[];

                if (data) setStores(data);
            } catch (err) {
                console.error("Error fetching stores:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStores();
    }, []);

    const supportInfo = {
        email: "support@shubhnirman.com",
        phone: "+91 9876543210",
        whatsapp: "+91 9876543210"
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-4xl mx-auto pb-24">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                <p className="text-muted-foreground">{t('description')}</p>
            </div>

            {/* General Support */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="flex flex-col items-center text-center p-6 gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Mail className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="font-semibold">{t('emailUs')}</p>
                        <a href={`mailto:${supportInfo.email}`} className="text-sm text-blue-600 hover:underline">{supportInfo.email}</a>
                    </div>
                </Card>
                <Card className="flex flex-col items-center text-center p-6 gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <Phone className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="font-semibold">{t('callUs')}</p>
                        <a href={`tel:${supportInfo.phone}`} className="text-sm text-green-600 hover:underline">{supportInfo.phone}</a>
                    </div>
                </Card>
                <Card className="flex flex-col items-center text-center p-6 gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="font-semibold">{t('whatsapp')}</p>
                        <a href={`https://wa.me/${supportInfo.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline">{t('chatWithUs')}</a>
                    </div>
                </Card>
            </div>

            {/* Store Locations */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Store className="h-6 w-6" /> {t('ourStores')}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {stores.map((store) => (
                        <Card key={store.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{store.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-2 text-muted-foreground text-sm">
                                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                    <span>{store.location || t('locationSoon')}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {stores.length === 0 && (
                        <p className="text-muted-foreground italic col-span-2">{t('noStores')}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
