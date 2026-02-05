'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    FileText,
    Users,
    Tag,
    MoreVertical,
    Edit,
    Trash2,
    Share2,
} from 'lucide-react';
import { useNoteStore } from '@/stores/noteStore';
import { Button, Input, Card } from '@/components/ui';
import toast from 'react-hot-toast';

export default function NotesPage() {
    const router = useRouter();
    const { notes, pagination, isLoading, fetchNotes, deleteNote } = useNoteStore();
    const [search, setSearch] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    useEffect(() => {
        fetchNotes({ search, tag: selectedTag });
    }, [fetchNotes, search, selectedTag]);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this note?')) {
            try {
                await deleteNote(id);
                toast.success('Note deleted');
            } catch (error) {
                toast.error('Failed to delete note');
            }
        }
        setMenuOpenId(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getContentPreview = (content: string) => {
        // Strip HTML tags and get first 100 characters
        const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return text.length > 100 ? text.slice(0, 100) + '...' : text;
    };

    // Get unique tags from all notes
    const allTags = [...new Set(notes.flatMap((note) => note.tags.map((t) => t.name)))];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 mb-1">Notes</h1>
                    <p className="text-secondary-500">
                        {pagination?.total || 0} notes total
                    </p>
                </div>
                <Link href="/notes/new">
                    <Button variant="primary" leftIcon={<Plus size={18} />}>
                        New Note
                    </Button>
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <Input
                        type="text"
                        placeholder="Search notes..."
                        leftIcon={<Search size={18} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {allTags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setSelectedTag('')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedTag === ''
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                                }`}
                        >
                            All
                        </button>
                        {allTags.slice(0, 5).map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(tag)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedTag === tag
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                                    }`}
                            >
                                <Tag size={12} className="inline mr-1" />
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Notes Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : notes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {notes.map((note, index) => (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card
                                    hover
                                    onClick={() => router.push(`/notes/${note.id}`)}
                                    className="relative group"
                                >
                                    {/* Menu button */}
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpenId(menuOpenId === note.id ? null : note.id);
                                            }}
                                            className="p-2 rounded-lg hover:bg-secondary-100"
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        <AnimatePresence>
                                            {menuOpenId === note.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-soft-lg border border-secondary-100 py-1 z-10"
                                                >
                                                    <Link
                                                        href={`/notes/${note.id}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                                                    >
                                                        <Edit size={14} /> Edit
                                                    </Link>
                                                    {note.permission === 'OWNER' && (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Open share modal
                                                                }}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                                                            >
                                                                <Share2 size={14} /> Share
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(note.id);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-red-50"
                                                            >
                                                                <Trash2 size={14} /> Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Note content */}
                                    <div className="pr-8">
                                        <h3 className="text-lg font-semibold text-secondary-900 mb-2 line-clamp-1">
                                            {note.title}
                                        </h3>
                                        <p className="text-sm text-secondary-500 mb-4 line-clamp-3">
                                            {getContentPreview(note.content)}
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-secondary-100">
                                        <div className="flex items-center gap-2">
                                            {note.tags.slice(0, 2).map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className="badge-primary text-xs"
                                                >
                                                    {tag.name}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-secondary-400">
                                            {note.isShared && (
                                                <span className="flex items-center gap-1">
                                                    <Users size={12} />
                                                    Shared
                                                </span>
                                            )}
                                            <span>{formatDate(note.updatedAt)}</span>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                >
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-secondary-100 flex items-center justify-center mb-4">
                        <FileText size={32} className="text-secondary-400" />
                    </div>
                    <h3 className="text-lg font-medium text-secondary-900 mb-2">No notes yet</h3>
                    <p className="text-secondary-500 mb-6">
                        Create your first note to get started
                    </p>
                    <Link href="/notes/new">
                        <Button variant="primary" leftIcon={<Plus size={18} />}>
                            Create Note
                        </Button>
                    </Link>
                </motion.div>
            )}
        </div>
    );
}
