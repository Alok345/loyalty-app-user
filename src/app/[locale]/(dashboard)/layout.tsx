"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter, useParams, usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CartProvider } from '@/components/CartProvider';
import { UserNav } from "@/components/dashboard/UserNav";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { useFCMToken } from "@/hooks/useFCMToken";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  // Register FCM token when user is authenticated
  useFCMToken();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && !user) {
      const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      const encodedRedirect = encodeURIComponent(currentUrl);
      router.push(`/${locale}/login?redirectTo=${encodedRedirect}`);
    }
  }, [user, isLoading, router, locale, pathname, searchParams]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <Sidebar className="w-full" />
      </aside>
      <div className="flex flex-col sm:gap-4 sm:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
          <MobileNav />
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <LanguageSwitcher />
            <UserNav />
          </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0">
          <CartProvider>
            {children}
          </CartProvider>
        </main>
      </div>
    </div>
  );
}
