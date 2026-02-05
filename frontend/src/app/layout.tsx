import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#6366f1',
};

export const metadata: Metadata = {
    title: 'AIKU - Productivity & Collaboration Platform',
    description: 'Daily notes, reminders, calendar, chat, and collaboration tools.',
    keywords: 'productivity, notes, calendar, reminders, collaboration, chat',
    manifest: '/manifest.json',
    icons: {
        icon: '/logo.png',
        shortcut: '/logo.png',
        apple: '/logo.png',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'AIKU',
    },
    formatDetection: {
        telephone: false,
    },
    openGraph: {
        title: 'AIKU - Productivity & Collaboration Platform',
        description: 'Daily notes, reminders, calendar, chat, and collaboration tools.',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* iOS PWA meta tags */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="AIKU" />
                <link rel="apple-touch-icon" href="/logo.png" />

                {/* Android PWA meta tags */}
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="application-name" content="AIKU" />
            </head>
            <body suppressHydrationWarning>
                {children}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#fff',
                            color: '#1e293b',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px -3px rgba(0, 0, 0, 0.1)',
                        },
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#fff',
                            },
                        },
                    }}
                />
                <ServiceWorkerRegistration />
            </body>
        </html>
    );
}

