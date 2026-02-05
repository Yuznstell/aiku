'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    MoreHorizontal,
    Edit3,
    Trash2,
    ArrowRight,
    Calendar,
    CheckSquare,
    X,
} from 'lucide-react';
import api from '@/lib/api';
import { Card, Modal, Input, Button } from '@/components/ui';
import { StatusSwitcher } from '@/components/StatusSwitcher';
import { TaskContextMenu } from '@/components/TaskContextMenu';
import { EmojiPicker } from '@/components/EmojiPicker';
import { Task, TaskStatus, TasksResponse } from '@/types';
import toast from 'react-hot-toast';

interface Column {
    id: TaskStatus;
    title: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

const COLUMNS: Column[] = [
    {
        id: 'TODO',
        title: 'To Do',
        color: 'text-rose-600',
        bgColor: 'bg-rose-100',
        borderColor: 'border-rose-200',
    },
    {
        id: 'DOING',
        title: 'Doing',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200',
    },
    {
        id: 'DONE',
        title: 'Done',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
        borderColor: 'border-emerald-200',
    },
];

export default function TasksPage() {
    const [tasks, setTasks] = useState<TasksResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

    // New task input
    const [activeInput, setActiveInput] = useState<TaskStatus | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Context menu
    const [contextMenu, setContextMenu] = useState<{
        task: Task;
        x: number;
        y: number;
    } | null>(null);

    // Edit modal
    const [editModal, setEditModal] = useState<{
        isOpen: boolean;
        task: Task | null;
        title: string;
    }>({ isOpen: false, task: null, title: '' });

    // Move submenu
    const [moveSubmenu, setMoveSubmenu] = useState(false);

    // Date created modal
    const [dateModal, setDateModal] = useState<{
        isOpen: boolean;
        task: Task | null;
    }>({ isOpen: false, task: null });

    // Icon picker
    const [iconPicker, setIconPicker] = useState<{
        isOpen: boolean;
        task: Task | null;
        position: { x: number; y: number };
    }>({ isOpen: false, task: null, position: { x: 0, y: 0 } });

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/tasks');
            setTasks(res.data.data);
        } catch (error) {
            toast.error('Failed to fetch tasks');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    useEffect(() => {
        if (activeInput && inputRef.current) {
            inputRef.current.focus();
        }
    }, [activeInput]);

    // Close context menu on click outside (handled by TaskContextMenu component itself)
    // No global handler needed - TaskContextMenu has its own mousedown handler

    // === CRUD Operations ===

    const handleCreateTask = async (status: TaskStatus) => {
        if (!newTaskTitle.trim()) {
            setActiveInput(null);
            return;
        }

        try {
            await api.post('/tasks', { title: newTaskTitle.trim(), status });
            toast.success('Task created');
            setNewTaskTitle('');
            setActiveInput(null);
            fetchTasks();
        } catch (error) {
            toast.error('Failed to create task');
        }
    };

    const handleUpdateTask = async () => {
        if (!editModal.task || !editModal.title.trim()) return;

        try {
            await api.put(`/tasks/${editModal.task.id}`, { title: editModal.title.trim() });
            toast.success('Task updated');
            setEditModal({ isOpen: false, task: null, title: '' });
            fetchTasks();
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleDeleteTask = async (task: Task) => {
        try {
            await api.delete(`/tasks/${task.id}`);
            toast.success('Task deleted');
            setContextMenu(null);
            fetchTasks();
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    const handleMoveTask = async (task: Task, newStatus: TaskStatus) => {
        try {
            await api.put(`/tasks/${task.id}/status`, { status: newStatus });
            toast.success('Task moved');
            setContextMenu(null);
            setMoveSubmenu(false);
            fetchTasks();
        } catch (error) {
            toast.error('Failed to move task');
        }
    };

    // === New Context Menu Actions ===

    const handleCopyLink = (taskId: string) => {
        const taskUrl = `${window.location.origin}/tasks?id=${taskId}`;
        navigator.clipboard.writeText(taskUrl);
        toast.success('Link copied to clipboard!');
    };

    const handleDuplicateTask = async (taskId: string) => {
        try {
            await api.post(`/tasks/${taskId}/duplicate`);
            toast.success('Task duplicated!');
            fetchTasks();
        } catch (error) {
            toast.error('Failed to duplicate task');
        }
    };

    const handleUpdateIcon = async (taskId: string, icon: string | null) => {
        try {
            await api.put(`/tasks/${taskId}`, { icon });
            toast.success(icon ? 'Icon updated!' : 'Icon removed!');
            fetchTasks();
        } catch (error) {
            toast.error('Failed to update icon');
        }
    };

    // === Drag and Drop ===

    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedTask(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
        e.preventDefault();
        setDragOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = async (e: React.DragEvent, columnId: TaskStatus) => {
        e.preventDefault();
        if (!draggedTask || draggedTask.status === columnId) {
            setDraggedTask(null);
            setDragOverColumn(null);
            return;
        }

        try {
            await api.put(`/tasks/${draggedTask.id}/status`, { status: columnId });
            toast.success('Task moved');
            fetchTasks();
        } catch (error) {
            toast.error('Failed to move task');
        }

        setDraggedTask(null);
        setDragOverColumn(null);
    };

    // === Context Menu ===

    const handleContextMenu = (e: React.MouseEvent, task: Task) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ task, x: e.clientX, y: e.clientY });
        setMoveSubmenu(false);
    };

    const getTasksForColumn = (columnId: TaskStatus): Task[] => {
        if (!tasks) return [];
        return tasks.grouped[columnId] || [];
    };

    const getCountForColumn = (columnId: TaskStatus): number => {
        if (!tasks) return 0;
        return tasks.counts[columnId] || 0;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 animate-pulse-soft">
                        <img
                            src="/logo.png"
                            alt="AIKU"
                            className="w-12 h-12 rounded-lg shadow-soft"
                        />
                    </div>
                    <div className="w-6 h-6 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <CheckSquare className="w-8 h-8 text-secondary-700" />
                    <h1 className="text-3xl font-bold text-secondary-900">Task List</h1>
                </div>
                <p className="text-secondary-500">
                    Use this template to track your personal tasks.
                </p>
                <p className="text-sm text-secondary-400 mt-1">
                    Click <span className="text-rose-500 font-medium">+ New page</span> to create a new task directly on this board.
                </p>
            </div>

            {/* Board View Badge */}
            <div className="mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary-100 rounded-md text-sm font-medium text-secondary-700">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    Board View
                </span>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4">
                {COLUMNS.map((column) => (
                    <div
                        key={column.id}
                        className={`flex-shrink-0 w-72 min-h-[400px] rounded-lg transition-colors ${dragOverColumn === column.id
                            ? 'bg-primary-50 ring-2 ring-primary-300'
                            : 'bg-secondary-50'
                            }`}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, column.id)}
                    >
                        {/* Column Header */}
                        <div className="p-3">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`px-2 py-0.5 rounded text-sm font-medium ${column.bgColor} ${column.color}`}
                                >
                                    {column.title}
                                </span>
                                <span className="text-sm text-secondary-500">
                                    {getCountForColumn(column.id)}
                                </span>
                            </div>
                        </div>

                        {/* Tasks */}
                        <div className="px-3 pb-3 space-y-2">
                            <AnimatePresence mode="popLayout">
                                {getTasksForColumn(column.id).map((task) => (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, task)}
                                        onDragEnd={handleDragEnd}
                                        className={`group bg-white rounded-lg border border-secondary-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${draggedTask?.id === task.id ? 'opacity-50' : ''
                                            }`}
                                    >
                                        <div className="p-3">
                                            {/* Status Switcher */}
                                            <div className="mb-2">
                                                <StatusSwitcher
                                                    currentStatus={task.status}
                                                    onStatusChange={(newStatus) => handleMoveTask(task, newStatus)}
                                                />
                                            </div>
                                            {/* Task Title & Actions */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 flex-1">
                                                    {task.icon && (
                                                        <span className="text-base">{task.icon}</span>
                                                    )}
                                                    <span
                                                        className="text-sm text-secondary-800 cursor-pointer hover:text-primary-600"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            setEditModal({
                                                                isOpen: true,
                                                                task,
                                                                title: task.title,
                                                            });
                                                        }}
                                                    >
                                                        {task.title}
                                                    </span>
                                                </div>
                                                <button
                                                    className="p-1.5 rounded hover:bg-secondary-100 transition-all z-10 relative"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        handleContextMenu(e, task);
                                                    }}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                >
                                                    <MoreHorizontal size={16} className="text-secondary-500 hover:text-secondary-700" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* New Task Input */}
                            {activeInput === column.id ? (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-lg border border-primary-300 shadow-sm"
                                >
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Task name..."
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreateTask(column.id);
                                            if (e.key === 'Escape') {
                                                setActiveInput(null);
                                                setNewTaskTitle('');
                                            }
                                        }}
                                        onBlur={() => {
                                            if (!newTaskTitle.trim()) {
                                                setActiveInput(null);
                                            }
                                        }}
                                        className="w-full p-3 text-sm border-none outline-none rounded-lg"
                                    />
                                    <div className="px-3 pb-2 flex gap-2">
                                        <button
                                            onClick={() => handleCreateTask(column.id)}
                                            className="px-3 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600"
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveInput(null);
                                                setNewTaskTitle('');
                                            }}
                                            className="px-3 py-1 text-xs text-secondary-600 hover:bg-secondary-100 rounded"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <button
                                    onClick={() => setActiveInput(column.id)}
                                    className="w-full p-2 text-left text-sm text-secondary-500 hover:bg-white hover:text-secondary-700 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    New page
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <TaskContextMenu
                        task={contextMenu.task}
                        position={{ x: contextMenu.x, y: contextMenu.y }}
                        onClose={() => setContextMenu(null)}
                        onCopyLink={handleCopyLink}
                        onDuplicate={handleDuplicateTask}
                        onMoveTo={handleMoveTask}
                        onEditIcon={(task) => {
                            setIconPicker({
                                isOpen: true,
                                task,
                                position: { x: contextMenu.x, y: contextMenu.y },
                            });
                        }}
                        onEdit={(task) => {
                            setEditModal({ isOpen: true, task, title: task.title });
                        }}
                        onDelete={handleDeleteTask}
                    />
                )}
            </AnimatePresence>

            {/* Emoji Picker */}
            <EmojiPicker
                isOpen={iconPicker.isOpen}
                currentEmoji={iconPicker.task?.icon}
                position={iconPicker.position}
                onSelect={(emoji) => {
                    if (iconPicker.task) {
                        handleUpdateIcon(iconPicker.task.id, emoji);
                    }
                }}
                onClose={() => setIconPicker({ isOpen: false, task: null, position: { x: 0, y: 0 } })}
            />

            {/* Edit Modal */}
            <Modal
                isOpen={editModal.isOpen}
                onClose={() => setEditModal({ isOpen: false, task: null, title: '' })}
                title="Rename Task"
            >
                <div className="space-y-4">
                    <Input
                        label="Task Name"
                        placeholder="Enter task name"
                        value={editModal.title}
                        onChange={(e) =>
                            setEditModal({ ...editModal, title: e.target.value })
                        }
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateTask();
                        }}
                    />
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() =>
                                setEditModal({ isOpen: false, task: null, title: '' })
                            }
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" className="flex-1" onClick={handleUpdateTask}>
                            Save
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Date Created Modal */}
            <Modal
                isOpen={dateModal.isOpen}
                onClose={() => setDateModal({ isOpen: false, task: null })}
                title="Task Properties"
            >
                <div className="space-y-4">
                    {dateModal.task && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-secondary-500 mb-1">
                                    Task Name
                                </label>
                                <p className="text-secondary-900 font-medium">
                                    {dateModal.task.title}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-500 mb-1">
                                    Date Created
                                </label>
                                <p className="text-secondary-900">
                                    {formatDate(dateModal.task.createdAt)}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-500 mb-1">
                                    Status
                                </label>
                                <span
                                    className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${COLUMNS.find((c) => c.id === dateModal.task?.status)
                                        ?.bgColor
                                        } ${COLUMNS.find((c) => c.id === dateModal.task?.status)?.color
                                        }`}
                                >
                                    {COLUMNS.find((c) => c.id === dateModal.task?.status)?.title}
                                </span>
                            </div>
                        </>
                    )}
                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setDateModal({ isOpen: false, task: null })}
                    >
                        Close
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
