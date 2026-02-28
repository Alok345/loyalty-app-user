'use client';

import { useTranslations } from 'next-intl';
import { useCart } from '@/components/CartProvider';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';

export default function CheckoutPage() {
    const tNav = useTranslations('Navigation');
    const t = useTranslations('Checkout');
    const router = useRouter();
    const { user, profile, refreshProfile } = useAuth();
    const { items, removeItem, updateQuantity, totalPoints, clearCart } = useCart();

    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState<{ id: string, name: string }[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        shopId: ''
    });

    const [error, setError] = useState<string | null>(null);

    // Fetch stores and pre-fill user data
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
                    name: doc.data().name
                }));
                if (data) setStores(data);
            } catch (err) {
                console.error("Error fetching stores:", err);
            }
        };

        fetchStores();

        if (profile) {
            setFormData(prev => ({
                ...prev,
                name: profile.full_name || '',
                mobile: profile.mobile || ''
            }));
        }
    }, [profile]);

    const hasSufficientPoints = (profile?.points_balance || 0) >= totalPoints;
    const remainingBalance = (profile?.points_balance || 0) - totalPoints;
    const pointsNeeded = totalPoints - (profile?.points_balance || 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile) return;
        if (!hasSufficientPoints) {
            setError(t("insufficientBalance"));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const batch = writeBatch(db);

            // 1. Create Redemption Records
            items.forEach(item => {
                const redemptionRef = doc(collection(db, 'redemptions'));
                const store = stores.find(s => s.id === formData.shopId);
                batch.set(redemptionRef, {
                    user_id: user.id,
                    reward_id: item.id,
                    reward_name: item.name,
                    reward_image_url: item.image || null,
                    reward_description: item.description || '',
                    store_id: formData.shopId,
                    store_name: store?.name || '',
                    store_location: store?.location || '',
                    points_spent: item.cost * item.quantity,
                    status: 'PENDING',
                    contact_name: formData.name,
                    contact_mobile: formData.mobile,
                    created_at: serverTimestamp()
                });
            });

            // 2. Create Transaction for point deduction
            const transactionRef = doc(collection(db, 'transactions'));
            batch.set(transactionRef, {
                user_id: user.id,
                type: 'REDEEM',
                amount: totalPoints,
                description: `Redeemed ${items.length} item(s): ${items.map(i => i.name).join(', ')}`,
                created_at: serverTimestamp()
            });

            // 3. Update Profile Balance (Cloud Functions usually handle this, but for now we do client-side if allowed)
            // Note: In a real app, use a Cloud Function triggered by transaction to ensure consistency.
            const profileRef = doc(db, 'profiles', user.id);
            batch.update(profileRef, {
                points_balance: remainingBalance
            });

            await batch.commit();

            await refreshProfile();
            clearCart();
            router.push('/history');
        } catch (err: any) {
            console.error("Checkout error:", err);
            setError(err.message || t("checkoutError") || "An error occurred during checkout.");
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <h2 className="text-2xl font-bold">{t('emptyCart')}</h2>
                <Button onClick={() => router.push('/rewards')}>{t('browseRewards')}</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-4xl mx-auto pb-24">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('orderSummary')}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                                    <div className="flex-1">
                                        <p className="font-medium">{item.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}>-</Button>
                                            <span className="text-sm w-4 text-center">{item.quantity}</span>
                                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}>+</Button>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{item.cost * item.quantity} pts</p>
                                        <Button variant="ghost" size="sm" className="h-6 text-red-500 hover:text-red-600 px-0" onClick={() => removeItem(item.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-4 border-t flex justify-between items-center text-lg font-bold">
                                <span>{t('totalPoints')}</span>
                                <span className="text-primary">{totalPoints} pts</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={hasSufficientPoints ? "bg-green-50 dark:bg-green-900/10" : "bg-red-50 dark:bg-red-900/10"}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                {hasSufficientPoints ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                                {t('pointsCheck')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            <div className="flex justify-between mb-1">
                                <span>{t('currentBalance')}:</span>
                                <span className="font-bold">{profile?.points_balance || 0} pts</span>
                            </div>
                            <div className="flex justify-between">
                                {hasSufficientPoints ? (
                                    <>
                                        <span>{t('balanceAfter')}:</span>
                                        <span className="font-bold text-green-600">{remainingBalance} pts</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{t('pointsShortage')}:</span>
                                        <span className="font-bold text-red-600">{pointsNeeded} pts</span>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('collectionDetails')}</CardTitle>
                        <CardDescription>{t('collectionDesc')}</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="grid gap-4">
                            {error && (
                                <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 border border-red-200 dark:border-red-800">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{error}</span>
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('fullName')}</Label>
                                <Input
                                    id="name"
                                    required
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="mobile">{t('mobileNumber')}</Label>
                                <Input
                                    id="mobile"
                                    required
                                    type="tel"
                                    placeholder="+1 234 567 890"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="shop">{t('collectionShop')}</Label>
                                <Select
                                    required
                                    value={formData.shopId}
                                    onValueChange={(val) => setFormData({ ...formData, shopId: val })}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectShop')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stores.map(store => (
                                            <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                size="lg"
                                disabled={loading || !hasSufficientPoints || !formData.shopId}
                                type="submit"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('processing')}
                                    </>
                                ) : (
                                    hasSufficientPoints ? t('redeemFor', { points: totalPoints }) : t('insufficientBalance')
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
