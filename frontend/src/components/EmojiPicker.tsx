'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// Common emojis organized by category
const EMOJI_CATEGORIES = {
    'Frequent': ['📝', '✅', '⭐', '🎯', '💡', '🔥', '✨', '💪'],
    'Work': ['📋', '📊', '📁', '💼', '📧', '💻', '🖥️', '📱'],
    'Status': ['🚀', '⏳', '🔄', '⚡', '🎉', '🏆', '🎊', '✔️'],
    'Objects': ['📌', '🔖', '📎', '✏️', '🔑', '🔒', '📦', '🎁'],
    'Symbols': ['❤️', '💜', '💙', '💚', '💛', '🧡', '🖤', '🤍'],
    'Nature': ['🌟', '☀️', '🌙', '⚡', '🌈', '🍀', '🌸', '🌺'],
};

interface EmojiPickerProps {
    isOpen: boolean;
    currentEmoji?: string | null;
    onSelect: (emoji: string | null) => void;
    onClose: () => void;
    position?: { x: number; y: number };
}

export function EmojiPicker({ isOpen, currentEmoji, onSelect, onClose, position }: EmojiPickerProps) {
    const [activeCategory, setActiveCategory] = useState<string>('Frequent');
    const pickerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const categories = Object.keys(EMOJI_CATEGORIES);

    return (
        <AnimatePresence>
            <motion.div
                ref={pickerRef}
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="fixed z-[60] w-72 bg-white rounded-lg shadow-2xl border border-secondary-200 overflow-hidden"
                style={position ? { top: position.y, left: position.x } : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-secondary-100 bg-secondary-50">
                    <span className="text-sm font-medium text-secondary-700">Pick an icon</span>
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-secondary-200 transition-colors"
                    >
                        <X size={14} className="text-secondary-500" />
                    </button>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-1 px-2 py-2 border-b border-secondary-100 overflow-x-auto">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${activeCategory === cat
                                    ? 'bg-primary-100 text-primary-700 font-medium'
                                    : 'text-secondary-600 hover:bg-secondary-100'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Emoji Grid */}
                <div className="p-2 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-8 gap-1">
                        {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => {
                                    onSelect(emoji);
                                    onClose();
                                }}
                                className={`w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-secondary-100 transition-colors ${currentEmoji === emoji ? 'bg-primary-100 ring-2 ring-primary-300' : ''
                                    }`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer with Remove option */}
                <div className="px-3 py-2 border-t border-secondary-100 bg-secondary-50">
                    <button
                        onClick={() => {
                            onSelect(null);
                            onClose();
                        }}
                        className="w-full px-3 py-1.5 text-xs text-secondary-600 hover:bg-secondary-200 rounded transition-colors"
                    >
                        Remove icon
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default EmojiPicker;
