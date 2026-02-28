'use client';

import { useAuth } from "@/components/AuthProvider";
import { useTranslations } from "next-intl";

export function DashboardHeader() {
    const { profile } = useAuth();
    const t = useTranslations('Dashboard');

    const name = profile?.full_name?.split(' ')[0] || '';
    const points = profile?.points_balance ?? 0;

    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    {name ? t('welcome', { name }) : t('welcomeBack')}
                </h1>
                <p className="text-muted-foreground">{t('pointsBalance', { points })}</p>
            </div>
        </div>
    );
}
