'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    Lock,
    Camera,
    Save,
    Shield,
    Bell,
    Moon,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { Button, Card, Input, Avatar } from '@/components/ui';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const { user, updateUser } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const handleUpdateProfile = async () => {
        if (!profileData.name.trim()) {
            toast.error('Name is required');
            return;
        }

        setIsUpdatingProfile(true);
        try {
            const res = await api.put('/auth/profile', { name: profileData.name });
            updateUser(res.data.data);
            toast.success('Profile updated');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsUpdatingPassword(true);
        try {
            await api.put('/auth/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            toast.success('Password updated');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const res = await api.post('/upload/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            updateUser({ avatar: res.data.data.url });
            toast.success('Avatar updated');
        } catch (error) {
            toast.error('Failed to upload avatar');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-secondary-900 mb-1">Settings</h1>
                <p className="text-secondary-500 mb-8">Manage your account preferences</p>
            </motion.div>

            <div className="space-y-6">
                {/* Profile Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card>
                        <h2 className="text-lg font-semibold text-secondary-900 mb-6 flex items-center gap-2">
                            <User size={20} />
                            Profile
                        </h2>

                        <div className="flex items-start gap-6 mb-6">
                            <div className="relative">
                                <Avatar src={user?.avatar} name={user?.name || ''} size="xl" />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingAvatar}
                                    className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-soft hover:bg-primary-600 transition-colors"
                                >
                                    {isUploadingAvatar ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Camera size={14} />
                                    )}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-secondary-900">{user?.name}</p>
                                <p className="text-sm text-secondary-500">{user?.email}</p>
                                <span className={`inline-block mt-2 badge ${user?.role === 'ADMIN' ? 'badge-primary' : 'badge-success'}`}>
                                    {user?.role}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Input
                                label="Full Name"
                                leftIcon={<User size={18} />}
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            />
                            <Input
                                label="Email"
                                leftIcon={<Mail size={18} />}
                                value={user?.email || ''}
                                disabled
                                helperText="Email cannot be changed"
                            />
                            <Button
                                variant="primary"
                                leftIcon={<Save size={18} />}
                                onClick={handleUpdateProfile}
                                isLoading={isUpdatingProfile}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </Card>
                </motion.div>

                {/* Security Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card>
                        <h2 className="text-lg font-semibold text-secondary-900 mb-6 flex items-center gap-2">
                            <Shield size={20} />
                            Security
                        </h2>

                        <div className="space-y-4">
                            <Input
                                label="Current Password"
                                type="password"
                                leftIcon={<Lock size={18} />}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="New Password"
                                    type="password"
                                    leftIcon={<Lock size={18} />}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                />
                                <Input
                                    label="Confirm New Password"
                                    type="password"
                                    leftIcon={<Lock size={18} />}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                />
                            </div>
                            <Button
                                variant="primary"
                                leftIcon={<Save size={18} />}
                                onClick={handleUpdatePassword}
                                isLoading={isUpdatingPassword}
                                disabled={!passwordData.currentPassword || !passwordData.newPassword}
                            >
                                Update Password
                            </Button>
                        </div>
                    </Card>
                </motion.div>

                {/* Preferences Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card>
                        <h2 className="text-lg font-semibold text-secondary-900 mb-6 flex items-center gap-2">
                            <Bell size={20} />
                            Preferences
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                                        <Bell size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-secondary-900">Email Notifications</p>
                                        <p className="text-sm text-secondary-500">Receive reminder notifications via email</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                                        <Moon size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-secondary-900">Dark Mode</p>
                                        <p className="text-sm text-secondary-500">Switch to dark theme</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                </label>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Account Info */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <Card className="bg-secondary-50">
                        <div className="text-center text-secondary-500 text-sm">
                            <p>Account created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                            <p className="mt-1">AIKU v1.0.0 • Made with ❤️</p>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
