'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading, error, clearError } = useAuthStore();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await login(formData);
            toast.success('Welcome back!');
            router.push('/dashboard');
        } catch (err) {
            toast.error('Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="mb-8">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <Image
                                src="/logo.png"
                                alt="AIKU Logo"
                                width={48}
                                height={48}
                                className="rounded-xl shadow-soft"
                            />
                            <span className="text-2xl font-bold text-gradient">AIKU</span>
                        </Link>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                        Welcome back
                    </h1>
                    <p className="text-secondary-500 mb-8">
                        Sign in to continue to your dashboard
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="Enter your email"
                            leftIcon={<Mail size={18} />}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            leftIcon={<Lock size={18} />}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-error"
                            >
                                {error}
                            </motion.p>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            isLoading={isLoading}
                            rightIcon={<ArrowRight size={18} />}
                            className="w-full"
                        >
                            Sign In
                        </Button>
                    </form>

                    {/* Register link */}
                    <p className="mt-6 text-center text-secondary-500">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-primary-600 font-medium hover:underline">
                            Sign up
                        </Link>
                    </p>
                </motion.div>
            </div>

            {/* Right side - Illustration */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center p-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center text-white"
                >
                    <Image
                        src="/logo.png"
                        alt="AIKU Logo"
                        width={128}
                        height={128}
                        className="mx-auto mb-8"
                    />
                    <h2 className="text-3xl font-bold mb-4">Your Productivity Hub</h2>
                    <p className="text-white/80 max-w-md mx-auto">
                        Notes, calendar, reminders, and chat — everything you need to stay organized and connected.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
