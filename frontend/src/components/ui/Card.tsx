'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
    children,
    className = '',
    hover = false,
    onClick,
}) => {
    // Always use div to prevent button nesting issues
    return (
        <motion.div
            whileHover={hover ? { y: -2, boxShadow: '0 10px 40px -3px rgba(0, 0, 0, 0.1)' } : undefined}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            className={`
        bg-white rounded-2xl shadow-soft p-6 w-full text-left
        ${hover ? 'cursor-pointer transition-shadow' : ''}
        ${className}
      `}
        >
            {children}
        </motion.div>
    );
};

export default Card;
