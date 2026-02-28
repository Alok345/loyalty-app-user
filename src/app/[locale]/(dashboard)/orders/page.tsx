'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, MapPin, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

// Simplified type for the list view
type RedemptionOrderSummary = {
    id: string;
    points_spent: number;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    created_at: any;
    reward_name: string;
    reward_image_url: string | null;
    store_name: string;
};

export default function OrdersListPage() {
    const { user } = useAuth();
    const router = useRouter();
    const t = useTranslations('Orders');
    const [orders, setOrders] = useState<RedemptionOrderSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchOrders = async () => {
            try {
                const q = query(
                    collection(db, 'redemptions'),
                    where('user_id', '==', user.id),
                    orderBy('created_at', 'desc')
                );

                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as unknown as RedemptionOrderSummary[];

                if (data) setOrders(data);
            } catch (err) {
                console.error("Error fetching orders:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    const formatDate = (dateInput: any) => {
        let date: Date;
        if (dateInput instanceof Timestamp) {
            date = dateInput.toDate();
        } else if (typeof dateInput === 'string') {
            date = new Date(dateInput);
        } else if (dateInput?.seconds) {
            date = new Date(dateInput.seconds * 1000);
        } else {
            return "N/A";
        }
        return format(date, 'MMM d, yyyy');
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-24">
            <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            </div>

            {orders.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                        <p className="text-lg font-medium">{t('noOrders')}</p>
                        <p className="text-muted-foreground text-center max-w-sm mt-2">
                            {t('noOrdersDesc')}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {orders.map((order) => {
                        const isCancelled = order.status === 'CANCELLED';
                        const isCompleted = order.status === 'COMPLETED';

                        return (
                            <Card
                                key={order.id}
                                className="overflow-hidden hover:bg-muted/50 transition-colors cursor-pointer active:scale-[0.99]"
                                onClick={() => router.push(`/orders/${order.id}`)}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    {/* Product Image Thumbnail */}
                                    <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center overflow-hidden shrink-0 border">
                                        {order.reward_image_url ? (
                                            <img src={order.reward_image_url} alt={order.reward_name} className="h-full w-full object-cover" />
                                        ) : (
                                            <Package className="h-8 w-8 text-muted-foreground/50" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-semibold text-base truncate pr-2">{order.reward_name}</h3>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    isCancelled ? "text-red-600 border-red-200 bg-red-50" :
                                                        isCompleted ? "text-green-600 border-green-200 bg-green-50" :
                                                            "text-blue-600 border-blue-200 bg-blue-50"
                                                }
                                            >
                                                {t(order.status.toLowerCase())}
                                            </Badge>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {formatDate(order.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {order.store_name}
                                            </div>
                                        </div>
                                    </div>

                                    <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
