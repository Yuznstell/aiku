'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
    ArrowLeft,
    Save,
    Bold,
    Italic,
    List,
    ListOrdered,
    Code,
    Quote,
    Heading1,
    Heading2,
    Tag,
    X,
    Share2,
    Trash2,
    Users,
    Image as ImageIcon,
} from 'lucide-react';
import { useNoteStore } from '@/stores/noteStore';
import { Button, Input, Modal, Avatar } from '@/components/ui';
import api from '@/lib/api';
import { Friend } from '@/types';
import toast from 'react-hot-toast';

export default function NoteDetailPage() {
    const params = useParams();
    const router = useRouter();
    const noteId = params.id as string;

    const { currentNote, fetchNote, updateNote, deleteNote, shareNote, removeShare, isLoading } = useNoteStore();

    const [title, setTitle] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedPermission, setSelectedPermission] = useState<'EDITOR' | 'VIEWER'>('VIEWER');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: 'Start writing...' }),
            Link.configure({ openOnClick: false }),
            Image.configure({ inline: true, allowBase64: false }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px]',
            },
        },
    });

    const [pendingContent, setPendingContent] = useState<string | null>(null);

    useEffect(() => {
        if (noteId) {
            loadNote();
        }
    }, [noteId]);

    // Set content when editor becomes ready
    useEffect(() => {
        if (editor && pendingContent !== null) {
            editor.commands.setContent(pendingContent);
            setPendingContent(null);
        }
    }, [editor, pendingContent]);

    const loadNote = async () => {
        try {
            const note = await fetchNote(noteId);
            setTitle(note.title);
            setTags(note.tags.map(t => t.name));
            // Store content - will be set when editor is ready
            if (editor) {
                editor.commands.setContent(note.content);
            } else {
                setPendingContent(note.content);
            }
        } catch (error) {
            toast.error('Failed to load note');
            router.push('/notes');
        }
    };

    const fetchFriends = async () => {
        try {
            const res = await api.get('/friends');
            setFriends(res.data.data);
        } catch (error) {
            console.error('Failed to fetch friends');
        }
    };

    useEffect(() => {
        if (isShareModalOpen) {
            fetchFriends();
        }
    }, [isShareModalOpen]);

    const handleAddTag = () => {
        const trimmedTag = tagInput.trim().toLowerCase();
        if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
            setTags([...tags, trimmedTag]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Please enter a title');
            return;
        }

        setIsSaving(true);
        try {
            await updateNote(noteId, {
                title: title.trim(),
                content: editor?.getHTML() || '',
                tags,
            });
            toast.success('Note saved!');
        } catch (error) {
            toast.error('Failed to save note');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await deleteNote(noteId);
            toast.success('Note deleted');
            router.push('/notes');
        } catch (error) {
            toast.error('Failed to delete note');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        setIsUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('folder', 'aiku/notes');

            const response = await api.post('/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const imageUrl = response.data.data.url;
            editor?.chain().focus().setImage({ src: imageUrl }).run();
            toast.success('Image uploaded!');
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setIsUploadingImage(false);
            if (imageInputRef.current) imageInputRef.current.value = '';
        }
    };

    const handleShare = async (userId: string) => {
        try {
            await shareNote(noteId, userId, selectedPermission);
            toast.success('Note shared!');
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleRemoveShare = async (userId: string) => {
        try {
            await removeShare(noteId, userId);
            toast.success('Share removed');
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const isOwner = currentNote?.permission === 'OWNER';
    const canEdit = currentNote?.permission === 'OWNER' || currentNote?.permission === 'EDITOR';

    const MenuButton = ({ onClick, isActive = false, children, disabled = false }: any) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-primary-100 text-primary-600' : 'hover:bg-secondary-100 text-secondary-600'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {children}
        </button>
    );

    if (isLoading && !currentNote) {
        return (
            <div className="p-8">
                <div className="h-10 w-32 bg-secondary-200 rounded-lg animate-pulse mb-6" />
                <div className="bg-white rounded-2xl p-6 animate-pulse">
                    <div className="h-8 w-1/2 bg-secondary-200 rounded mb-4" />
                    <div className="space-y-2">
                        <div className="h-4 bg-secondary-100 rounded w-full" />
                        <div className="h-4 bg-secondary-100 rounded w-3/4" />
                        <div className="h-4 bg-secondary-100 rounded w-1/2" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => router.push('/notes')}
                    className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Notes</span>
                </button>
                <div className="flex items-center gap-2">
                    {isOwner && (
                        <>
                            <Button variant="outline" leftIcon={<Share2 size={18} />} onClick={() => setIsShareModalOpen(true)}>
                                Share
                            </Button>
                            <Button variant="ghost" className="text-error" onClick={handleDelete}>
                                <Trash2 size={18} />
                            </Button>
                        </>
                    )}
                    {canEdit && (
                        <Button variant="primary" leftIcon={<Save size={18} />} onClick={handleSave} isLoading={isSaving}>
                            Save
                        </Button>
                    )}
                </div>
            </div>

            {/* Shared badge */}
            {currentNote?.isShared && (
                <div className="mb-4 flex items-center gap-2 text-sm text-secondary-500">
                    <Users size={16} />
                    Shared with {currentNote.shares?.length || 0} people
                    {!isOwner && <span className="badge-primary ml-2">{currentNote.permission}</span>}
                </div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-soft">
                {/* Title */}
                <div className="p-6 border-b border-secondary-100">
                    <input
                        type="text"
                        placeholder="Untitled Note"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={!canEdit}
                        className="w-full text-2xl font-bold text-secondary-900 placeholder-secondary-300 focus:outline-none disabled:bg-transparent"
                    />
                </div>

                {/* Tags */}
                <div className="px-6 py-4 border-b border-secondary-100">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Tag size={16} className="text-secondary-400" />
                        {tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-600 rounded-lg text-sm">
                                {tag}
                                {canEdit && (
                                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-primary-800">
                                        <X size={12} />
                                    </button>
                                )}
                            </span>
                        ))}
                        {canEdit && tags.length < 5 && (
                            <input
                                type="text"
                                placeholder="Add tag..."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTag();
                                    }
                                }}
                                className="text-sm text-secondary-600 placeholder-secondary-400 focus:outline-none"
                            />
                        )}
                    </div>
                </div>

                {/* Toolbar */}
                {canEdit && (
                    <div className="px-6 py-3 border-b border-secondary-100 flex items-center gap-1 overflow-x-auto">
                        <MenuButton onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor?.isActive('heading', { level: 1 })}>
                            <Heading1 size={18} />
                        </MenuButton>
                        <MenuButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor?.isActive('heading', { level: 2 })}>
                            <Heading2 size={18} />
                        </MenuButton>
                        <div className="w-px h-6 bg-secondary-200 mx-1" />
                        <MenuButton onClick={() => editor?.chain().focus().toggleBold().run()} isActive={editor?.isActive('bold')}>
                            <Bold size={18} />
                        </MenuButton>
                        <MenuButton onClick={() => editor?.chain().focus().toggleItalic().run()} isActive={editor?.isActive('italic')}>
                            <Italic size={18} />
                        </MenuButton>
                        <MenuButton onClick={() => editor?.chain().focus().toggleCode().run()} isActive={editor?.isActive('code')}>
                            <Code size={18} />
                        </MenuButton>
                        <div className="w-px h-6 bg-secondary-200 mx-1" />
                        <MenuButton onClick={() => editor?.chain().focus().toggleBulletList().run()} isActive={editor?.isActive('bulletList')}>
                            <List size={18} />
                        </MenuButton>
                        <MenuButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} isActive={editor?.isActive('orderedList')}>
                            <ListOrdered size={18} />
                        </MenuButton>
                        <MenuButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} isActive={editor?.isActive('blockquote')}>
                            <Quote size={18} />
                        </MenuButton>
                        <div className="w-px h-6 bg-secondary-200 mx-1" />
                        <MenuButton
                            onClick={() => imageInputRef.current?.click()}
                            disabled={isUploadingImage}
                        >
                            {isUploadingImage ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <ImageIcon size={18} />
                            )}
                        </MenuButton>
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>
                )}

                {/* Editor */}
                <div className="p-6">
                    <EditorContent editor={editor} />
                </div>
            </motion.div>

            {/* Share Modal */}
            <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Note">
                <div className="space-y-4">
                    {/* Current shares */}
                    {currentNote?.shares && currentNote.shares.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-secondary-700 mb-2">Shared with</p>
                            <div className="space-y-2">
                                {currentNote.shares.map((share) => (
                                    <div key={share.id} className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl">
                                        <Avatar src={share.user.avatar} name={share.user.name} size="sm" />
                                        <div className="flex-1">
                                            <p className="font-medium text-secondary-900">{share.user.name}</p>
                                            <p className="text-xs text-secondary-500">{share.permission}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => handleRemoveShare(share.user.id)}>
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add new share */}
                    <div>
                        <p className="text-sm font-medium text-secondary-700 mb-2">Add people</p>
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => setSelectedPermission('VIEWER')}
                                className={`px-3 py-1.5 rounded-lg text-sm ${selectedPermission === 'VIEWER' ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-600'
                                    }`}
                            >
                                Viewer
                            </button>
                            <button
                                onClick={() => setSelectedPermission('EDITOR')}
                                className={`px-3 py-1.5 rounded-lg text-sm ${selectedPermission === 'EDITOR' ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-600'
                                    }`}
                            >
                                Editor
                            </button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {friends
                                .filter((f) => !currentNote?.shares?.some((s) => s.user.id === f.friend.id))
                                .map((friend) => (
                                    <div key={friend.id} className="flex items-center gap-3 p-3 bg-secondary-50 rounded-xl">
                                        <Avatar src={friend.friend.avatar} name={friend.friend.name} size="sm" />
                                        <div className="flex-1">
                                            <p className="font-medium text-secondary-900">{friend.friend.name}</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleShare(friend.friend.id)}>
                                            Share
                                        </Button>
                                    </div>
                                ))}
                            {friends.length === 0 && (
                                <p className="text-center text-secondary-400 py-4">Add friends first to share notes</p>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
