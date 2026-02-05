'use client';

import React from 'react';
import Image from 'next/image';

interface AvatarProps {
    src?: string | null;
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isOnline?: boolean;
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
    src,
    name,
    size = 'md',
    isOnline,
    className = '',
}) => {
    const sizes = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-xl',
    };

    const statusSizes = {
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
        xl: 'w-4 h-4',
    };

    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // Handle local upload paths by prepending server URL (not API URL)
    const getAvatarUrl = (avatarSrc: string | null | undefined): string | null => {
        if (!avatarSrc) return null;
        // If it's a relative path (starts with /uploads), prepend server URL
        if (avatarSrc.startsWith('/uploads')) {
            // Use socket URL which is the base server URL without /api
            const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5029';
            return `${serverUrl}${avatarSrc}`;
        }
        return avatarSrc;
    };

    const avatarUrl = getAvatarUrl(src);

    return (
        <div className={`relative inline-block ${className}`}>
            <div
                className={`
          ${sizes[size]}
          rounded-full bg-gradient-to-br from-primary-400 to-primary-600
          flex items-center justify-center text-white font-medium
          overflow-hidden ring-2 ring-white shadow-sm
        `}
            >
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt={name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <span>{initials}</span>
                )}
            </div>
            {isOnline !== undefined && (
                <span
                    className={`
            absolute bottom-0 right-0 block
            ${statusSizes[size]}
            rounded-full ring-2 ring-white
            ${isOnline ? 'bg-green-500' : 'bg-secondary-300'}
          `}
                />
            )}
        </div>
    );
};

export default Avatar;
