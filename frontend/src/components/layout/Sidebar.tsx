'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    FileText,
    Calendar,
    Bell,
    Users,
    MessageCircle,
    Settings,
    LogOut,
    Shield,
    Menu,
    X,
    CheckSquare,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import Avatar from '@/components/ui/Avatar';

const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const { unreadCount } = useChatStore();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/notes', label: 'Notes', icon: FileText },
        { href: '/tasks', label: 'Tasks', icon: CheckSquare },
        { href: '/calendar', label: 'Calendar', icon: Calendar },
        { href: '/reminders', label: 'Reminders', icon: Bell },
        { href: '/friends', label: 'Friends', icon: Users },
        { href: '/chat', label: 'Chat', icon: MessageCircle, badge: unreadCount },
    ];

    const adminItems = [
        { href: '/admin', label: 'Admin Panel', icon: Shield },
    ];

    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="px-6 py-5 border-b border-secondary-100">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <Image
                        src="/logo.png"
                        alt="AIKU Logo"
                        width={40}
                        height={40}
                        className="rounded-xl"
                    />
                    <span className="text-xl font-bold text-gradient">AIKU</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                whileHover={{ x: 4 }}
                                className={active ? 'sidebar-item-active' : 'sidebar-item'}
                            >
                                <item.icon size={20} />
                                <span className="flex-1">{item.label}</span>
                                {item.badge ? (
                                    <span className="bg-error text-white text-xs rounded-full px-2 py-0.5 font-medium">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </span>
                                ) : null}
                            </motion.div>
                        </Link>
                    );
                })}

                {/* Admin section */}
                {user?.role === 'ADMIN' && (
                    <>
                        <div className="pt-4 pb-2 px-4">
                            <p className="text-xs font-semibold text-secondary-400 uppercase tracking-wider">
                                Admin
                            </p>
                        </div>
                        {adminItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link key={item.href} href={item.href}>
                                    <motion.div
                                        whileHover={{ x: 4 }}
                                        className={active ? 'sidebar-item-active' : 'sidebar-item'}
                                    >
                                        <item.icon size={20} />
                                        <span>{item.label}</span>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* Settings & User */}
            <div className="border-t border-secondary-100 p-3 space-y-1">
                <Link href="/settings">
                    <motion.div
                        whileHover={{ x: 4 }}
                        className={isActive('/settings') ? 'sidebar-item-active' : 'sidebar-item'}
                    >
                        <Settings size={20} />
                        <span>Settings</span>
                    </motion.div>
                </Link>

                <button
                    onClick={() => logout()}
                    className="sidebar-item w-full text-left text-error/80 hover:text-error hover:bg-red-50"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>

            {/* User Profile */}
            <div className="border-t border-secondary-100 p-4">
                <Link href="/settings" className="flex items-center gap-3 group">
                    <Avatar
                        src={user?.avatar}
                        name={user?.name || 'User'}
                        size="md"
                        isOnline
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-secondary-900 truncate group-hover:text-primary-600 transition-colors">
                            {user?.name}
                        </p>
                        <p className="text-xs text-secondary-500 truncate">
                            {user?.email}
                        </p>
                    </div>
                </Link>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-soft"
            >
                <Menu size={24} />
            </button>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-secondary-100 flex-col">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/50 z-40"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="lg:hidden fixed left-0 top-0 h-screen w-64 bg-white border-r border-secondary-100 flex flex-col z-50"
                        >
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-secondary-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
