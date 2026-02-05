'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
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
} from 'lucide-react';
import { useNoteStore } from '@/stores/noteStore';
import { Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';

export default function NewNotePage() {
    const router = useRouter();
    const { createNote, isLoading } = useNoteStore();

    const [title, setTitle] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start writing your note...',
            }),
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px]',
            },
        },
    });

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

        try {
            const note = await createNote({
                title: title.trim(),
                content: editor?.getHTML() || '',
                tags,
            });
            toast.success('Note created!');
            router.push(`/notes/${note.id}`);
        } catch (error) {
            toast.error('Failed to create note');
        }
    };

    const MenuButton = ({
        onClick,
        isActive = false,
        children
    }: {
        onClick: () => void;
        isActive?: boolean;
        children: React.ReactNode;
    }) => (
        <button
            type="button"
            onClick={onClick}
            className={`p-2 rounded-lg transition-colors ${isActive
                    ? 'bg-primary-100 text-primary-600'
                    : 'hover:bg-secondary-100 text-secondary-600'
                }`}
        >
            {children}
        </button>
    );

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Back</span>
                </button>
                <Button
                    variant="primary"
                    leftIcon={<Save size={18} />}
                    onClick={handleSave}
                    isLoading={isLoading}
                >
                    Save Note
                </Button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-soft"
            >
                {/* Title */}
                <div className="p-6 border-b border-secondary-100">
                    <input
                        type="text"
                        placeholder="Untitled Note"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-2xl font-bold text-secondary-900 placeholder-secondary-300 focus:outline-none"
                    />
                </div>

                {/* Tags */}
                <div className="px-6 py-4 border-b border-secondary-100">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Tag size={16} className="text-secondary-400" />
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-600 rounded-lg text-sm"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    className="hover:text-primary-800"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        {tags.length < 5 && (
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
                <div className="px-6 py-3 border-b border-secondary-100 flex items-center gap-1 overflow-x-auto">
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                        isActive={editor?.isActive('heading', { level: 1 })}
                    >
                        <Heading1 size={18} />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor?.isActive('heading', { level: 2 })}
                    >
                        <Heading2 size={18} />
                    </MenuButton>
                    <div className="w-px h-6 bg-secondary-200 mx-1" />
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        isActive={editor?.isActive('bold')}
                    >
                        <Bold size={18} />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        isActive={editor?.isActive('italic')}
                    >
                        <Italic size={18} />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleCode().run()}
                        isActive={editor?.isActive('code')}
                    >
                        <Code size={18} />
                    </MenuButton>
                    <div className="w-px h-6 bg-secondary-200 mx-1" />
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        isActive={editor?.isActive('bulletList')}
                    >
                        <List size={18} />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        isActive={editor?.isActive('orderedList')}
                    >
                        <ListOrdered size={18} />
                    </MenuButton>
                    <MenuButton
                        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                        isActive={editor?.isActive('blockquote')}
                    >
                        <Quote size={18} />
                    </MenuButton>
                </div>

                {/* Editor */}
                <div className="p-6">
                    <EditorContent editor={editor} />
                </div>
            </motion.div>
        </div>
    );
}
