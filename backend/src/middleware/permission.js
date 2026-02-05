const prisma = require('../config/database');

/**
 * Middleware to check note permissions
 * OWNER - full access
 * EDITOR - can read and write
 * VIEWER - can only read
 */
const checkNotePermission = (requiredPermission = 'VIEWER') => {
    return async (req, res, next) => {
        try {
            const noteId = req.params.id || req.params.noteId;
            const userId = req.user.id;

            if (!noteId) {
                return res.status(400).json({
                    success: false,
                    message: 'Note ID is required',
                });
            }

            const note = await prisma.note.findUnique({
                where: { id: noteId },
                include: {
                    shares: {
                        where: { userId },
                        select: { permission: true },
                    },
                },
            });

            if (!note) {
                return res.status(404).json({
                    success: false,
                    message: 'Note not found',
                });
            }

            // Check if user is owner
            if (note.userId === userId) {
                req.notePermission = 'OWNER';
                return next();
            }

            // Check if user has share access
            const share = note.shares[0];
            if (!share) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have access to this note',
                });
            }

            const userPermission = share.permission;
            req.notePermission = userPermission;

            // Permission hierarchy: OWNER > EDITOR > VIEWER
            const permissionLevels = { VIEWER: 1, EDITOR: 2, OWNER: 3 };
            const requiredLevel = permissionLevels[requiredPermission];
            const userLevel = permissionLevels[userPermission];

            if (userLevel < requiredLevel) {
                return res.status(403).json({
                    success: false,
                    message: `This action requires ${requiredPermission} permission. You have ${userPermission} access.`,
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to check permissions',
            });
        }
    };
};

/**
 * Middleware to check event permissions
 */
const checkEventPermission = (requiredPermission = 'VIEWER') => {
    return async (req, res, next) => {
        try {
            const eventId = req.params.id || req.params.eventId;
            const userId = req.user.id;

            if (!eventId) {
                return res.status(400).json({
                    success: false,
                    message: 'Event ID is required',
                });
            }

            const event = await prisma.calendarEvent.findUnique({
                where: { id: eventId },
                include: {
                    shares: {
                        where: { userId },
                        select: { permission: true },
                    },
                },
            });

            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Event not found',
                });
            }

            // Check if user is owner
            if (event.userId === userId) {
                req.eventPermission = 'OWNER';
                return next();
            }

            // Check if user has share access
            const share = event.shares[0];
            if (!share) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have access to this event',
                });
            }

            const userPermission = share.permission;
            req.eventPermission = userPermission;

            const permissionLevels = { VIEWER: 1, EDITOR: 2, OWNER: 3 };
            const requiredLevel = permissionLevels[requiredPermission];
            const userLevel = permissionLevels[userPermission];

            if (userLevel < requiredLevel) {
                return res.status(403).json({
                    success: false,
                    message: `This action requires ${requiredPermission} permission. You have ${userPermission} access.`,
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to check permissions',
            });
        }
    };
};

module.exports = { checkNotePermission, checkEventPermission };
