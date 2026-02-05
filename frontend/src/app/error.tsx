'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-md"
            >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-red-100 flex items-center justify-center mb-6">
                    <AlertCircle size={40} className="text-error" />
                </div>

                <h1 className="text-2xl font-bold text-secondary-900 mb-2">
                    Something went wrong
                </h1>
                <p className="text-secondary-500 mb-6">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="btn-primary flex items-center gap-2"
                    >
                        <RefreshCw size={18} />
                        Try Again
                    </button>
                    <Link href="/dashboard" className="btn-secondary flex items-center gap-2">
                        <Home size={18} />
                        Go Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
