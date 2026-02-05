const prisma = require('../config/database');
const { sanitizeHtml, sanitizeText } = require('../utils/sanitize');

class NoteService {
    /**
     * Get all notes for a user (including shared notes)
     */
    async getNotes(userId, { search, tag, page = 1, limit = 20 }) {
        const validPage = parseInt(page) || 1;
        const validLimit = parseInt(limit) || 20;
        const skip = (validPage - 1) * validLimit;

        const where = {
            OR: [
                { userId }, // Own notes
                { shares: { some: { userId } } }, // Shared notes
            ],
        };

        // Add search filter
        if (search) {
            where.AND = {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { content: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        // Add tag filter
        if (tag) {
            where.AND = {
                ...where.AND,
                tags: { some: { name: { equals: tag, mode: 'insensitive' } } },
            };
        }

        const [notes, total] = await Promise.all([
            prisma.note.findMany({
                where,
                include: {
                    tags: { select: { id: true, name: true } },
                    user: { select: { id: true, name: true, avatar: true } },
                    shares: {
                        include: {
                            user: { select: { id: true, name: true, avatar: true } },
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: validLimit,
            }),
            prisma.note.count({ where }),
        ]);

        // Add permission info for each note
        const notesWithPermission = notes.map(note => ({
            ...note,
            permission: note.userId === userId
                ? 'OWNER'
                : note.shares.find(s => s.userId === userId)?.permission || 'VIEWER',
        }));

        return {
            notes: notesWithPermission,
            pagination: {
                page: validPage,
                limit: validLimit,
                total,
                totalPages: Math.ceil(total / validLimit),
            },
        };
    }

    /**
     * Get single note by ID
     */
    async getNoteById(noteId, userId) {
        const note = await prisma.note.findUnique({
            where: { id: noteId },
            include: {
                tags: { select: { id: true, name: true } },
                user: { select: { id: true, name: true, avatar: true } },
                images: { select: { id: true, url: true } },
                shares: {
                    include: {
                        user: { select: { id: true, name: true, avatar: true, email: true } },
                    },
                },
            },
        });

        if (!note) {
            throw { status: 404, message: 'Note not found' };
        }

        // Check access
        const isOwner = note.userId === userId;
        const share = note.shares.find(s => s.userId === userId);

        if (!isOwner && !share) {
            throw { status: 403, message: 'You do not have access to this note' };
        }

        return {
            ...note,
            permission: isOwner ? 'OWNER' : share?.permission,
        };
    }

    /**
     * Create a new note
     * [FIX H07] Content is sanitized to prevent XSS
     */
    async createNote(userId, { title, content, tags = [] }) {
        // Sanitize inputs to prevent XSS
        const sanitizedTitle = sanitizeText(title);
        const sanitizedContent = sanitizeHtml(content || '');

        const note = await prisma.note.create({
            data: {
                title: sanitizedTitle,
                content: sanitizedContent,
                userId,
                tags: {
                    create: tags.map(name => ({ name: sanitizeText(name) })),
                },
            },
            include: {
                tags: { select: { id: true, name: true } },
                user: { select: { id: true, name: true, avatar: true } },
            },
        });

        // Log activity
        await this.logActivity(userId, 'CREATE', 'NOTE', note.id, `Created note: ${title}`);

        return note;
    }

    /**
     * Update a note
     * [FIX H07] Content is sanitized to prevent XSS
     */
    async updateNote(noteId, userId, { title, content, tags }) {
        // Check access
        const note = await this.getNoteById(noteId, userId);

        if (note.permission === 'VIEWER') {
            throw { status: 403, message: 'You do not have permission to edit this note' };
        }

        // Sanitize inputs to prevent XSS
        const updateData = {};
        if (title !== undefined) updateData.title = sanitizeText(title);
        if (content !== undefined) updateData.content = sanitizeHtml(content);

        // Update note
        const updatedNote = await prisma.note.update({
            where: { id: noteId },
            data: updateData,
            include: {
                tags: { select: { id: true, name: true } },
                user: { select: { id: true, name: true, avatar: true } },
            },
        });

        // Update tags if provided
        if (tags !== undefined) {
            // Delete existing tags
            await prisma.noteTag.deleteMany({ where: { noteId } });

            // Create new tags with sanitization
            if (tags.length > 0) {
                await prisma.noteTag.createMany({
                    data: tags.map(name => ({ noteId, name: sanitizeText(name) })),
                });
            }
        }

        // Log activity
        await this.logActivity(userId, 'UPDATE', 'NOTE', noteId, `Updated note: ${updatedNote.title}`);

        return this.getNoteById(noteId, userId);
    }

    /**
     * Delete a note
     */
    async deleteNote(noteId, userId) {
        const note = await this.getNoteById(noteId, userId);

        if (note.permission !== 'OWNER') {
            throw { status: 403, message: 'Only the owner can delete this note' };
        }

        await prisma.note.delete({ where: { id: noteId } });

        // Log activity
        await this.logActivity(userId, 'DELETE', 'NOTE', noteId, `Deleted note: ${note.title}`);

        return true;
    }

    /**
     * Share a note with another user
     */
    async shareNote(noteId, ownerId, { userId, permission }) {
        const note = await this.getNoteById(noteId, ownerId);

        if (note.permission !== 'OWNER') {
            throw { status: 403, message: 'Only the owner can share this note' };
        }

        if (userId === ownerId) {
            throw { status: 400, message: 'Cannot share note with yourself' };
        }

        // Check if user exists
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) {
            throw { status: 404, message: 'User not found' };
        }

        // Check if already shared
        const existingShare = await prisma.noteShare.findUnique({
            where: { noteId_userId: { noteId, userId } },
        });

        if (existingShare) {
            // Update permission
            await prisma.noteShare.update({
                where: { noteId_userId: { noteId, userId } },
                data: { permission },
            });
        } else {
            // Create share
            await prisma.noteShare.create({
                data: { noteId, userId, permission },
            });
        }

        // Update note isShared status
        await prisma.note.update({
            where: { id: noteId },
            data: { isShared: true },
        });

        // Log activity
        await this.logActivity(ownerId, 'SHARE', 'NOTE', noteId,
            `Shared note with ${targetUser.name} as ${permission}`);

        return this.getNoteById(noteId, ownerId);
    }

    /**
     * Remove share from a note
     */
    async removeShare(noteId, ownerId, targetUserId) {
        const note = await this.getNoteById(noteId, ownerId);

        if (note.permission !== 'OWNER') {
            throw { status: 403, message: 'Only the owner can manage shares' };
        }

        await prisma.noteShare.delete({
            where: { noteId_userId: { noteId, userId: targetUserId } },
        });

        // Check if note still has shares
        const remainingShares = await prisma.noteShare.count({ where: { noteId } });

        if (remainingShares === 0) {
            await prisma.note.update({
                where: { id: noteId },
                data: { isShared: false },
            });
        }

        return this.getNoteById(noteId, ownerId);
    }

    /**
     * Log activity
     */
    async logActivity(userId, action, entityType, entityId, description) {
        await prisma.activityLog.create({
            data: { userId, action, entityType, entityId, description },
        });
    }
}

module.exports = new NoteService();
