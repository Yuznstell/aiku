const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const prisma = require('../config/database');
const { chatService, friendService } = require('../services');
const socketRateLimiter = require('../middleware/socketRateLimit');
const { sanitizeText } = require('../utils/sanitize');

// Store connected users
const connectedUsers = new Map();

/**
 * Check if two users are friends AND not blocked
 * Used for authorization in socket events
 */
const areFriendsAndNotBlocked = async (userId1, userId2) => {
    const friendship = await prisma.friendship.findFirst({
        where: {
            OR: [
                { requesterId: userId1, addresseeId: userId2 },
                { requesterId: userId2, addresseeId: userId1 },
            ],
        },
    });

    // Must be ACCEPTED (not BLOCKED, PENDING, or REJECTED)
    return friendship?.status === 'ACCEPTED';
};

/**
 * Get user's friend IDs for targeted broadcasts
 */
const getUserFriendIds = async (userId) => {
    const friendships = await prisma.friendship.findMany({
        where: {
            status: 'ACCEPTED',
            OR: [
                { requesterId: userId },
                { addresseeId: userId },
            ],
        },
        select: {
            requesterId: true,
            addresseeId: true,
        },
    });

    return friendships.map(f =>
        f.requesterId === userId ? f.addresseeId : f.requesterId
    );
};

const initializeSocket = (io) => {
    // Authentication middleware for socket
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, jwtConfig.accessToken.secret);

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, name: true, avatar: true },
            });

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.user.id;
        console.log(`[SOCKET] User connected: ${socket.user.name} (${userId})`);

        // Store socket connection
        connectedUsers.set(userId, socket.id);

        // Join personal room
        socket.join(userId);

        // Update online status
        await prisma.user.update({
            where: { id: userId },
            data: { isOnline: true, lastSeen: new Date() },
        });

        // [FIX H06] Broadcast online status ONLY to friends, not everyone
        const friendIds = await getUserFriendIds(userId);
        friendIds.forEach(friendId => {
            io.to(friendId).emit('user_online', { userId, isOnline: true });
        });

        // Handle sending messages
        socket.on('send_message', async (data) => {
            try {
                // Rate limit check
                if (!socketRateLimiter.isAllowed(userId)) {
                    socket.emit('error', {
                        message: 'Rate limit exceeded. Please slow down.',
                        code: 'RATE_LIMITED'
                    });
                    return;
                }

                const { receiverId, content, imageUrl, attachments } = data;

                // [FIX H04] Check if blocked before allowing message
                const canChat = await areFriendsAndNotBlocked(userId, receiverId);
                if (!canChat) {
                    socket.emit('error', {
                        message: 'Cannot send message to this user',
                        code: 'NOT_FRIENDS_OR_BLOCKED'
                    });
                    return;
                }

                // Sanitize content
                const sanitizedContent = content ? sanitizeText(content) : null;

                const message = await chatService.sendMessage(userId, receiverId, {
                    content: sanitizedContent,
                    imageUrl,
                    attachments: attachments || []
                });

                // Send to receiver if online
                io.to(receiverId).emit('new_message', message);

                // Confirm to sender
                socket.emit('message_sent', message);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Handle typing indicator
        socket.on('typing', async (data) => {
            // Rate limit check
            if (!socketRateLimiter.isAllowed(userId)) return;

            const { receiverId, isTyping } = data;

            // Only send typing indicator if they are friends
            const canChat = await areFriendsAndNotBlocked(userId, receiverId);
            if (!canChat) return;

            io.to(receiverId).emit('user_typing', {
                userId,
                user: socket.user,
                isTyping
            });
        });

        // Handle read receipts
        socket.on('mark_read', async (data) => {
            try {
                if (!socketRateLimiter.isAllowed(userId)) return;

                const { senderId } = data;

                // Only allow if friends
                const canChat = await areFriendsAndNotBlocked(userId, senderId);
                if (!canChat) return;

                await chatService.markAsRead(userId, senderId);
                io.to(senderId).emit('messages_read', { readBy: userId });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // [FIX C02] Handle friend request notifications - VALIDATE FIRST
        socket.on('friend_request', async (data) => {
            try {
                if (!socketRateLimiter.isAllowed(userId)) return;

                const { addresseeId } = data;

                // CRITICAL: Verify the friendship request actually exists in DB
                const pendingRequest = await prisma.friendship.findFirst({
                    where: {
                        requesterId: userId,
                        addresseeId: addresseeId,
                        status: 'PENDING',
                    },
                });

                // Only emit if there's a real pending request
                if (pendingRequest) {
                    io.to(addresseeId).emit('new_friend_request', {
                        from: socket.user,
                        friendshipId: pendingRequest.id,
                    });
                } else {
                    console.warn(`[SECURITY] Blocked spoofed friend_request from ${userId} to ${addresseeId}`);
                }
            } catch (error) {
                console.error('[SOCKET] friend_request error:', error.message);
            }
        });

        // Handle friend request accepted notification
        socket.on('friend_accepted', async (data) => {
            try {
                if (!socketRateLimiter.isAllowed(userId)) return;

                const { friendId } = data;

                // Verify they are actually friends now
                const areFriends = await areFriendsAndNotBlocked(userId, friendId);
                if (areFriends) {
                    io.to(friendId).emit('friend_request_accepted', {
                        from: socket.user,
                    });
                }
            } catch (error) {
                console.error('[SOCKET] friend_accepted error:', error.message);
            }
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            console.log(`[SOCKET] User disconnected: ${socket.user.name}`);

            connectedUsers.delete(userId);

            // Update online status
            await prisma.user.update({
                where: { id: userId },
                data: { isOnline: false, lastSeen: new Date() },
            });

            // [FIX H06] Broadcast offline status ONLY to friends
            const friendIds = await getUserFriendIds(userId);
            friendIds.forEach(friendId => {
                io.to(friendId).emit('user_online', { userId, isOnline: false });
            });
        });
    });

    return io;
};

// Helper to get connected socket for a user
const getSocketId = (userId) => connectedUsers.get(userId);

// Helper to emit to specific user
const emitToUser = (io, userId, event, data) => {
    io.to(userId).emit(event, data);
};

module.exports = { initializeSocket, getSocketId, emitToUser };
