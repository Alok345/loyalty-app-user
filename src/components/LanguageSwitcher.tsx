'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Switch } from '@/components/ui/switch';

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const onToggle = (checked: boolean) => {
        const nextLocale = checked ? 'hi' : 'en';
        startTransition(() => {
            document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
            router.refresh();
        });
    };

    return (
        <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${locale === 'en' ? 'text-primary' : 'text-muted-foreground'}`}>En</span>
            <Switch
                checked={locale === 'hi'}
                onCheckedChange={onToggle}
                disabled={isPending}
                aria-label="Toggle Language"
            />
            <span className={`text-sm font-medium ${locale === 'hi' ? 'text-primary' : 'text-muted-foreground'}`}>Hi</span>
        </div>
    );
}
