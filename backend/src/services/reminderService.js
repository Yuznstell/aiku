const prisma = require('../config/database');

class ReminderService {
    /**
     * Get all reminders for a user
     */
    async getReminders(userId, { completed, upcoming, page = 1, limit = 20 }) {
        const validPage = parseInt(page) || 1;
        const validLimit = parseInt(limit) || 20;
        const skip = (validPage - 1) * validLimit;

        const where = { userId };

        if (completed !== undefined) {
            where.isCompleted = completed === 'true' || completed === true;
        }

        if (upcoming === 'true' || upcoming === true) {
            where.remindAt = { gte: new Date() };
            where.isCompleted = false;
        }

        const [reminders, total] = await Promise.all([
            prisma.reminder.findMany({
                where,
                orderBy: { remindAt: 'asc' },
                skip,
                take: validLimit,
            }),
            prisma.reminder.count({ where }),
        ]);

        return {
            reminders,
            pagination: { page: validPage, limit: validLimit, total, totalPages: Math.ceil(total / validLimit) },
        };
    }

    /**
     * Get single reminder
     */
    async getReminderById(reminderId, userId) {
        const reminder = await prisma.reminder.findUnique({
            where: { id: reminderId },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                shares: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true, email: true } },
                    },
                },
            },
        });

        if (!reminder) {
            throw { status: 404, message: 'Reminder not found' };
        }

        // Check access
        const isOwner = reminder.userId === userId;
        const share = reminder.shares.find(s => s.userId === userId);

        if (!isOwner && !share) {
            throw { status: 403, message: 'You do not have access to this reminder' };
        }

        return {
            ...reminder,
            permission: isOwner ? 'OWNER' : share?.permission,
        };
    }

    /**
     * Create a reminder
     */
    async createReminder(userId, { title, description, remindAt, repeatType }) {
        const reminder = await prisma.reminder.create({
            data: {
                title,
                description: description || '',
                remindAt: new Date(remindAt),
                repeatType: repeatType || 'NONE',
                userId,
            },
        });

        return reminder;
    }

    /**
     * Update a reminder
     * [FIX H02] Added permission check - VIEWERs cannot edit
     */
    async updateReminder(reminderId, userId, data) {
        const reminder = await this.getReminderById(reminderId, userId);

        // CRITICAL: Check permission - VIEWER cannot modify
        if (reminder.permission === 'VIEWER') {
            throw { status: 403, message: 'You do not have permission to edit this reminder (VIEWER access only)' };
        }

        const updateData = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.remindAt !== undefined) updateData.remindAt = new Date(data.remindAt);
        if (data.repeatType !== undefined) updateData.repeatType = data.repeatType;
        if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;

        const updatedReminder = await prisma.reminder.update({
            where: { id: reminderId },
            data: updateData,
        });

        return updatedReminder;
    }

    /**
     * Mark reminder as complete
     * [FIX H02] Added permission check - VIEWERs cannot mark complete
     */
    async markComplete(reminderId, userId, isCompleted = true) {
        const reminderData = await this.getReminderById(reminderId, userId);

        // CRITICAL: Check permission - VIEWER cannot modify
        if (reminderData.permission === 'VIEWER') {
            throw { status: 403, message: 'You do not have permission to modify this reminder (VIEWER access only)' };
        }

        const reminder = await prisma.reminder.update({
            where: { id: reminderId },
            data: { isCompleted },
        });

        // If it's a repeating reminder and marked complete, create next occurrence
        if (isCompleted && reminder.repeatType !== 'NONE') {
            await this.createNextOccurrence(reminder);
        }

        return reminder;
    }

    /**
     * Create next occurrence for repeating reminder
     */
    async createNextOccurrence(reminder) {
        const nextDate = new Date(reminder.remindAt);

        switch (reminder.repeatType) {
            case 'DAILY':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'WEEKLY':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'MONTHLY':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'YEARLY':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
        }

        await prisma.reminder.create({
            data: {
                title: reminder.title,
                description: reminder.description,
                remindAt: nextDate,
                repeatType: reminder.repeatType,
                userId: reminder.userId,
            },
        });
    }

    /**
     * Delete a reminder
     */
    async deleteReminder(reminderId, userId) {
        await this.getReminderById(reminderId, userId);

        await prisma.reminder.delete({ where: { id: reminderId } });

        return true;
    }

    /**
     * Get due reminders (for scheduler)
     */
    async getDueReminders() {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        const reminders = await prisma.reminder.findMany({
            where: {
                remindAt: {
                    gte: fiveMinutesAgo,
                    lte: now,
                },
                isCompleted: false,
                emailSent: false,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });

        return reminders;
    }

    /**
     * Mark reminder notification as sent
     */
    async markEmailSent(reminderId) {
        await prisma.reminder.update({
            where: { id: reminderId },
            data: { emailSent: true },
        });
    }

    /**
     * Share reminder with another user
     */
    async shareReminder(reminderId, ownerId, targetUserId, permission = 'VIEWER') {
        const reminder = await this.getReminderById(reminderId, ownerId);

        if (reminder.permission !== 'OWNER') {
            throw { status: 403, message: 'Only the owner can share this reminder' };
        }

        if (targetUserId === ownerId) {
            throw { status: 400, message: 'Cannot share reminder with yourself' };
        }

        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) {
            throw { status: 404, message: 'User not found' };
        }

        const existingShare = await prisma.reminderShare.findUnique({
            where: { reminderId_userId: { reminderId, userId: targetUserId } },
        });

        if (existingShare) {
            await prisma.reminderShare.update({
                where: { reminderId_userId: { reminderId, userId: targetUserId } },
                data: { permission },
            });
        } else {
            await prisma.reminderShare.create({
                data: { reminderId, userId: targetUserId, permission },
            });
        }

        await prisma.reminder.update({
            where: { id: reminderId },
            data: { isShared: true },
        });

        return this.getReminderById(reminderId, ownerId);
    }

    /**
     * Remove share from reminder
     */
    async removeShare(reminderId, ownerId, targetUserId) {
        const reminder = await this.getReminderById(reminderId, ownerId);

        if (reminder.permission !== 'OWNER') {
            throw { status: 403, message: 'Only the owner can manage shares' };
        }

        await prisma.reminderShare.delete({
            where: { reminderId_userId: { reminderId, userId: targetUserId } },
        });

        const remainingShares = await prisma.reminderShare.count({ where: { reminderId } });

        if (remainingShares === 0) {
            await prisma.reminder.update({
                where: { id: reminderId },
                data: { isShared: false },
            });
        }

        return this.getReminderById(reminderId, ownerId);
    }
}

module.exports = new ReminderService();

