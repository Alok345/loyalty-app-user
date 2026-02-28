'use client';

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useTranslations } from 'next-intl';
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs, QueryDocumentSnapshot } from "firebase/firestore";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Transaction = {
    id: string;
    type: 'EARN' | 'REDEEM';
    amount: number;
    description: string | null;
    created_at: string;
};

export function RecentHistory() {
    const t = useTranslations('Dashboard');
    const { user } = useAuth();
    const [history, setHistory] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            try {
                const q = query(
                    collection(db, 'transactions'),
                    where('user_id', '==', user.id),
                    orderBy('created_at', 'desc'),
                    limit(3)
                );

                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
                    id: doc.id,
                    ...doc.data()
                })) as Transaction[];

                if (data.length > 0) {
                    setHistory(data);
                }
            } catch (err) {
                console.error("Error fetching history:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    if (loading) {
        return (
            <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                <CardHeader><CardTitle>{t('recentHistory')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 bg-secondary/30 rounded animate-pulse" />)}
                </CardContent>
            </Card>
        );
    }

    if (history.length === 0) {
        return (
            <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                <CardHeader>
                    <CardTitle>{t('recentHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">{t('noTransactions')}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>{t('recentHistory')}</CardTitle>
                <Link href="/history" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
                    {t('viewAll')}
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {history.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                            <div className="flex flex-col">
                                <span className="font-medium">{item.description || (item.type === 'EARN' ? t('pointsEarned') : t('pointsRedeemed'))}</span>
                                <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
                            </div>
                            <span className={`font-bold ${item.type === 'EARN' ? 'text-green-600' : 'text-red-600'}`}>
                                {item.type === 'EARN' ? '+' : '-'}{item.amount}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
