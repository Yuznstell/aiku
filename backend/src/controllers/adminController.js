const { adminService } = require('../services');
const { success, error } = require('../utils/response');

class AdminController {
    /**
     * POST /api/admin/users
     */
    async createUser(req, res) {
        try {
            const { name, email, password, role } = req.body;
            const user = await adminService.createUser({ name, email, password, role });
            return success(res, user, 'User created successfully', 201);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * GET /api/admin/users
     */
    async getUsers(req, res) {
        try {
            const { page, limit, search, role } = req.query;
            const result = await adminService.getUsers({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                role
            });
            return success(res, result);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * GET /api/admin/users/:id
     */
    async getUserById(req, res) {
        try {
            const user = await adminService.getUserById(req.params.id);
            return success(res, user);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * PUT /api/admin/users/:id
     */
    async updateUser(req, res) {
        try {
            const user = await adminService.updateUser(req.params.id, req.body);
            return success(res, user, 'User updated');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * DELETE /api/admin/users/:id
     */
    async deleteUser(req, res) {
        try {
            await adminService.deleteUser(req.params.id, req.user.id);
            return success(res, null, 'User deleted');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * GET /api/admin/stats
     */
    async getStats(req, res) {
        try {
            const stats = await adminService.getStats();
            return success(res, stats);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * GET /api/admin/activity
     */
    async getActivityLogs(req, res) {
        try {
            const { page, limit, userId, entityType } = req.query;
            const result = await adminService.getActivityLogs({
                page: parseInt(page),
                limit: parseInt(limit),
                userId,
                entityType
            });
            return success(res, result);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }
}

module.exports = new AdminController();
