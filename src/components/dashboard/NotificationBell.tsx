'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, QuerySnapshot } from 'firebase/firestore';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function NotificationBell() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('user_id', '==', user.id),
            where('is_read', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot) => {
            setUnreadCount(snapshot.size);
        }, (error: Error) => {
            console.error("Error listening to notifications:", error);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-in zoom-in duration-200">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
                <span className="sr-only">Notifications</span>
            </Link>
        </Button>
    );
}
