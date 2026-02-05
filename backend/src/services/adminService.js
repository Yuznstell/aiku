const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

class AdminService {
    /**
     * Create a new user (admin only)
     */
    async createUser({ name, email, password, role = 'USER' }) {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            throw { status: 400, message: 'Email already registered' };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role,
                emailVerified: true, // Admin-created users are pre-verified
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                emailVerified: true,
                createdAt: true,
            },
        });

        return user;
    }

    /**
     * Get all users (admin only)
     */
    async getUsers({ page = 1, limit = 20, search, role }) {
        const validPage = parseInt(page) || 1;
        const validLimit = parseInt(limit) || 20;
        const skip = (validPage - 1) * validLimit;

        const where = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            where.role = role;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    avatar: true,
                    role: true,
                    isOnline: true,
                    emailVerified: true,
                    lastSeen: true,
                    createdAt: true,
                    _count: {
                        select: {
                            notes: true,
                            reminders: true,
                            calendarEvents: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: validLimit,
            }),
            prisma.user.count({ where }),
        ]);

        return {
            users,
            pagination: { page: validPage, limit: validLimit, total, totalPages: Math.ceil(total / validLimit) },
        };
    }

    /**
     * Get user details
     */
    async getUserById(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                isOnline: true,
                emailVerified: true,
                lastSeen: true,
                createdAt: true,
                _count: {
                    select: {
                        notes: true,
                        reminders: true,
                        calendarEvents: true,
                        sentMessages: true,
                    },
                },
            },
        });

        if (!user) {
            throw { status: 404, message: 'User not found' };
        }

        return user;
    }

    /**
     * Update user (admin only)
     */
    async updateUser(userId, data) {
        const updateData = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.role !== undefined) updateData.role = data.role;
        if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified;

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                emailVerified: true,
            },
        });

        return user;
    }

    /**
     * Delete user (admin only)
     */
    async deleteUser(userId, adminId) {
        if (userId === adminId) {
            throw { status: 400, message: 'Cannot delete your own account' };
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw { status: 404, message: 'User not found' };
        }

        await prisma.user.delete({ where: { id: userId } });

        return true;
    }

    /**
     * Get dashboard statistics
     */
    async getStats() {
        const [
            totalUsers,
            totalNotes,
            totalEvents,
            totalReminders,
            totalMessages,
            onlineUsers,
            newUsersToday,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.note.count(),
            prisma.calendarEvent.count(),
            prisma.reminder.count(),
            prisma.message.count(),
            prisma.user.count({ where: { isOnline: true } }),
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
        ]);

        // Get user registrations for last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentRegistrations = await prisma.user.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: sevenDaysAgo },
            },
            _count: true,
        });

        return {
            totalUsers,
            totalNotes,
            totalEvents,
            totalReminders,
            totalMessages,
            onlineUsers,
            newUsersToday,
            recentRegistrations,
        };
    }

    /**
     * Get activity logs
     */
    async getActivityLogs({ page = 1, limit = 50, userId, entityType }) {
        const validPage = parseInt(page) || 1;
        const validLimit = parseInt(limit) || 50;
        const skip = (validPage - 1) * validLimit;

        const where = {};
        if (userId) where.userId = userId;
        if (entityType) where.entityType = entityType;

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, avatar: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: validLimit,
            }),
            prisma.activityLog.count({ where }),
        ]);

        return {
            logs,
            pagination: { page: validPage, limit: validLimit, total, totalPages: Math.ceil(total / validLimit) },
        };
    }
}

module.exports = new AdminService();
