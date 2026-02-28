'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Truck, Store, MapPin, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { differenceInCalendarDays, format, addDays } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';

type RedemptionOrder = {
    id: string;
    points_spent: number;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    created_at: any;
    reward_name: string;
    reward_image_url: string | null;
    reward_description: string | null;
    store_name: string;
    store_location: string | null;
    contact_name?: string;
    contact_mobile?: string;
};

export default function OrderDetailPage() {
    const { user, profile } = useAuth();
    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Orders');
    const [order, setOrder] = useState<RedemptionOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const orderId = params.id as string;

    useEffect(() => {
        if (!user || !orderId) return;

        const fetchOrder = async () => {
            try {
                const orderRef = doc(db, 'redemptions', orderId);
                const orderSnap = await getDoc(orderRef);

                if (orderSnap.exists()) {
                    setOrder({ id: orderSnap.id, ...orderSnap.data() } as RedemptionOrder);
                }
            } catch (err) {
                console.error("Error fetching order:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [user, orderId]);

    const getTimelineSteps = (order: RedemptionOrder) => {
        let createdDate: Date;
        if (order.created_at instanceof Timestamp) {
            createdDate = order.created_at.toDate();
        } else if (order.created_at?.seconds) {
            createdDate = new Date(order.created_at.seconds * 1000);
        } else {
            createdDate = new Date(order.created_at);
        }

        const daysElapsed = differenceInCalendarDays(new Date(), createdDate);
        const isCancelled = order.status === 'CANCELLED';
        const isCompleted = order.status === 'COMPLETED';

        const steps = [
            {
                title: t('placed'),
                date: format(createdDate, 'MMM d, yyyy'),
                active: true,
                completed: daysElapsed >= 0 || isCompleted,
                icon: Package
            },
            {
                title: t('shipped'),
                date: format(addDays(createdDate, 1), 'MMM d, yyyy'),
                active: !isCancelled && (daysElapsed >= 1 || isCompleted),
                completed: !isCancelled && (daysElapsed >= 1 || isCompleted),
                icon: Truck
            },
            {
                title: t('ready'),
                date: format(addDays(createdDate, 2), 'MMM d, yyyy'),
                active: !isCancelled && (daysElapsed >= 2 || isCompleted),
                completed: !isCancelled && (daysElapsed >= 2 || isCompleted),
                icon: Store
            }
        ];

        return steps;
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <p className="text-lg font-medium">{t('noOrders')}</p>
                <Button variant="outline" onClick={() => router.back()}>{t('back')}</Button>
            </div>
        );
    }

    const timeline = getTimelineSteps(order);
    const currentStepIndex = timeline.findLastIndex(step => step.active);
    const isCancelled = order.status === 'CANCELLED';

    return (
        <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto pb-24">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">{t('details')}</h1>
            </div>

            <Card className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div>
                            <CardTitle className="text-xl">{order.reward_name || 'Unknown Reward'}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                                {t('orderId')}: <span className="font-mono text-xs">{order.id}</span>
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-sm px-3 py-1">
                                {order.points_spent} pts
                            </Badge>
                            <Badge
                                className={
                                    isCancelled ? "bg-red-100 text-red-700 hover:bg-red-100" :
                                        order.status === 'COMPLETED' ? "bg-green-100 text-green-700 hover:bg-green-100" :
                                            "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                }
                            >
                                {isCancelled ? t('cancelled') :
                                    order.status === 'COMPLETED' ? t('delivered') :
                                        timeline[currentStepIndex]?.title || t('processing')}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                    {/* Timeline */}
                    <div>
                        <h3 className="font-semibold mb-6">{t('status')}</h3>
                        <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-0 pl-4 md:pl-0 border-l-2 md:border-l-0 md:border-t-2 border-muted ml-3 md:ml-0 md:mt-8 md:mx-12">
                            {timeline.map((step, index) => {
                                const isActive = step.active;
                                const Icon = step.icon;

                                return (
                                    <div key={index} className="relative flex md:flex-col items-center md:items-center">
                                        <div className={`
                                            absolute md:relative -left-[21px] md:left-auto md:-top-[26px] 
                                            flex h-10 w-10 items-center justify-center rounded-full border-4 border-background 
                                            ${isActive
                                                ? (isCancelled ? 'bg-red-500 text-white' : 'bg-green-500 text-white')
                                                : 'bg-muted text-muted-foreground'}
                                            transition-colors duration-300 z-10
                                        `}>
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        <div className="ml-6 md:ml-0 md:mt-4 text-left md:text-center">
                                            <p className={`text-sm font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {step.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {isActive ? step.date : '—'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {isCancelled && (
                            <div className="mt-6 p-4 bg-red-50 text-red-800 rounded-md text-sm border border-red-100 flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                {t('refundNote')}
                            </div>
                        )}
                    </div>

                    {/* Order Info Grid */}
                    <div className="grid md:grid-cols-2 gap-6 pt-6 border-t">
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Store className="h-4 w-4" /> {t('collectionPoint')}
                            </h3>
                            <div className="text-sm">
                                <p className="font-medium">{order.store_name}</p>
                                <p className="text-muted-foreground">{order.store_location || t('noLocation')}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Package className="h-4 w-4" /> {t('pickedUpBy')}
                            </h3>
                            <div className="text-sm">
                                <p className="font-medium">{order.contact_name || profile?.full_name || 'N/A'}</p>
                                <p className="text-muted-foreground">{order.contact_mobile || profile?.mobile || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
