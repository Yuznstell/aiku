'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-md"
            >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-primary-100 flex items-center justify-center mb-6">
                    <FileQuestion size={40} className="text-primary-500" />
                </div>

                <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
                <h2 className="text-xl font-semibold text-secondary-900 mb-2">
                    Page Not Found
                </h2>
                <p className="text-secondary-500 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => router.back()}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                    <Link href="/dashboard" className="btn-primary flex items-center gap-2">
                        <Home size={18} />
                        Dashboard
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
