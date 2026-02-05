import { create } from 'zustand';
import api from '@/lib/api';
import { Message, Conversation } from '@/types';
import { subscribeToEvent, unsubscribeFromEvent, emitEvent } from '@/lib/socket';

interface ChatState {
    conversations: Conversation[];
    messages: Message[];
    currentChatUserId: string | null;
    unreadCount: number;
    isLoading: boolean;
    hasMore: boolean;

    fetchConversations: () => Promise<void>;
    fetchMessages: (userId: string, cursor?: string) => Promise<void>;
    sendMessage: (receiverId: string, content: string, image?: File) => Promise<void>;
    markAsRead: (userId: string) => Promise<void>;
    addMessage: (message: Message) => void;
    setCurrentChat: (userId: string | null) => void;
    fetchUnreadCount: () => Promise<void>;
    subscribeToMessages: () => void;
    unsubscribeFromMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    messages: [],
    currentChatUserId: null,
    unreadCount: 0,
    isLoading: false,
    hasMore: true,

    fetchConversations: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/chat/conversations');
            set({ conversations: response.data.data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
        }
    },

    fetchMessages: async (userId, cursor) => {
        set({ isLoading: true });
        try {
            const params: any = { limit: 50 };
            if (cursor) params.cursor = cursor;

            const response = await api.get(`/chat/messages/${userId}`, { params });
            const { messages: newMessages, hasMore } = response.data.data;

            set((state) => ({
                messages: cursor ? [...newMessages, ...state.messages] : newMessages,
                hasMore,
                isLoading: false,
                currentChatUserId: userId,
            }));
        } catch (error) {
            set({ isLoading: false });
        }
    },

    sendMessage: async (receiverId, content, image) => {
        try {
            const formData = new FormData();
            formData.append('receiverId', receiverId);
            formData.append('content', content);
            if (image) formData.append('image', image);

            const response = await api.post('/chat/send', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const message = response.data.data;
            set((state) => ({ messages: [...state.messages, message] }));

            // Note: Socket notification is handled by backend controller
            // We don't emit here to prevent duplicate messages
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to send message');
        }
    },

    markAsRead: async (userId) => {
        try {
            await api.post(`/chat/read/${userId}`);
            set((state) => ({
                conversations: state.conversations.map((c) =>
                    c.partner.id === userId ? { ...c, unreadCount: 0 } : c
                ),
            }));
            get().fetchUnreadCount();
        } catch (error) {
            // Silent fail
        }
    },

    addMessage: (message) => {
        set((state) => {
            // Check if message already exists to prevent duplicates
            if (state.messages.some(m => m.id === message.id)) {
                return state; // Message already exists, don't add again
            }

            // Add to messages if in current chat
            const newMessages = state.currentChatUserId === message.senderId ||
                state.currentChatUserId === message.receiverId
                ? [...state.messages, message]
                : state.messages;

            // Update conversations
            const newConversations = state.conversations.map((c) => {
                if (c.partner.id === message.senderId || c.partner.id === message.receiverId) {
                    return {
                        ...c,
                        lastMessage: {
                            content: message.content,
                            imageUrl: message.imageUrl,
                            createdAt: message.createdAt,
                            isFromMe: false,
                        },
                        unreadCount: c.partner.id === message.senderId && state.currentChatUserId !== message.senderId
                            ? c.unreadCount + 1
                            : c.unreadCount,
                    };
                }
                return c;
            });

            return { messages: newMessages, conversations: newConversations };
        });
    },

    setCurrentChat: (userId) => {
        set({ currentChatUserId: userId, messages: [] });
    },

    fetchUnreadCount: async () => {
        try {
            const response = await api.get('/chat/unread');
            set({ unreadCount: response.data.data.count });
        } catch (error) {
            // Silent fail
        }
    },

    subscribeToMessages: () => {
        subscribeToEvent('new_message', (message: Message) => {
            get().addMessage(message);
            get().fetchUnreadCount();
        });
    },

    unsubscribeFromMessages: () => {
        unsubscribeFromEvent('new_message');
    },
}));
