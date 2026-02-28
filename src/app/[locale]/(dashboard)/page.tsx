import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { Banners } from "@/components/dashboard/Banners";
import { RecentHistory } from "@/components/dashboard/RecentHistory";
import { getTranslations } from 'next-intl/server';

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default async function HomePage() {
    const t = await getTranslations('redeem');
    const tD = await getTranslations('Dashboard');

    return (
        <div className="flex flex-col gap-6">
            <DashboardHeader />

            <Banners />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/rewards" className="w-full">
                    <Card className="hover:bg-accent cursor-pointer transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-semibold">{t('redeemNow')}</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-muted-foreground">{t('usePoints')}</div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <Link href="/scan">
                    <div className="flex flex-col items-center gap-1 group">
                        <div className="h-16 w-16 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 hover:scale-105 transition-all cursor-pointer ring-4 ring-background">
                            <QrCode className="h-8 w-8" />
                        </div>
                        <span className="text-xs font-bold bg-background/80 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm">{tD('scanQr')}</span>
                    </div>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <RecentHistory />
            </div>
        </div>
    );
}
