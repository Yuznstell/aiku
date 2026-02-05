import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { setAccessToken, setRefreshToken } from '@/lib/api';
import { User, AuthResponse, LoginCredentials, RegisterData } from '@/types';
import { initSocket, disconnectSocket } from '@/lib/socket';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    updateUser: (data: Partial<User>) => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<{ data: AuthResponse }>('/auth/login', credentials);
                    const { user, accessToken, refreshToken } = response.data.data;

                    setAccessToken(accessToken);
                    setRefreshToken(refreshToken);

                    set({ user, isAuthenticated: true, isLoading: false });

                    // Initialize socket connection
                    initSocket();
                } catch (error: any) {
                    set({
                        error: error.response?.data?.message || 'Login failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            register: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post<{ data: AuthResponse }>('/auth/register', data);
                    const { user, accessToken, refreshToken } = response.data.data;

                    setAccessToken(accessToken);
                    setRefreshToken(refreshToken);

                    set({ user, isAuthenticated: true, isLoading: false });

                    initSocket();
                } catch (error: any) {
                    set({
                        error: error.response?.data?.message || 'Registration failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch (error) {
                    // Continue logout even if API fails
                }

                setAccessToken(null);
                setRefreshToken(null);
                disconnectSocket();

                set({ user: null, isAuthenticated: false, isLoading: false });
            },

            checkAuth: async () => {
                set({ isLoading: true });
                try {
                    const response = await api.get<{ data: User }>('/auth/profile');
                    set({ user: response.data.data, isAuthenticated: true, isLoading: false });
                    initSocket();
                } catch (error) {
                    set({ user: null, isAuthenticated: false, isLoading: false });
                }
            },

            updateUser: (data) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...data } : null,
                }));
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);
