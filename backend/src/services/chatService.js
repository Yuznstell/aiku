const prisma = require('../config/database');
const friendService = require('./friendService');

class ChatService {
    /**
     * Get messages between two users
     * [FIX H04] Uses areFriendsAndNotBlocked to check blocked status
     */
    async getMessages(userId, otherUserId, { limit = 50, cursor }) {
        const validLimit = parseInt(limit) || 50;

        // Check if they are friends AND not blocked
        const canChat = await friendService.areFriendsAndNotBlocked(userId, otherUserId);
        if (!canChat) {
            throw { status: 403, message: 'You can only chat with friends (not blocked)' };
        }

        const where = {
            OR: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId },
            ],
        };

        if (cursor) {
            where.id = { lt: cursor };
        }

        const messages = await prisma.message.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: validLimit,
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
            },
        });

        // Mark unread messages as read
        await prisma.message.updateMany({
            where: {
                senderId: otherUserId,
                receiverId: userId,
                isRead: false,
            },
            data: { isRead: true },
        });

        return {
            messages: messages.reverse(),
            hasMore: messages.length === validLimit,
            nextCursor: messages.length > 0 ? messages[0].id : null,
        };
    }

    /**
     * Send a message with optional attachments
     * [FIX H04] Uses areFriendsAndNotBlocked to prevent blocked user bypass
     */
    async sendMessage(senderId, receiverId, { content, imageUrl, attachments = [] }) {
        if (!content && !imageUrl && attachments.length === 0) {
            throw { status: 400, message: 'Message must have content or attachments' };
        }

        // [FIX H04] Check if they are friends AND not blocked
        const canChat = await friendService.areFriendsAndNotBlocked(senderId, receiverId);
        if (!canChat) {
            throw { status: 403, message: 'You can only chat with friends (not blocked)' };
        }

        const message = await prisma.message.create({
            data: {
                content: content || null,
                imageUrl: imageUrl || null,
                senderId,
                receiverId,
                attachments: attachments.length > 0 ? {
                    create: attachments.map(att => ({
                        type: att.type,
                        url: att.url,
                        fileName: att.fileName || null,
                        fileSize: att.fileSize || null,
                        mimeType: att.mimeType || null,
                    })),
                } : undefined,
            },
            include: {
                sender: { select: { id: true, name: true, avatar: true } },
                receiver: { select: { id: true, name: true, avatar: true } },
                attachments: true,
            },
        });

        return message;
    }

    /**
     * Get conversation list (recent conversations)
     */
    async getConversations(userId) {
        // Get all messages involving the user
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId },
                ],
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, name: true, avatar: true, isOnline: true } },
                receiver: { select: { id: true, name: true, avatar: true, isOnline: true } },
            },
        });

        // Group by conversation partner
        const conversationMap = new Map();

        for (const message of messages) {
            const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
            const partner = message.senderId === userId ? message.receiver : message.sender;

            if (!conversationMap.has(partnerId)) {
                // Count unread messages
                const unreadCount = await prisma.message.count({
                    where: {
                        senderId: partnerId,
                        receiverId: userId,
                        isRead: false,
                    },
                });

                conversationMap.set(partnerId, {
                    partner,
                    lastMessage: {
                        content: message.content,
                        imageUrl: message.imageUrl,
                        createdAt: message.createdAt,
                        isFromMe: message.senderId === userId,
                    },
                    unreadCount,
                });
            }
        }

        return Array.from(conversationMap.values());
    }

    /**
     * Get unread message count
     */
    async getUnreadCount(userId) {
        const count = await prisma.message.count({
            where: {
                receiverId: userId,
                isRead: false,
            },
        });

        return count;
    }

    /**
     * Mark messages as read
     */
    async markAsRead(userId, senderId) {
        await prisma.message.updateMany({
            where: {
                senderId,
                receiverId: userId,
                isRead: false,
            },
            data: { isRead: true },
        });

        return true;
    }

    /**
     * Delete a message
     */
    async deleteMessage(messageId, userId) {
        const message = await prisma.message.findFirst({
            where: {
                id: messageId,
                senderId: userId,
            },
        });

        if (!message) {
            throw { status: 404, message: 'Message not found or not authorized' };
        }

        await prisma.message.delete({ where: { id: messageId } });

        return true;
    }
}

module.exports = new ChatService();
