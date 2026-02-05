const prisma = require('../config/database');

class CalendarService {
    /**
     * Get calendar events for a user
     */
    async getEvents(userId, { startDate, endDate, page = 1, limit = 50 }) {
        const validPage = parseInt(page) || 1;
        const validLimit = parseInt(limit) || 50;
        const skip = (validPage - 1) * validLimit;

        const where = {
            OR: [
                { userId },
                { shares: { some: { userId } } },
            ],
        };

        // Filter by date range
        if (startDate && endDate) {
            where.AND = {
                startTime: { gte: new Date(startDate) },
                endTime: { lte: new Date(endDate) },
            };
        }

        const [events, total] = await Promise.all([
            prisma.calendarEvent.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, avatar: true } },
                    shares: {
                        include: {
                            user: { select: { id: true, name: true, avatar: true } },
                        },
                    },
                },
                orderBy: { startTime: 'asc' },
                skip,
                take: validLimit,
            }),
            prisma.calendarEvent.count({ where }),
        ]);

        const eventsWithPermission = events.map(event => ({
            ...event,
            permission: event.userId === userId
                ? 'OWNER'
                : event.shares.find(s => s.userId === userId)?.permission || 'VIEWER',
        }));

        return {
            events: eventsWithPermission,
            pagination: { page: validPage, limit: validLimit, total, totalPages: Math.ceil(total / validLimit) },
        };
    }

    /**
     * Get single event by ID
     */
    async getEventById(eventId, userId) {
        const event = await prisma.calendarEvent.findUnique({
            where: { id: eventId },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                shares: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true, email: true } },
                    },
                },
            },
        });

        if (!event) {
            throw { status: 404, message: 'Event not found' };
        }

        const isOwner = event.userId === userId;
        const share = event.shares.find(s => s.userId === userId);

        if (!isOwner && !share) {
            throw { status: 403, message: 'You do not have access to this event' };
        }

        return {
            ...event,
            permission: isOwner ? 'OWNER' : share?.permission,
        };
    }

    /**
     * Create a new event
     * 
     * FIX: Handle timezone-agnostic date parsing
     * When client sends "2026-01-24T09:00", we want to store that exact date/time
     * without any timezone conversion shifting it to another day.
     */
    async createEvent(userId, { title, description, startTime, endTime, color, isAllDay, reminderMinutes }) {
        // Parse dates - treat input as the intended local time
        // If the input doesn't have timezone info, new Date() will parse it as local time
        // which is what we want for calendar events
        const start = this.parseEventDate(startTime);
        const end = this.parseEventDate(endTime);

        if (end <= start) {
            throw { status: 400, message: 'End time must be after start time' };
        }

        const event = await prisma.calendarEvent.create({
            data: {
                title,
                description: description || '',
                startTime: start,
                endTime: end,
                color: color || '#6366f1',
                isAllDay: isAllDay || false,
                reminderMinutes: reminderMinutes || null,
                userId,
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
            },
        });

        await this.logActivity(userId, 'CREATE', 'EVENT', event.id, `Created event: ${title}`);

        return event;
    }

    /**
     * Parse event date string to Date object
     * Handles formats like "2026-01-24T09:00" (without timezone)
     * and preserves the intended date without timezone shifting
     */
    parseEventDate(dateString) {
        if (!dateString) {
            throw { status: 400, message: 'Date is required' };
        }

        // If it's already a Date object, return it
        if (dateString instanceof Date) {
            return dateString;
        }

        // If string has timezone info (ends with Z or +/-offset), parse directly
        if (/Z$|[+-]\d{2}:\d{2}$/.test(dateString)) {
            return new Date(dateString);
        }

        // For local time strings like "2026-01-24T09:00", parse as local time
        // This prevents the off-by-one day bug for UTC+ timezones
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            throw { status: 400, message: 'Invalid date format' };
        }

        return date;
    }

    /**
     * Update an event
     */
    async updateEvent(eventId, userId, data) {
        const event = await this.getEventById(eventId, userId);

        if (event.permission === 'VIEWER') {
            throw { status: 403, message: 'You do not have permission to edit this event' };
        }

        const updateData = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.startTime !== undefined) updateData.startTime = this.parseEventDate(data.startTime);
        if (data.endTime !== undefined) updateData.endTime = this.parseEventDate(data.endTime);
        if (data.color !== undefined) updateData.color = data.color;
        if (data.isAllDay !== undefined) updateData.isAllDay = data.isAllDay;
        if (data.reminderMinutes !== undefined) {
            updateData.reminderMinutes = data.reminderMinutes;
            updateData.reminderSent = false; // Reset reminder sent status when changed
        }

        const updatedEvent = await prisma.calendarEvent.update({
            where: { id: eventId },
            data: updateData,
            include: {
                user: { select: { id: true, name: true, avatar: true } },
            },
        });

        await this.logActivity(userId, 'UPDATE', 'EVENT', eventId, `Updated event: ${updatedEvent.title}`);

        return this.getEventById(eventId, userId);
    }

    /**
     * Delete an event
     */
    async deleteEvent(eventId, userId) {
        const event = await this.getEventById(eventId, userId);

        if (event.permission !== 'OWNER') {
            throw { status: 403, message: 'Only the owner can delete this event' };
        }

        await prisma.calendarEvent.delete({ where: { id: eventId } });
        await this.logActivity(userId, 'DELETE', 'EVENT', eventId, `Deleted event: ${event.title}`);

        return true;
    }

    /**
     * Share an event
     */
    async shareEvent(eventId, ownerId, { userId, permission }) {
        const event = await this.getEventById(eventId, ownerId);

        if (event.permission !== 'OWNER') {
            throw { status: 403, message: 'Only the owner can share this event' };
        }

        if (userId === ownerId) {
            throw { status: 400, message: 'Cannot share event with yourself' };
        }

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) {
            throw { status: 404, message: 'User not found' };
        }

        const existingShare = await prisma.eventShare.findUnique({
            where: { eventId_userId: { eventId, userId } },
        });

        if (existingShare) {
            await prisma.eventShare.update({
                where: { eventId_userId: { eventId, userId } },
                data: { permission },
            });
        } else {
            await prisma.eventShare.create({
                data: { eventId, userId, permission },
            });
        }

        await prisma.calendarEvent.update({
            where: { id: eventId },
            data: { isShared: true },
        });

        await this.logActivity(ownerId, 'SHARE', 'EVENT', eventId,
            `Shared event with ${targetUser.name} as ${permission}`);

        return this.getEventById(eventId, ownerId);
    }

    /**
     * Remove share
     */
    async removeShare(eventId, ownerId, targetUserId) {
        const event = await this.getEventById(eventId, ownerId);

        if (event.permission !== 'OWNER') {
            throw { status: 403, message: 'Only the owner can manage shares' };
        }

        await prisma.eventShare.delete({
            where: { eventId_userId: { eventId, userId: targetUserId } },
        });

        const remainingShares = await prisma.eventShare.count({ where: { eventId } });

        if (remainingShares === 0) {
            await prisma.calendarEvent.update({
                where: { id: eventId },
                data: { isShared: false },
            });
        }

        return this.getEventById(eventId, ownerId);
    }

    async logActivity(userId, action, entityType, entityId, description) {
        await prisma.activityLog.create({
            data: { userId, action, entityType, entityId, description },
        });
    }
}

module.exports = new CalendarService();
