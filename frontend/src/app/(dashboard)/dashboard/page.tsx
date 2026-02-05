'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    FileText,
    Calendar,
    Bell,
    MessageCircle,
    Users,
    Plus,
    ArrowRight,
    TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { Button, Card } from '@/components/ui';

interface Stats {
    notes: number;
    events: number;
    reminders: number;
    friends: number;
}

interface UpcomingReminder {
    id: string;
    title: string;
    remindAt: string;
}

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<Stats>({ notes: 0, events: 0, reminders: 0, friends: 0 });
    const [upcomingReminders, setUpcomingReminders] = useState<UpcomingReminder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [notesRes, eventsRes, remindersRes, friendsRes] = await Promise.all([
                    api.get('/notes?limit=1'),
                    api.get('/calendar?limit=1'),
                    api.get('/reminders?upcoming=true&limit=5'),
                    api.get('/friends'),
                ]);

                setStats({
                    notes: notesRes.data.data.pagination?.total || 0,
                    events: eventsRes.data.data.pagination?.total || 0,
                    reminders: remindersRes.data.data.pagination?.total || 0,
                    friends: friendsRes.data.data?.length || 0,
                });

                setUpcomingReminders(remindersRes.data.data.reminders || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const statCards = [
        { label: 'Total Notes', value: stats.notes, icon: FileText, color: 'from-blue-500 to-blue-600', href: '/notes' },
        { label: 'Calendar Events', value: stats.events, icon: Calendar, color: 'from-purple-500 to-purple-600', href: '/calendar' },
        { label: 'Reminders', value: stats.reminders, icon: Bell, color: 'from-amber-500 to-amber-600', href: '/reminders' },
        { label: 'Friends', value: stats.friends, icon: Users, color: 'from-green-500 to-green-600', href: '/friends' },
    ];

    const quickActions = [
        { label: 'New Note', icon: FileText, href: '/notes/new', color: 'bg-primary-50 text-primary-600' },
        { label: 'Add Event', icon: Calendar, href: '/calendar', color: 'bg-purple-50 text-purple-600' },
        { label: 'Set Reminder', icon: Bell, href: '/reminders', color: 'bg-amber-50 text-amber-600' },
        { label: 'Start Chat', icon: MessageCircle, href: '/chat', color: 'bg-green-50 text-green-600' },
    ];

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                    {getGreeting()}, {user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-secondary-500">
                    Here's what's happening with your productivity today.
                </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link href={stat.href}>
                            <Card hover className="relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-10 -mr-8 -mt-8`} />
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                                    <stat.icon size={24} className="text-white" />
                                </div>
                                <p className="text-2xl font-bold text-secondary-900">
                                    {isLoading ? '-' : stat.value}
                                </p>
                                <p className="text-sm text-secondary-500">{stat.label}</p>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2"
                >
                    <Card>
                        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {quickActions.map((action) => (
                                <Link key={action.label} href={action.href}>
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`${action.color} rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-soft`}
                                    >
                                        <div className="w-10 h-10 mx-auto rounded-lg bg-white/50 flex items-center justify-center mb-2">
                                            <action.icon size={20} />
                                        </div>
                                        <p className="text-sm font-medium">{action.label}</p>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </Card>
                </motion.div>

                {/* Upcoming Reminders */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-secondary-900">Upcoming</h2>
                            <Link href="/reminders">
                                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                                    View All
                                </Button>
                            </Link>
                        </div>

                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 bg-secondary-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : upcomingReminders.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingReminders.slice(0, 4).map((reminder) => (
                                    <div
                                        key={reminder.id}
                                        className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                                            <Bell size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-secondary-900 truncate">
                                                {reminder.title}
                                            </p>
                                            <p className="text-xs text-secondary-500">
                                                {formatDate(reminder.remindAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-secondary-400">
                                <Bell size={40} className="mx-auto mb-2 opacity-50" />
                                <p>No upcoming reminders</p>
                                <Link href="/reminders">
                                    <Button variant="outline" size="sm" className="mt-4" leftIcon={<Plus size={14} />}>
                                        Add Reminder
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
