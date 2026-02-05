'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    FileText,
    Calendar,
    Bell,
    MessageCircle,
    Activity,
    TrendingUp,
    Search,
    MoreVertical,
    Ban,
    Trash2,
    UserPlus,
    X,
    Eye,
    EyeOff,
} from 'lucide-react';
import api from '@/lib/api';
import { Card, Input, Avatar, Button } from '@/components/ui';
import { AdminStats, User, ActivityLog } from '@/types';
import toast from 'react-hot-toast';

export default function AdminPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview');

    // Add User Modal State
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER' as 'USER' | 'ADMIN',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, usersRes, activityRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users'),
                api.get('/admin/activity'),
            ]);
            setStats(statsRes.data.data);
            setUsers(usersRes.data.data.users);
            setActivities(activityRes.data.data.logs);
        } catch (error) {
            toast.error('Failed to fetch admin data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.name || !newUser.email || !newUser.password) {
            toast.error('Please fill all required fields');
            return;
        }

        setIsCreating(true);
        try {
            await api.post('/admin/users', newUser);
            toast.success('User created successfully');
            setShowAddUserModal(false);
            setNewUser({ name: '', email: '', password: '', role: 'USER' });
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create user');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success('User deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const handleToggleRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';

        try {
            await api.put(`/admin/users/${userId}`, { role: newRole });
            toast.success(`User role changed to ${newRole}`);
            fetchData();
        } catch (error) {
            toast.error('Failed to update user role');
        }
    };

    const statCards = stats ? [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-blue-600' },
        { label: 'Total Notes', value: stats.totalNotes, icon: FileText, color: 'from-purple-500 to-purple-600' },
        { label: 'Calendar Events', value: stats.totalEvents, icon: Calendar, color: 'from-green-500 to-green-600' },
        { label: 'Reminders', value: stats.totalReminders, icon: Bell, color: 'from-amber-500 to-amber-600' },
        { label: 'Messages', value: stats.totalMessages, icon: MessageCircle, color: 'from-pink-500 to-pink-600' },
        { label: 'Online Now', value: stats.onlineUsers, icon: TrendingUp, color: 'from-cyan-500 to-cyan-600' },
    ] : [];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-3xl font-bold text-secondary-900 mb-1">Admin Panel</h1>
                <p className="text-secondary-500">Manage users and monitor platform activity</p>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { id: 'overview', label: 'Overview', icon: TrendingUp },
                    { id: 'users', label: 'Users', icon: Users },
                    { id: 'activity', label: 'Activity', icon: Activity },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === tab.id
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {statCards.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="relative overflow-hidden">
                                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-10 -mr-8 -mt-8`} />
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                                            <stat.icon size={24} className="text-white" />
                                        </div>
                                        <p className="text-3xl font-bold text-secondary-900">{stat.value}</p>
                                        <p className="text-sm text-secondary-500">{stat.label}</p>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <Card>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-secondary-900">All Users</h2>
                                <div className="flex items-center gap-3">
                                    <div className="w-64">
                                        <Input
                                            placeholder="Search users..."
                                            leftIcon={<Search size={18} />}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        variant="primary"
                                        leftIcon={<UserPlus size={18} />}
                                        onClick={() => setShowAddUserModal(true)}
                                    >
                                        Add User
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-secondary-100">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">User</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">Email</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">Role</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">Joined</th>
                                            <th className="text-right py-3 px-4 text-sm font-medium text-secondary-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) => (
                                            <tr key={user.id} className="border-b border-secondary-50 hover:bg-secondary-50/50">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar src={user.avatar} name={user.name} size="sm" isOnline={user.isOnline} />
                                                        <span className="font-medium text-secondary-900">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-secondary-600">{user.email}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`badge ${user.role === 'ADMIN' ? 'badge-primary' : 'badge-success'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-secondary-500 text-sm">{formatDate(user.createdAt)}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggleRole(user.id, user.role)}
                                                        >
                                                            {user.role === 'ADMIN' ? 'Demote' : 'Promote'}
                                                        </Button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-2 text-secondary-400 hover:text-error transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                        <Card>
                            <h2 className="text-lg font-semibold text-secondary-900 mb-6">Recent Activity</h2>
                            <div className="space-y-4">
                                {activities.length > 0 ? (
                                    activities.map((log) => (
                                        <div key={log.id} className="flex items-start gap-4 p-4 bg-secondary-50 rounded-xl">
                                            <Avatar src={log.user?.avatar} name={log.user?.name || 'System'} size="sm" />
                                            <div className="flex-1">
                                                <p className="text-secondary-900">
                                                    <span className="font-medium">{log.user?.name || 'System'}</span>{' '}
                                                    {log.description}
                                                </p>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-secondary-400">
                                                    <span>{log.action}</span>
                                                    <span>•</span>
                                                    <span>{formatDate(log.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-secondary-400">
                                        <Activity size={40} className="mx-auto mb-2 opacity-50" />
                                        <p>No recent activity</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </>
            )}

            {/* Add User Modal */}
            <AnimatePresence>
                {showAddUserModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAddUserModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-soft-lg w-full max-w-md p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-secondary-900">Add New User</h2>
                                <button
                                    onClick={() => setShowAddUserModal(false)}
                                    className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Name *
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Enter full name"
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Email *
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="Enter email address"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Password *
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Min 6 characters"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                                        Role
                                    </label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'USER' | 'ADMIN' })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-secondary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                                    >
                                        <option value="USER">User</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setShowAddUserModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1"
                                        isLoading={isCreating}
                                    >
                                        Create User
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

