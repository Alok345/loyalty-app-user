"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, QrCode, History, Gift, LogOut, ShoppingBag, Phone, Bell, ClipboardList } from "lucide-react";
import { useParams } from "next/navigation";

export function Sidebar({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const t = useTranslations("Navigation");
  const params = useParams();
  const pathname = usePathname();

  // Helper to check if link is active
  // Note: pathname includes locale, so we check if it ends with the path or contains it
  const isActive = (path: string) => pathname.includes(path);
  const locale = params.locale as string;

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">{t('appName')}</h2>
          <div className="space-y-1">
            <Button variant={isActive('/dashboard') || pathname === '/' ? "secondary" : "ghost"} className="w-full justify-start" asChild>
              <Link href="/">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {t('dashboard')}
              </Link>
            </Button>
            <Button variant={isActive('/scan') ? "secondary" : "ghost"} className="w-full justify-start" asChild>
              <Link href="/scan">
                <QrCode className="mr-2 h-4 w-4" />
                {t('scan')}
              </Link>
            </Button>
            <Button variant={isActive('/history') ? "secondary" : "ghost"} className="w-full justify-start" asChild>
              <Link href="/history">
                <History className="mr-2 h-4 w-4" />
                {t('history')}
              </Link>
            </Button>
            <Button variant={isActive('/rewards') ? "secondary" : "ghost"} className="w-full justify-start" asChild>
              <Link href="/rewards">
                <Gift className="mr-2 h-4 w-4" />
                {t('rewards')}
              </Link>
            </Button>
            <Button variant={isActive('/orders') ? "secondary" : "ghost"} className="w-full justify-start" asChild>
              <Link href="/orders">
                <ShoppingBag className="mr-2 h-4 w-4" />
                {t('orders')}
              </Link>
            </Button>
            <Button variant={isActive('/contact') ? "secondary" : "ghost"} className="w-full justify-start" asChild>
              <Link href="/contact">
                <Phone className="mr-2 h-4 w-4" />
                {t('contact')}
              </Link>
            </Button>
            <Button variant={isActive('/purchases') ? "secondary" : "ghost"} className="w-full justify-start" asChild>
              <Link href="/purchases">
                <ClipboardList className="mr-2 h-4 w-4" />
                {t('purchases')}
              </Link>
            </Button>
            <Button variant={isActive('/notifications') ? "secondary" : "ghost"} className="w-full justify-start" asChild>
              <Link href="/notifications">
                <Bell className="mr-2 h-4 w-4" />
                {t('notifications')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="px-3 py-2 mt-auto">
        {/* Logout moved to Header */}
      </div>
    </div>
  );
}
