const prisma = require('../config/database');

class FriendService {
    /**
     * Get friend list for a user
     */
    async getFriends(userId) {
        const friendships = await prisma.friendship.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { requesterId: userId },
                    { addresseeId: userId },
                ],
            },
            include: {
                requester: {
                    select: { id: true, name: true, avatar: true, email: true, isOnline: true, lastSeen: true },
                },
                addressee: {
                    select: { id: true, name: true, avatar: true, email: true, isOnline: true, lastSeen: true },
                },
            },
        });

        // Return the friend (the other user in the friendship)
        const friends = friendships.map(friendship => ({
            id: friendship.id,
            friend: friendship.requesterId === userId ? friendship.addressee : friendship.requester,
            since: friendship.createdAt,
        }));

        return friends;
    }

    /**
     * Get pending friend requests (received)
     */
    async getPendingRequests(userId) {
        const requests = await prisma.friendship.findMany({
            where: {
                addresseeId: userId,
                status: 'PENDING',
            },
            include: {
                requester: {
                    select: { id: true, name: true, avatar: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return requests.map(req => ({
            id: req.id,
            from: req.requester,
            createdAt: req.createdAt,
        }));
    }

    /**
     * Get sent friend requests
     */
    async getSentRequests(userId) {
        const requests = await prisma.friendship.findMany({
            where: {
                requesterId: userId,
                status: 'PENDING',
            },
            include: {
                addressee: {
                    select: { id: true, name: true, avatar: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return requests.map(req => ({
            id: req.id,
            to: req.addressee,
            createdAt: req.createdAt,
        }));
    }

    /**
     * Send friend request
     */
    async sendRequest(requesterId, addresseeId) {
        if (requesterId === addresseeId) {
            throw { status: 400, message: 'Cannot send friend request to yourself' };
        }

        // Check if addressee exists
        const addressee = await prisma.user.findUnique({ where: { id: addresseeId } });
        if (!addressee) {
            throw { status: 404, message: 'User not found' };
        }

        // Check if friendship already exists
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId, addresseeId },
                    { requesterId: addresseeId, addresseeId: requesterId },
                ],
            },
        });

        if (existingFriendship) {
            if (existingFriendship.status === 'ACCEPTED') {
                throw { status: 400, message: 'You are already friends' };
            }
            if (existingFriendship.status === 'PENDING') {
                throw { status: 400, message: 'Friend request already pending' };
            }
            if (existingFriendship.status === 'BLOCKED') {
                throw { status: 400, message: 'Cannot send request' };
            }
        }

        const friendship = await prisma.friendship.create({
            data: {
                requesterId,
                addresseeId,
                status: 'PENDING',
            },
            include: {
                addressee: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });

        return {
            id: friendship.id,
            to: friendship.addressee,
            status: friendship.status,
            createdAt: friendship.createdAt,
        };
    }

    /**
     * Accept friend request
     */
    async acceptRequest(friendshipId, userId) {
        const friendship = await prisma.friendship.findFirst({
            where: {
                id: friendshipId,
                addresseeId: userId,
                status: 'PENDING',
            },
            include: {
                requester: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });

        if (!friendship) {
            throw { status: 404, message: 'Friend request not found' };
        }

        await prisma.friendship.update({
            where: { id: friendshipId },
            data: { status: 'ACCEPTED' },
        });

        return {
            id: friendship.id,
            friend: friendship.requester,
            status: 'ACCEPTED',
        };
    }

    /**
     * Reject friend request
     */
    async rejectRequest(friendshipId, userId) {
        const friendship = await prisma.friendship.findFirst({
            where: {
                id: friendshipId,
                addresseeId: userId,
                status: 'PENDING',
            },
        });

        if (!friendship) {
            throw { status: 404, message: 'Friend request not found' };
        }

        await prisma.friendship.update({
            where: { id: friendshipId },
            data: { status: 'REJECTED' },
        });

        return true;
    }

    /**
     * Remove friend
     */
    async removeFriend(friendshipId, userId) {
        const friendship = await prisma.friendship.findFirst({
            where: {
                id: friendshipId,
                status: 'ACCEPTED',
                OR: [
                    { requesterId: userId },
                    { addresseeId: userId },
                ],
            },
        });

        if (!friendship) {
            throw { status: 404, message: 'Friendship not found' };
        }

        await prisma.friendship.delete({ where: { id: friendshipId } });

        return true;
    }

    /**
     * Check if two users are friends
     */
    async areFriends(userId1, userId2) {
        const friendship = await prisma.friendship.findFirst({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { requesterId: userId1, addresseeId: userId2 },
                    { requesterId: userId2, addresseeId: userId1 },
                ],
            },
        });

        return !!friendship;
    }

    /**
     * [FIX H04] Check if two users are friends AND neither has blocked the other
     * This is the secure version that prevents blocked user bypass
     */
    async areFriendsAndNotBlocked(userId1, userId2) {
        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: userId1, addresseeId: userId2 },
                    { requesterId: userId2, addresseeId: userId1 },
                ],
            },
        });

        // Must be ACCEPTED - BLOCKED, PENDING, REJECTED are all denied
        return friendship?.status === 'ACCEPTED';
    }

    /**
     * [FIX H04] Check if either user has blocked the other
     */
    async isBlocked(userId1, userId2) {
        const friendship = await prisma.friendship.findFirst({
            where: {
                status: 'BLOCKED',
                OR: [
                    { requesterId: userId1, addresseeId: userId2 },
                    { requesterId: userId2, addresseeId: userId1 },
                ],
            },
        });

        return !!friendship;
    }

    /**
     * Search users (for adding friends)
     */
    async searchUsers(userId, query) {
        const users = await prisma.user.findMany({
            where: {
                id: { not: userId },
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
            },
            take: 10,
        });

        // Add friendship status for each user
        const usersWithStatus = await Promise.all(
            users.map(async (user) => {
                const friendship = await prisma.friendship.findFirst({
                    where: {
                        OR: [
                            { requesterId: userId, addresseeId: user.id },
                            { requesterId: user.id, addresseeId: userId },
                        ],
                    },
                });

                return {
                    ...user,
                    friendshipStatus: friendship?.status || null,
                    friendshipId: friendship?.id || null,
                };
            })
        );

        return usersWithStatus;
    }
}

module.exports = new FriendService();
