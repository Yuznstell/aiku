'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, GripVertical } from 'lucide-react';

export type TaskStatus = 'TODO' | 'DOING' | 'DONE';

interface StatusOption {
    id: TaskStatus;
    label: string;
    emoji?: string;
    bgColor: string;
    textColor: string;
    hoverBg: string;
}

const STATUS_OPTIONS: StatusOption[] = [
    {
        id: 'TODO',
        label: 'To Do',
        bgColor: 'bg-rose-100',
        textColor: 'text-rose-700',
        hoverBg: 'hover:bg-rose-50',
    },
    {
        id: 'DOING',
        label: 'Doing',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        hoverBg: 'hover:bg-amber-50',
    },
    {
        id: 'DONE',
        label: 'Done',
        emoji: '✨',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-700',
        hoverBg: 'hover:bg-emerald-50',
    },
];

interface StatusSwitcherProps {
    currentStatus: TaskStatus;
    onStatusChange: (newStatus: TaskStatus) => void;
    disabled?: boolean;
}

export function StatusSwitcher({ currentStatus, onStatusChange, disabled = false }: StatusSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentOption = STATUS_OPTIONS.find((opt) => opt.id === currentStatus) || STATUS_OPTIONS[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleSelect = (status: TaskStatus) => {
        if (status !== currentStatus) {
            onStatusChange(status);
        }
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative inline-block">
            {/* Status Label Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (!disabled) setIsOpen(!isOpen);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={disabled}
                className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                    transition-all duration-150 cursor-pointer
                    ${currentOption.bgColor} ${currentOption.textColor}
                    hover:ring-2 hover:ring-offset-1 hover:ring-secondary-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
            >
                {currentOption.label}
                {currentOption.emoji && <span>{currentOption.emoji}</span>}
                <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1 z-50 w-48 bg-white rounded-lg shadow-xl border border-secondary-200 py-1 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-3 py-2 border-b border-secondary-100">
                            <div className="flex items-center justify-between">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${currentOption.bgColor} ${currentOption.textColor}`}>
                                    {currentOption.label}
                                    {currentOption.emoji && <span>{currentOption.emoji}</span>}
                                </span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-secondary-400 hover:text-secondary-600 text-lg leading-none"
                                >
                                    ×
                                </button>
                            </div>
                            <p className="text-xs text-secondary-500 mt-1">Select an option or create one</p>
                        </div>

                        {/* Options */}
                        <div className="py-1">
                            {STATUS_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleSelect(option.id)}
                                    className={`
                                        w-full px-3 py-2 flex items-center gap-2 text-left
                                        transition-colors ${option.hoverBg}
                                    `}
                                >
                                    <GripVertical size={14} className="text-secondary-300" />
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${option.bgColor} ${option.textColor}`}>
                                        {option.label}
                                        {option.emoji && <span>{option.emoji}</span>}
                                    </span>
                                    {option.id === currentStatus && (
                                        <Check size={14} className="ml-auto text-primary-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default StatusSwitcher;
