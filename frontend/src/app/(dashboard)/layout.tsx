'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
    const { fetchUnreadCount, subscribeToMessages, unsubscribeFromMessages } = useChatStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchUnreadCount();
            subscribeToMessages();

            return () => {
                unsubscribeFromMessages();
            };
        }
    }, [isAuthenticated, fetchUnreadCount, subscribeToMessages, unsubscribeFromMessages]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary-50">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 animate-pulse-soft">
                        <Image
                            src="/logo.png"
                            alt="AIKU"
                            width={64}
                            height={64}
                            className="rounded-xl shadow-soft"
                            priority
                        />
                    </div>
                    <div className="w-6 h-6 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-secondary-50">
            <Sidebar />
            <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
                {children}
            </main>
        </div>
    );
}

