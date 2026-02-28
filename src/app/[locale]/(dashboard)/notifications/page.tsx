'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Circle } from 'lucide-react';

type Notification = {
    id: string;
    title: string | null;
    message: string | null;
    is_read: boolean;
    created_at: any; // Can be string or Timestamp
};

function timeAgo(dateInput: any, t: ReturnType<typeof useTranslations>): string {
    const now = new Date();
    let date: Date;

    if (dateInput instanceof Timestamp) {
        date = dateInput.toDate();
    } else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
    } else if (dateInput?.seconds) {
        date = new Date(dateInput.seconds * 1000);
    } else {
        return t('justNow');
    }

    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return t('minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('hoursAgo', { count: diffHours });
    return t('daysAgo', { count: diffDays });
}

export default function NotificationsPage() {
    const { user } = useAuth();
    const t = useTranslations('Notifications');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('user_id', '==', user.id),
            orderBy('created_at', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[];
            setNotifications(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            const notificationRef = doc(db, 'notifications', id);
            await updateDoc(notificationRef, { is_read: true });
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;

        try {
            const q = query(
                collection(db, 'notifications'),
                where('user_id', '==', user.id),
                where('is_read', '==', false)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return;

            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.update(doc.ref, { is_read: true });
            });

            await batch.commit();
        } catch (err) {
            console.error("Error marking all as read:", err);
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-secondary/30 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={markAllAsRead}
                        className="gap-2"
                    >
                        <CheckCheck className="h-4 w-4" />
                        {t('markAllRead')}
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Bell className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <p className="text-muted-foreground">{t('noNotifications')}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${!notification.is_read
                                ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                                : 'opacity-75'
                                }`}
                            onClick={() => {
                                if (!notification.is_read) markAsRead(notification.id);
                            }}
                        >
                            <CardContent className="flex items-start gap-3 py-4">
                                <div className="mt-1 shrink-0">
                                    {!notification.is_read ? (
                                        <Circle className="h-2.5 w-2.5 fill-blue-500 text-blue-500" />
                                    ) : (
                                        <Circle className="h-2.5 w-2.5 text-muted-foreground/30" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className={`text-sm font-semibold leading-tight ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {notification.title || 'Notification'}
                                        </h3>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                            {timeAgo(notification.created_at, t)}
                                        </span>
                                    </div>
                                    <p className={`text-sm mt-1 ${!notification.is_read ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                                        {notification.message}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
