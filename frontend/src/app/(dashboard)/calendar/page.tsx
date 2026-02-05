'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    Bell,
    MoreHorizontal,
    Trash2,
    Edit3,
} from 'lucide-react';
import api from '@/lib/api';
import { Button, Card, Modal, Input } from '@/components/ui';
import { CalendarEvent } from '@/types';
import toast from 'react-hot-toast';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        color: '#6366f1',
        reminderMinutes: null as number | null,
    });

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        event: CalendarEvent;
        x: number;
        y: number;
    } | null>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // Edit mode state
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        try {
            const res = await api.get('/calendar', {
                params: {
                    startDate: startOfMonth.toISOString(),
                    endDate: endOfMonth.toISOString(),
                },
            });
            setEvents(res.data.data.events);
        } catch (error) {
            toast.error('Failed to fetch events');
        } finally {
            setIsLoading(false);
        }
    }, [currentDate]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const goToPrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const days = [];

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ date: daysInPrevMonth - i, isCurrentMonth: false, isPrevMonth: true });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ date: i, isCurrentMonth: true, isPrevMonth: false });
        }

        // Next month days
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ date: i, isCurrentMonth: false, isPrevMonth: false });
        }

        return days;
    };

    const getEventsForDay = (day: number, isCurrentMonth: boolean) => {
        if (!isCurrentMonth) return [];
        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return events.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate.toDateString() === dayDate.toDateString();
        });
    };

    const isToday = (day: number, isCurrentMonth: boolean) => {
        if (!isCurrentMonth) return false;
        const today = new Date();
        return day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();
    };

    const handleDayClick = (day: number, isCurrentMonth: boolean) => {
        if (!isCurrentMonth) return;
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(clickedDate);

        // FIX: Format date as local time string (YYYY-MM-DDTHH:MM) to avoid timezone conversion
        // Using toISOString() would convert to UTC, causing off-by-one date errors for UTC+ timezones
        const formatLocalDateTime = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const dayStr = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${dayStr}T${hours}:${minutes}`;
        };

        const startDate = new Date(clickedDate);
        startDate.setHours(9, 0, 0, 0); // Default to 9:00 AM

        const endDate = new Date(startDate);
        endDate.setHours(10, 0, 0, 0); // Default to 10:00 AM (1 hour later)

        setFormData({
            ...formData,
            startTime: formatLocalDateTime(startDate),
            endTime: formatLocalDateTime(endDate),
        });
        setIsModalOpen(true);
    };

    const handleCreate = async () => {
        if (!formData.title || !formData.startTime || !formData.endTime) {
            toast.error('Title and times are required');
            return;
        }

        try {
            if (editingEvent) {
                // Update existing event
                await api.put(`/calendar/${editingEvent.id}`, formData);
                toast.success('Event updated');
                setEditingEvent(null);
            } else {
                // Create new event
                await api.post('/calendar', formData);
                toast.success('Event created');
            }
            setIsModalOpen(false);
            setFormData({ title: '', description: '', startTime: '', endTime: '', color: '#6366f1', reminderMinutes: null });
            fetchEvents();
        } catch (error) {
            toast.error(editingEvent ? 'Failed to update event' : 'Failed to create event');
        }
    };

    // Delete event handler
    const handleDeleteEvent = async (eventId: string) => {
        try {
            await api.delete(`/calendar/${eventId}`);
            toast.success('Event deleted');
            setContextMenu(null);
            fetchEvents();
        } catch (error) {
            toast.error('Failed to delete event');
        }
    };

    // Edit event handler
    const handleEditEvent = (event: CalendarEvent) => {
        const formatLocalDateTime = (dateStr: string): string => {
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const dayStr = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${dayStr}T${hours}:${minutes}`;
        };

        setFormData({
            title: event.title,
            description: event.description || '',
            startTime: formatLocalDateTime(event.startTime),
            endTime: formatLocalDateTime(event.endTime),
            color: event.color,
            reminderMinutes: null,
        });
        setEditingEvent(event);
        setContextMenu(null);
        setIsModalOpen(true);
    };

    // Context menu handler
    const handleEventContextMenu = (e: React.MouseEvent, event: CalendarEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ event, x: e.clientX, y: e.clientY });
    };

    // Close context menu on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const colorOptions = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4'];
    const reminderOptions = [
        { value: null, label: 'No reminder' },
        { value: 5, label: '5 minutes before' },
        { value: 15, label: '15 minutes before' },
        { value: 30, label: '30 minutes before' },
        { value: 60, label: '1 hour before' },
        { value: 1440, label: '1 day before' },
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 mb-1">Calendar</h1>
                    <p className="text-secondary-500">Manage your schedule</p>
                </div>
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
                    New Event
                </Button>
            </div>

            <Card className="overflow-hidden">
                {/* Calendar Header */}
                <div className="flex items-center justify-between p-4 border-b border-secondary-100">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-secondary-900">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={goToToday}>Today</Button>
                        <button onClick={goToPrevMonth} className="btn-icon">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={goToNextMonth} className="btn-icon">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-secondary-100">
                    {DAYS.map(day => (
                        <div key={day} className="p-3 text-center text-sm font-medium text-secondary-500">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7">
                    {getDaysInMonth().map((day, index) => {
                        const dayEvents = getEventsForDay(day.date, day.isCurrentMonth);
                        const today = isToday(day.date, day.isCurrentMonth);

                        return (
                            <motion.div
                                key={index}
                                whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
                                onClick={() => handleDayClick(day.date, day.isCurrentMonth)}
                                className={`
                  min-h-[100px] p-2 border-b border-r border-secondary-100 cursor-pointer
                  ${!day.isCurrentMonth ? 'bg-secondary-50/50' : ''}
                `}
                            >
                                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1
                  ${today ? 'bg-primary-500 text-white' : ''}
                  ${!day.isCurrentMonth ? 'text-secondary-300' : 'text-secondary-700'}
                `}>
                                    {day.date}
                                </div>
                                <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map(event => (
                                        <div
                                            key={event.id}
                                            className="group relative text-xs px-1.5 py-0.5 rounded truncate text-white flex items-center justify-between"
                                            style={{ backgroundColor: event.color }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span className="truncate flex-1">{event.title}</span>
                                            <button
                                                onClick={(e) => handleEventContextMenu(e, event)}
                                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/20 transition-opacity ml-1 flex-shrink-0"
                                            >
                                                <MoreHorizontal size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-xs text-secondary-400 px-1">
                                            +{dayEvents.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </Card>

            {/* Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        ref={contextMenuRef}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed z-50 bg-white rounded-lg shadow-xl border border-secondary-200 py-1 min-w-[150px]"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button
                            onClick={() => handleEditEvent(contextMenu.event)}
                            className="w-full px-3 py-2 flex items-center gap-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                        >
                            <Edit3 size={14} />
                            Edit event
                        </button>
                        <div className="border-t border-secondary-100 my-1" />
                        <button
                            onClick={() => handleDeleteEvent(contextMenu.event.id)}
                            className="w-full px-3 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={14} />
                            Delete
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create/Edit Event Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingEvent(null);
                    setFormData({ title: '', description: '', startTime: '', endTime: '', color: '#6366f1', reminderMinutes: null });
                }}
                title={editingEvent ? "Edit Event" : "New Event"}
            >
                <div className="space-y-4">
                    <Input
                        label="Title"
                        placeholder="Event title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <Input
                        label="Description (optional)"
                        placeholder="Add description..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Time"
                            type="datetime-local"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        />
                        <Input
                            label="End Time"
                            type="datetime-local"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">Color</label>
                        <div className="flex gap-2">
                            {colorOptions.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-8 h-8 rounded-full transition-transform ${formData.color === color ? 'scale-110 ring-2 ring-offset-2 ring-primary-400' : ''
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            <Bell size={14} className="inline mr-1" />
                            Reminder
                        </label>
                        <select
                            value={formData.reminderMinutes ?? ''}
                            onChange={(e) => setFormData({ ...formData, reminderMinutes: e.target.value ? Number(e.target.value) : null })}
                            className="input w-full"
                        >
                            {reminderOptions.map(option => (
                                <option key={option.value ?? 'none'} value={option.value ?? ''}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => {
                                setIsModalOpen(false);
                                setEditingEvent(null);
                                setFormData({ title: '', description: '', startTime: '', endTime: '', color: '#6366f1', reminderMinutes: null });
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" className="flex-1" onClick={handleCreate}>
                            {editingEvent ? 'Update Event' : 'Create Event'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
