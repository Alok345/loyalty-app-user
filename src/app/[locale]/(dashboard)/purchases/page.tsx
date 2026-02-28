'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, ClipboardList, Clock, CheckCircle2, XCircle, Store, Calendar, Package, User, MapPin, Phone, FileText, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

type PurchaseOrder = {
    id: string;
    item_name: string;
    quantity: number;
    owner_name: string;
    owner_city: string;
    owner_mobile: string;
    invoice_number: string | null;
    photo_url: string | null;
    purchase_date: string;
    verification_status: 'pending' | 'verified' | 'rejected';
    created_at: string;
    store_name?: string; // Denormalized or mapped
    store?: { name: string } | null;
};

export default function PurchasesPage() {
    const { user } = useAuth();
    const t = useTranslations('PurchaseOrders');
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

    useEffect(() => {
        if (!user) return;
        const fetchOrders = async () => {
            try {
                const q = query(
                    collection(db, 'purchase_orders'),
                    where('user_id', '==', user.id),
                    orderBy('created_at', 'desc')
                );

                const querySnapshot = await getDocs(q);
                const ordersData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as PurchaseOrder[];

                setOrders(ordersData);
            } catch (err) {
                console.error("Error fetching purchases:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [user]);

    const statusConfig = {
        pending: { label: t('pending'), icon: Clock, className: 'border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
        verified: { label: t('verified'), icon: CheckCircle2, className: 'border-green-200 text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' },
        rejected: { label: t('rejected'), icon: XCircle, className: 'border-red-200 text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' },
    };

    if (loading) {
        return (
            <div className="space-y-4 p-1">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-secondary/30 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-24 p-1">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{t('description')}</p>
                </div>
                <Button asChild size="sm" className="gap-1.5 shrink-0">
                    <Link href="/purchases/new">
                        <Plus className="h-4 w-4" />
                        {t('newPurchase')}
                    </Link>
                </Button>
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground font-medium mb-1">{t('noOrders')}</p>
                        <p className="text-xs text-muted-foreground/70 mb-4">{t('description')}</p>
                        <Button asChild size="sm">
                            <Link href="/purchases/new">
                                <Plus className="h-4 w-4 mr-1.5" />
                                {t('submitFirst')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2.5">
                    {orders.map((order) => {
                        const status = statusConfig[order.verification_status];
                        const StatusIcon = status.icon;
                        return (
                            <Card
                                key={order.id}
                                className="cursor-pointer hover:shadow-md active:scale-[0.99] transition-all duration-150"
                                onClick={() => setSelectedOrder(order)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex mb-1.5">
                                                <div className='flex flex-1 items-center gap-2'>
                                                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <h3 className="font-semibold text-[15px] truncate">{order.item_name}</h3>
                                                    <span className="text-xs text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded">
                                                        ×{order.quantity}
                                                    </span>
                                                </div>
                                                <Badge variant="outline" className={`gap-1 justify-self-right shrink-0 text-xs font-medium ${status.className}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status.label}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs justify-between text-muted-foreground pt-2">
                                                <span className="flex items-center gap-1">
                                                    <Store className="h-3 w-3" />
                                                    {order.store_name || order.store?.name || '—'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(order.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                    {selectedOrder && (() => {
                        const status = statusConfig[selectedOrder.verification_status];
                        const StatusIcon = status.icon;
                        return (
                            <>
                                <DialogHeader>
                                    <div className="flex items-center justify-between pr-6">
                                        <DialogTitle className="text-lg">{t('orderDetails')}</DialogTitle>
                                        <Badge variant="outline" className={`gap-1 text-xs font-medium ${status.className}`}>
                                            <StatusIcon className="h-3 w-3" />
                                            {status.label}
                                        </Badge>
                                    </div>
                                    <DialogDescription className="sr-only">
                                        {t('orderDetails')}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 pt-2">
                                    {/* Item Info */}
                                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-primary" />
                                            <span className="font-semibold">{selectedOrder.item_name}</span>
                                            <span className="text-sm text-muted-foreground bg-background px-2 py-0.5 rounded-md">
                                                ×{selectedOrder.quantity}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid gap-3">
                                        <DetailRow icon={Store} label={t('storeLocation')} value={selectedOrder.store_name || selectedOrder.store?.name || '—'} />
                                        <DetailRow icon={Calendar} label={t('purchaseDate')} value={new Date(selectedOrder.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} />
                                        <DetailRow icon={User} label={t('ownerName')} value={selectedOrder.owner_name} />
                                        <DetailRow icon={MapPin} label={t('ownerCity')} value={selectedOrder.owner_city} />
                                        <DetailRow icon={Phone} label={t('ownerMobile')} value={selectedOrder.owner_mobile} />
                                        {selectedOrder.invoice_number && (
                                            <DetailRow icon={FileText} label={t('invoiceNumber')} value={selectedOrder.invoice_number} />
                                        )}
                                    </div>

                                    {/* Photo */}
                                    {selectedOrder.photo_url && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                                <ImageIcon className="h-4 w-4" />
                                                {t('uploadPhoto')}
                                            </div>
                                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                                                <img
                                                    src={selectedOrder.photo_url}
                                                    alt="Invoice"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Submitted At */}
                                    <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                                        {t('submittedOn')} {new Date(selectedOrder.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 text-sm">
            <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    );
}
