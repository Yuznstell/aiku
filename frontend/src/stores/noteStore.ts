import { create } from 'zustand';
import api from '@/lib/api';
import { Note, CreateNoteData, Pagination } from '@/types';

interface NoteState {
    notes: Note[];
    currentNote: Note | null;
    pagination: Pagination | null;
    isLoading: boolean;
    error: string | null;

    fetchNotes: (params?: { search?: string; tag?: string; page?: number }) => Promise<void>;
    fetchNote: (id: string) => Promise<Note>;
    createNote: (data: CreateNoteData) => Promise<Note>;
    updateNote: (id: string, data: Partial<CreateNoteData>) => Promise<Note>;
    deleteNote: (id: string) => Promise<void>;
    shareNote: (id: string, userId: string, permission: 'EDITOR' | 'VIEWER') => Promise<void>;
    removeShare: (noteId: string, userId: string) => Promise<void>;
    setCurrentNote: (note: Note | null) => void;
    clearError: () => void;
}

export const useNoteStore = create<NoteState>((set, get) => ({
    notes: [],
    currentNote: null,
    pagination: null,
    isLoading: false,
    error: null,

    fetchNotes: async (params = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/notes', { params });
            const { notes, pagination } = response.data.data;
            set({ notes, pagination, isLoading: false });
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to fetch notes', isLoading: false });
        }
    },

    fetchNote: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/notes/${id}`);
            const note = response.data.data;
            set({ currentNote: note, isLoading: false });
            return note;
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to fetch note', isLoading: false });
            throw error;
        }
    },

    createNote: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/notes', data);
            const note = response.data.data;
            set((state) => ({ notes: [note, ...state.notes], isLoading: false }));
            return note;
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to create note', isLoading: false });
            throw error;
        }
    },

    updateNote: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.put(`/notes/${id}`, data);
            const updatedNote = response.data.data;
            set((state) => ({
                notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
                currentNote: state.currentNote?.id === id ? updatedNote : state.currentNote,
                isLoading: false,
            }));
            return updatedNote;
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to update note', isLoading: false });
            throw error;
        }
    },

    deleteNote: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await api.delete(`/notes/${id}`);
            set((state) => ({
                notes: state.notes.filter((n) => n.id !== id),
                currentNote: state.currentNote?.id === id ? null : state.currentNote,
                isLoading: false,
            }));
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to delete note', isLoading: false });
            throw error;
        }
    },

    shareNote: async (id, userId, permission) => {
        try {
            const response = await api.post(`/notes/${id}/share`, { userId, permission });
            const updatedNote = response.data.data;
            set((state) => ({
                notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
                currentNote: state.currentNote?.id === id ? updatedNote : state.currentNote,
            }));
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to share note');
        }
    },

    removeShare: async (noteId, userId) => {
        try {
            const response = await api.delete(`/notes/${noteId}/share/${userId}`);
            const updatedNote = response.data.data;
            set((state) => ({
                notes: state.notes.map((n) => (n.id === noteId ? updatedNote : n)),
                currentNote: state.currentNote?.id === noteId ? updatedNote : state.currentNote,
            }));
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to remove share');
        }
    },

    setCurrentNote: (note) => set({ currentNote: note }),
    clearError: () => set({ error: null }),
}));
