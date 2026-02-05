const { friendService } = require('../services');
const { success, created, error } = require('../utils/response');

class FriendController {
    /**
     * GET /api/friends
     */
    async getFriends(req, res) {
        try {
            const friends = await friendService.getFriends(req.user.id);
            return success(res, friends);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * GET /api/friends/requests/pending
     */
    async getPendingRequests(req, res) {
        try {
            const requests = await friendService.getPendingRequests(req.user.id);
            return success(res, requests);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * GET /api/friends/requests/sent
     */
    async getSentRequests(req, res) {
        try {
            const requests = await friendService.getSentRequests(req.user.id);
            return success(res, requests);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/friends/request
     */
    async sendRequest(req, res) {
        try {
            const { addresseeId } = req.body;
            const result = await friendService.sendRequest(req.user.id, addresseeId);
            return created(res, result, 'Friend request sent');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/friends/accept/:id
     */
    async acceptRequest(req, res) {
        try {
            const result = await friendService.acceptRequest(req.params.id, req.user.id);
            return success(res, result, 'Friend request accepted');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/friends/reject/:id
     */
    async rejectRequest(req, res) {
        try {
            await friendService.rejectRequest(req.params.id, req.user.id);
            return success(res, null, 'Friend request rejected');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * DELETE /api/friends/:id
     */
    async removeFriend(req, res) {
        try {
            await friendService.removeFriend(req.params.id, req.user.id);
            return success(res, null, 'Friend removed');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * GET /api/friends/search
     */
    async searchUsers(req, res) {
        try {
            const { q } = req.query;
            if (!q || q.length < 2) {
                return success(res, []);
            }
            const users = await friendService.searchUsers(req.user.id, q);
            return success(res, users);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }
}

module.exports = new FriendController();
