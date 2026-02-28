'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Gift, ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RewardsPage() {
    const tNav = useTranslations('Navigation');
    const t = useTranslations('Rewards');
    const { items, addItem, updateQuantity, totalItems, totalPoints } = useCart();
    const router = useRouter();

    const [rewards, setRewards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Hydration safety for localStorage persistence
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        const fetchRewards = async () => {
            try {
                const q = query(
                    collection(db, 'rewards'),
                    where('active', '==', true),
                    orderBy('cost', 'asc')
                );

                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                if (data) setRewards(data);
            } catch (err) {
                console.error("Error fetching rewards:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRewards();
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-24">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{tNav('rewards')}</h1>
                <p className="text-muted-foreground">{t('description')}</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-60 bg-secondary/30 rounded-lg animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {rewards.length === 0 && <p className="col-span-full text-center text-muted-foreground">{t('noRewards')}</p>}
                    {rewards.map((reward) => {
                        const cartItem = items.find(i => i.id === reward.id);
                        const quantity = cartItem?.quantity || 0;
                        const image = reward.image_url; // Adapt to schema

                        return (
                            <Card key={reward.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow py-2 gap-1">
                                <div className="h-25 bg-muted w-full flex items-center justify-center bg-secondary/20 relative group overflow-hidden">
                                    {image ? (
                                        <div
                                            className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110"
                                            style={{ backgroundImage: `url(${image})` }}
                                        />
                                    ) : (
                                        <Gift className="h-16 w-16 text-muted-foreground/50 transition-transform group-hover:scale-110" />
                                    )}
                                </div>
                                <CardHeader className='px-1 text-center'>
                                    <CardTitle className="line-clamp-1">{reward.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[2.5em]">{reward.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="px-1 text-center">
                                    <div className="text-2xl font-bold text-primary">{reward.cost} {t('pts')}</div>
                                </CardContent>
                                <CardFooter className='px-1'>
                                    {quantity > 0 ? (
                                        <div className="flex items-center justify-between w-full bg-secondary/20 rounded-md p-1">
                                            <Button variant="ghost" size="icon" onClick={() => updateQuantity(reward.id, -1)} className="h-8 w-8">
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="font-bold">{quantity}</span>
                                            <Button variant="ghost" size="icon" onClick={() => updateQuantity(reward.id, 1)} className="h-8 w-8">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button className="w-full" onClick={() => addItem(reward)}>
                                            {t('addToCart')}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            {totalItems > 0 && (
                <div className="fixed bottom-4 left-4 right-4 md:left-[270px] md:right-6 lg:left-0 lg:right-0 lg:max-w-4xl lg:mx-auto z-40 animate-in slide-in-from-bottom-5">
                    <div className="bg-primary text-primary-foreground p-4 rounded-xl shadow-xl flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="font-bold flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                {totalItems} {t('items')}
                            </span>
                            <span className="text-sm opacity-90">{t('total')}: {totalPoints} {t('pts')}</span>
                        </div>
                        <Button variant="secondary" onClick={() => router.push('/checkout')} className="font-bold">
                            {t('goToCart')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
