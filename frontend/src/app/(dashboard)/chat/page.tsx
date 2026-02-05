'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Image as ImageIcon,
    Search,
    Phone,
    Video,
    MoreVertical,
    Smile,
    Paperclip,
} from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { Avatar, Input, Button } from '@/components/ui';
import { Friend, Conversation } from '@/types';
import toast from 'react-hot-toast';

export default function ChatPage() {
    const { user } = useAuthStore();
    const {
        conversations,
        messages,
        currentChatUserId,
        fetchConversations,
        fetchMessages,
        sendMessage,
        markAsRead,
        setCurrentChat,
    } = useChatStore();

    const [friends, setFriends] = useState<Friend[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchConversations();
        fetchFriends();
    }, [fetchConversations]);

    useEffect(() => {
        if (currentChatUserId) {
            fetchMessages(currentChatUserId);
            markAsRead(currentChatUserId);
        }
    }, [currentChatUserId, fetchMessages, markAsRead]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchFriends = async () => {
        try {
            const res = await api.get('/friends');
            setFriends(res.data.data);
        } catch (error) {
            console.error('Failed to fetch friends');
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !currentChatUserId) return;

        setIsSending(true);
        try {
            await sendMessage(currentChatUserId, messageInput.trim());
            setMessageInput('');
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const currentChatFriend = friends.find(f => f.friend.id === currentChatUserId)?.friend;

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const combinedContacts = [
        ...conversations.map(c => ({
            id: c.partner.id,
            name: c.partner.name,
            avatar: c.partner.avatar,
            isOnline: c.partner.isOnline,
            lastMessage: c.lastMessage.content || (c.lastMessage.imageUrl ? '📷 Photo' : ''),
            unreadCount: c.unreadCount,
            time: c.lastMessage.createdAt,
        })),
        ...friends
            .filter(f => !conversations.some(c => c.partner.id === f.friend.id))
            .map(f => ({
                id: f.friend.id,
                name: f.friend.name,
                avatar: f.friend.avatar,
                isOnline: f.friend.isOnline,
                lastMessage: null,
                unreadCount: 0,
                time: null,
            })),
    ];

    const filteredContacts = combinedContacts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-screen flex">
            {/* Sidebar - Contact List */}
            <div className="w-80 bg-white border-r border-secondary-100 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-secondary-100">
                    <h1 className="text-xl font-bold text-secondary-900 mb-4">Messages</h1>
                    <Input
                        type="text"
                        placeholder="Search conversations..."
                        leftIcon={<Search size={18} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Contact List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredContacts.length > 0 ? (
                        filteredContacts.map((contact) => (
                            <motion.button
                                key={contact.id}
                                whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                                onClick={() => setCurrentChat(contact.id)}
                                className={`w-full flex items-center gap-3 p-4 transition-colors ${currentChatUserId === contact.id ? 'bg-primary-50' : ''
                                    }`}
                            >
                                <Avatar
                                    src={contact.avatar}
                                    name={contact.name}
                                    size="md"
                                    isOnline={contact.isOnline}
                                />
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-secondary-900 truncate">
                                            {contact.name}
                                        </p>
                                        {contact.time && (
                                            <span className="text-xs text-secondary-400">
                                                {formatTime(contact.time)}
                                            </span>
                                        )}
                                    </div>
                                    {contact.lastMessage && (
                                        <p className="text-sm text-secondary-500 truncate">
                                            {contact.lastMessage}
                                        </p>
                                    )}
                                </div>
                                {contact.unreadCount > 0 && (
                                    <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5">
                                        {contact.unreadCount}
                                    </span>
                                )}
                            </motion.button>
                        ))
                    ) : (
                        <div className="p-8 text-center text-secondary-400">
                            <p>No conversations yet</p>
                            <p className="text-sm mt-1">Add friends to start chatting</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-secondary-50">
                {currentChatUserId && currentChatFriend ? (
                    <>
                        {/* Chat Header */}
                        <div className="bg-white px-6 py-4 border-b border-secondary-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar
                                    src={currentChatFriend.avatar}
                                    name={currentChatFriend.name}
                                    size="md"
                                    isOnline={currentChatFriend.isOnline}
                                />
                                <div>
                                    <p className="font-medium text-secondary-900">
                                        {currentChatFriend.name}
                                    </p>
                                    <p className="text-xs text-secondary-500">
                                        {currentChatFriend.isOnline ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="btn-icon">
                                    <Phone size={20} />
                                </button>
                                <button className="btn-icon">
                                    <Video size={20} />
                                </button>
                                <button className="btn-icon">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <AnimatePresence>
                                {messages.map((message, index) => {
                                    const isMe = message.senderId === user?.id;
                                    return (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe
                                                        ? 'bg-primary-500 text-white rounded-br-sm'
                                                        : 'bg-white text-secondary-900 rounded-bl-sm shadow-soft'
                                                    }`}
                                            >
                                                {message.imageUrl && (
                                                    <img
                                                        src={message.imageUrl}
                                                        alt="Shared"
                                                        className="rounded-xl mb-2 max-w-full"
                                                    />
                                                )}
                                                {message.content && <p>{message.content}</p>}
                                                <p
                                                    className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-secondary-400'
                                                        }`}
                                                >
                                                    {formatTime(message.createdAt)}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="bg-white px-6 py-4 border-t border-secondary-100">
                            <div className="flex items-center gap-3">
                                <button className="btn-icon">
                                    <Paperclip size={20} />
                                </button>
                                <button className="btn-icon">
                                    <ImageIcon size={20} />
                                </button>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        className="w-full px-4 py-2 bg-secondary-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200"
                                    />
                                </div>
                                <button className="btn-icon">
                                    <Smile size={20} />
                                </button>
                                <Button
                                    variant="primary"
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim() || isSending}
                                    className="rounded-xl"
                                >
                                    <Send size={18} />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-secondary-400">
                            <div className="w-20 h-20 mx-auto rounded-2xl bg-secondary-100 flex items-center justify-center mb-4">
                                <Send size={32} />
                            </div>
                            <p className="text-lg font-medium text-secondary-600">Select a conversation</p>
                            <p className="text-sm">Choose a friend to start chatting</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
