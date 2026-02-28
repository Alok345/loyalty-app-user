import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "../globals.css";
import { AuthProvider } from '@/components/AuthProvider';
import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
    title: "Shubh Nirman",
    description: "Auspicious Construction Loyalty App",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Shubh Nirman",
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    themeColor: "#002b5b",
    viewportFit: "cover",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};


export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const messages = await getMessages();

    return (
        <html lang={locale}>
            <body className="antialiased min-h-screen bg-muted/40">
                <AuthProvider>
                    <NextIntlClientProvider messages={messages}>
                        {children}
                    </NextIntlClientProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
