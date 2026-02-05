'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Link2,
    Copy,
    ArrowRight,
    Edit3,
    Trash2,
    GripVertical,
    ChevronRight,
    Smile,
} from 'lucide-react';
import { Task, TaskStatus } from '@/types';

interface StatusOption {
    id: TaskStatus;
    label: string;
    emoji?: string;
    bgColor: string;
    textColor: string;
}

const STATUS_OPTIONS: StatusOption[] = [
    { id: 'TODO', label: 'To Do', bgColor: 'bg-rose-100', textColor: 'text-rose-700' },
    { id: 'DOING', label: 'Doing', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
    { id: 'DONE', label: 'Done', emoji: '✨', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
];

interface TaskContextMenuProps {
    task: Task;
    position: { x: number; y: number };
    onClose: () => void;
    onCopyLink: (taskId: string) => void;
    onDuplicate: (taskId: string) => void;
    onMoveTo: (task: Task, newStatus: TaskStatus) => void;
    onEditIcon: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
}

export function TaskContextMenu({
    task,
    position,
    onClose,
    onCopyLink,
    onDuplicate,
    onMoveTo,
    onEditIcon,
    onEdit,
    onDelete,
}: TaskContextMenuProps) {
    const [showMoveSubmenu, setShowMoveSubmenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on escape or click outside
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyboard = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                onDuplicate(task.id);
                onClose();
            }
            if (e.key === 'Delete') {
                e.preventDefault();
                onDelete(task);
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyboard);
        return () => document.removeEventListener('keydown', handleKeyboard);
    }, [task, onDuplicate, onDelete, onClose]);

    // Adjust position to stay within viewport
    const adjustedPosition = {
        x: Math.min(position.x, window.innerWidth - 220),
        y: Math.min(position.y, window.innerHeight - 300),
    };

    return (
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 w-52 bg-white rounded-lg shadow-xl border border-secondary-200 py-1 overflow-visible"
            style={{ top: adjustedPosition.y, left: adjustedPosition.x }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Copy Link */}
            <MenuItem
                icon={<Link2 size={14} />}
                label="Copy link"
                onClick={() => {
                    onCopyLink(task.id);
                    onClose();
                }}
            />

            {/* Duplicate */}
            <MenuItem
                icon={<Copy size={14} />}
                label="Duplicate"
                shortcut="Ctrl+D"
                onClick={() => {
                    onDuplicate(task.id);
                    onClose();
                }}
            />

            <Divider />

            {/* Edit Icon */}
            <MenuItem
                icon={<Smile size={14} />}
                label="Edit icon"
                onClick={() => {
                    onEditIcon(task);
                    onClose();
                }}
            />

            {/* Move to - with submenu */}
            <div
                className="relative"
                onMouseEnter={() => setShowMoveSubmenu(true)}
                onMouseLeave={() => setShowMoveSubmenu(false)}
            >
                <button
                    className="w-full px-3 py-2 flex items-center justify-between text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <ArrowRight size={14} />
                        Move to
                    </span>
                    <ChevronRight size={12} className="text-secondary-400" />
                </button>

                {/* Submenu */}
                <AnimatePresence>
                    {showMoveSubmenu && (
                        <motion.div
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -4 }}
                            className="absolute left-full top-0 ml-1 w-36 bg-white rounded-lg shadow-xl border border-secondary-200 py-1"
                        >
                            {STATUS_OPTIONS.filter((opt) => opt.id !== task.status).map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        onMoveTo(task, option.id);
                                        onClose();
                                    }}
                                    className="w-full px-3 py-2 flex items-center gap-2 text-sm hover:bg-secondary-50 transition-colors"
                                >
                                    <GripVertical size={12} className="text-secondary-300" />
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${option.bgColor} ${option.textColor}`}>
                                        {option.label}
                                        {option.emoji && ` ${option.emoji}`}
                                    </span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Divider />

            {/* Edit Title */}
            <MenuItem
                icon={<Edit3 size={14} />}
                label="Edit title"
                onClick={() => {
                    onEdit(task);
                    onClose();
                }}
            />

            <Divider />

            {/* Delete - destructive */}
            <MenuItem
                icon={<Trash2 size={14} />}
                label="Delete"
                shortcut="Del"
                destructive
                onClick={() => {
                    onDelete(task);
                    onClose();
                }}
            />
        </motion.div>
    );
}

// Helper components
function MenuItem({
    icon,
    label,
    shortcut,
    destructive = false,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    destructive?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                w-full px-3 py-2 flex items-center justify-between text-sm transition-colors
                ${destructive
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-secondary-700 hover:bg-secondary-50'
                }
            `}
        >
            <span className="flex items-center gap-2">
                {icon}
                {label}
            </span>
            {shortcut && (
                <span className="text-xs text-secondary-400">{shortcut}</span>
            )}
        </button>
    );
}

function Divider() {
    return <div className="my-1 border-t border-secondary-100" />;
}

export default TaskContextMenu;
