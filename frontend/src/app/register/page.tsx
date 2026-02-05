'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const router = useRouter();
    const { register, isLoading, error, clearError } = useAuthStore();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [validationError, setValidationError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setValidationError('');

        if (formData.password !== formData.confirmPassword) {
            setValidationError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setValidationError('Password must be at least 6 characters');
            return;
        }

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });
            toast.success('Account created successfully!');
            router.push('/dashboard');
        } catch (err) {
            toast.error('Registration failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Illustration */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 to-primary-800 items-center justify-center p-12">
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
                    <h2 className="text-3xl font-bold mb-4">Start Your Journey</h2>
                    <p className="text-white/80 max-w-md mx-auto">
                        Join thousands of users who organize their life with AIKU. It's free to get started.
                    </p>
                </motion.div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
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
                        Create account
                    </h1>
                    <p className="text-secondary-500 mb-8">
                        Fill in your details to get started
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="Enter your name"
                            leftIcon={<User size={18} />}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />

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
                            placeholder="Create a password"
                            leftIcon={<Lock size={18} />}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            helperText="Must be at least 6 characters"
                            required
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="Confirm your password"
                            leftIcon={<Lock size={18} />}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                        />

                        {(error || validationError) && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-error"
                            >
                                {error || validationError}
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
                            Create Account
                        </Button>
                    </form>

                    {/* Login link */}
                    <p className="mt-6 text-center text-secondary-500">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary-600 font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
