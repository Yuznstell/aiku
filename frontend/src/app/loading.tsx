'use client';

import React from 'react';
import Image from 'next/image';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50">
            <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 animate-pulse-soft">
                    <Image
                        src="/logo.png"
                        alt="AIKU"
                        width={80}
                        height={80}
                        className="rounded-2xl shadow-soft-lg"
                        priority
                    />
                </div>
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto" />
                <p className="mt-4 text-secondary-500">Loading...</p>
            </div>
        </div>
    );
}

