import axios, { AxiosError, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5029/api';

/**
 * Axios instance with httpOnly cookie support
 * 
 * SECURITY FIX C01: Tokens are now primarily stored in httpOnly cookies
 * localStorage is only used as fallback for mobile/API clients
 */
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // IMPORTANT: Required for httpOnly cookies
});

// Token management - fallback for non-cookie environments
let accessToken: string | null = null;

/**
 * Set access token (fallback for mobile clients)
 * Web clients should rely on httpOnly cookies instead
 */
export const setAccessToken = (token: string | null) => {
    accessToken = token;
    // Only store in localStorage for mobile/API clients
    // Web clients use httpOnly cookies (more secure)
    if (token && typeof window !== 'undefined') {
        localStorage.setItem('accessToken', token);
    } else if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
    }
};

export const getAccessToken = () => {
    if (accessToken) return accessToken;
    if (typeof window !== 'undefined') {
        accessToken = localStorage.getItem('accessToken');
    }
    return accessToken;
};

/**
 * Set refresh token (fallback for mobile clients)
 */
export const setRefreshToken = (token: string | null) => {
    if (typeof window !== 'undefined') {
        if (token) {
            localStorage.setItem('refreshToken', token);
        } else {
            localStorage.removeItem('refreshToken');
        }
    }
};

export const getRefreshToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('refreshToken');
    }
    return null;
};

/**
 * Clear all auth data (for logout)
 */
export const clearAuthData = () => {
    accessToken = null;
    if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
};

// Request interceptor - add auth header (fallback for when cookies don't work)
api.interceptors.request.use(
    (config) => {
        // Only add header if we have a token in memory/localStorage
        // httpOnly cookies are sent automatically via withCredentials
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Call refresh - cookies will be sent automatically
                // Also send refreshToken in body as fallback for mobile clients
                const refreshToken = getRefreshToken();
                const response = await axios.post(
                    `${API_URL}/auth/refresh`,
                    { refreshToken },
                    { withCredentials: true }
                );

                const { accessToken: newToken } = response.data.data;

                // Update local storage fallback
                setAccessToken(newToken);

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear everything and redirect to login
                clearAuthData();

                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Helper functions
export const handleApiError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message || error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
};

export default api;
