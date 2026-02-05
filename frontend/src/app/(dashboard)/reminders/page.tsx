'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Bell,
    Check,
    Trash2,
    Clock,
    Repeat,
    Calendar,
} from 'lucide-react';
import api from '@/lib/api';
import { Button, Card, Input, Modal } from '@/components/ui';
import { Reminder } from '@/types';
import toast from 'react-hot-toast';

export default function RemindersPage() {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCompleted, setShowCompleted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        remindAt: '',
        repeatType: 'NONE',
    });

    useEffect(() => {
        fetchReminders();
    }, [showCompleted]);

    const fetchReminders = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/reminders', {
                params: { completed: showCompleted ? undefined : 'false' }
            });
            setReminders(res.data.data.reminders);
        } catch (error) {
            toast.error('Failed to fetch reminders');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.title || !formData.remindAt) {
            toast.error('Title and time are required');
            return;
        }

        try {
            await api.post('/reminders', formData);
            toast.success('Reminder created');
            setIsModalOpen(false);
            setFormData({ title: '', description: '', remindAt: '', repeatType: 'NONE' });
            fetchReminders();
        } catch (error) {
            toast.error('Failed to create reminder');
        }
    };

    const handleComplete = async (id: string, isCompleted: boolean) => {
        try {
            await api.put(`/reminders/${id}/complete`, { isCompleted: !isCompleted });
            toast.success(isCompleted ? 'Marked as pending' : 'Completed!');
            fetchReminders();
        } catch (error) {
            toast.error('Failed to update reminder');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this reminder?')) return;
        try {
            await api.delete(`/reminders/${id}`);
            toast.success('Reminder deleted');
            fetchReminders();
        } catch (error) {
            toast.error('Failed to delete reminder');
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isOverdue = (dateString: string) => {
        return new Date(dateString) < new Date();
    };

    const repeatLabels: Record<string, string> = {
        NONE: 'No repeat',
        DAILY: 'Daily',
        WEEKLY: 'Weekly',
        MONTHLY: 'Monthly',
        YEARLY: 'Yearly',
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 mb-1">Reminders</h1>
                    <p className="text-secondary-500">Stay on top of your tasks</p>
                </div>
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
                    New Reminder
                </Button>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setShowCompleted(false)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!showCompleted ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                        }`}
                >
                    <Clock size={14} className="inline mr-2" />
                    Pending
                </button>
                <button
                    onClick={() => setShowCompleted(true)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${showCompleted ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                        }`}
                >
                    <Check size={14} className="inline mr-2" />
                    Completed
                </button>
            </div>

            {/* Reminders List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : reminders.length > 0 ? (
                <div className="space-y-4">
                    <AnimatePresence>
                        {reminders.map((reminder, index) => (
                            <motion.div
                                key={reminder.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className={`flex items-center gap-4 ${reminder.isCompleted ? 'opacity-60' : ''}`}>
                                    <button
                                        onClick={() => handleComplete(reminder.id, reminder.isCompleted)}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${reminder.isCompleted
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-secondary-300 hover:border-primary-400'
                                            }`}
                                    >
                                        {reminder.isCompleted && <Check size={14} />}
                                    </button>

                                    <div className="flex-1">
                                        <h3 className={`font-medium ${reminder.isCompleted ? 'line-through text-secondary-500' : 'text-secondary-900'}`}>
                                            {reminder.title}
                                        </h3>
                                        {reminder.description && (
                                            <p className="text-sm text-secondary-500 mt-1">{reminder.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-secondary-400">
                                            <span className={`flex items-center gap-1 ${!reminder.isCompleted && isOverdue(reminder.remindAt) ? 'text-error' : ''}`}>
                                                <Calendar size={12} />
                                                {formatDateTime(reminder.remindAt)}
                                            </span>
                                            {reminder.repeatType !== 'NONE' && (
                                                <span className="flex items-center gap-1">
                                                    <Repeat size={12} />
                                                    {repeatLabels[reminder.repeatType]}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(reminder.id)}
                                        className="p-2 text-secondary-400 hover:text-error transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-secondary-100 flex items-center justify-center mb-4">
                        <Bell size={32} className="text-secondary-400" />
                    </div>
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">
                        {showCompleted ? 'No completed reminders' : 'No pending reminders'}
                    </h3>
                    <p className="text-secondary-500 mb-6">
                        {showCompleted ? 'Complete some reminders to see them here' : 'Create a reminder to get started'}
                    </p>
                    {!showCompleted && (
                        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
                            Create Reminder
                        </Button>
                    )}
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Reminder">
                <div className="space-y-4">
                    <Input
                        label="Title"
                        placeholder="What do you need to remember?"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <Input
                        label="Description (optional)"
                        placeholder="Add more details..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <Input
                        label="Date & Time"
                        type="datetime-local"
                        value={formData.remindAt}
                        onChange={(e) => setFormData({ ...formData, remindAt: e.target.value })}
                    />
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1.5">Repeat</label>
                        <select
                            value={formData.repeatType}
                            onChange={(e) => setFormData({ ...formData, repeatType: e.target.value })}
                            className="input"
                        >
                            <option value="NONE">No repeat</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" className="flex-1" onClick={handleCreate}>
                            Create Reminder
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
