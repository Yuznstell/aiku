import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5029';

let socket: Socket | null = null;

export const initSocket = (): Socket => {
    if (socket?.connected) return socket;

    const token = getAccessToken();

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
    });

    return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const emitEvent = (event: string, data: unknown) => {
    if (socket?.connected) {
        socket.emit(event, data);
    } else {
        console.warn('Socket not connected. Cannot emit:', event);
    }
};

export const subscribeToEvent = (event: string, callback: (data: any) => void) => {
    if (socket) {
        socket.on(event, callback);
    }
};

export const unsubscribeFromEvent = (event: string, callback?: (data: any) => void) => {
    if (socket) {
        if (callback) {
            socket.off(event, callback);
        } else {
            socket.off(event);
        }
    }
};

export default socket;
