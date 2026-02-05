// User types
export interface User {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    role: 'ADMIN' | 'USER';
    isOnline?: boolean;
    lastSeen?: string;
    createdAt: string;
}

// Auth types
export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}

// Note types
export interface Note {
    id: string;
    title: string;
    content: string;
    isShared: boolean;
    userId: string;
    user: Pick<User, 'id' | 'name' | 'avatar'>;
    tags: Tag[];
    shares: NoteShare[];
    permission: 'OWNER' | 'EDITOR' | 'VIEWER';
    createdAt: string;
    updatedAt: string;
}

export interface Tag {
    id: string;
    name: string;
}

export interface NoteShare {
    id: string;
    user: Pick<User, 'id' | 'name' | 'avatar' | 'email'>;
    permission: 'EDITOR' | 'VIEWER';
}

export interface CreateNoteData {
    title: string;
    content: string;
    tags?: string[];
}

// Calendar types
export interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    color: string;
    isAllDay: boolean;
    isShared: boolean;
    userId: string;
    user: Pick<User, 'id' | 'name' | 'avatar'>;
    shares: EventShare[];
    permission: 'OWNER' | 'EDITOR' | 'VIEWER';
    createdAt: string;
}

export interface EventShare {
    id: string;
    user: Pick<User, 'id' | 'name' | 'avatar' | 'email'>;
    permission: 'EDITOR' | 'VIEWER';
}

export interface CreateEventData {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    color?: string;
    isAllDay?: boolean;
}

// Reminder types
export interface Reminder {
    id: string;
    title: string;
    description: string;
    remindAt: string;
    repeatType: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    isCompleted: boolean;
    createdAt: string;
}

export interface CreateReminderData {
    title: string;
    description?: string;
    remindAt: string;
    repeatType?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
}

// Friend types
export interface Friend {
    id: string;
    friend: Pick<User, 'id' | 'name' | 'avatar' | 'email' | 'isOnline' | 'lastSeen'>;
    since: string;
}

export interface FriendRequest {
    id: string;
    from?: Pick<User, 'id' | 'name' | 'avatar' | 'email'>;
    to?: Pick<User, 'id' | 'name' | 'avatar' | 'email'>;
    createdAt: string;
}

export interface SearchedUser {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    friendshipStatus: 'PENDING' | 'ACCEPTED' | null;
    friendshipId: string | null;
}

// Chat types
export interface Message {
    id: string;
    content: string | null;
    imageUrl: string | null;
    isRead: boolean;
    senderId: string;
    receiverId: string;
    sender: Pick<User, 'id' | 'name' | 'avatar'>;
    createdAt: string;
}

export interface Conversation {
    partner: Pick<User, 'id' | 'name' | 'avatar' | 'isOnline'>;
    lastMessage: {
        content: string | null;
        imageUrl: string | null;
        createdAt: string;
        isFromMe: boolean;
    };
    unreadCount: number;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: {
        items: T[];
        pagination: Pagination;
    };
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// Admin types
export interface AdminStats {
    totalUsers: number;
    totalNotes: number;
    totalEvents: number;
    totalReminders: number;
    totalMessages: number;
    onlineUsers: number;
    newUsersToday: number;
}

export interface ActivityLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    description: string;
    userId: string;
    user: Pick<User, 'id' | 'name' | 'avatar'>;
    createdAt: string;
}

// Task types
export type TaskStatus = 'TODO' | 'DOING' | 'DONE';

export interface Task {
    id: string;
    title: string;
    icon: string | null;
    status: TaskStatus;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskData {
    title: string;
    status?: TaskStatus;
}

export interface TasksResponse {
    tasks: Task[];
    grouped: {
        TODO: Task[];
        DOING: Task[];
        DONE: Task[];
    };
    counts: {
        TODO: number;
        DOING: number;
        DONE: number;
    };
}
