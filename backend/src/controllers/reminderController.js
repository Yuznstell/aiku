const { reminderService } = require('../services');
const { success, created, error } = require('../utils/response');

class ReminderController {
    /**
     * GET /api/reminders
     */
    async getReminders(req, res) {
        try {
            const { completed, upcoming, page, limit } = req.query;
            const result = await reminderService.getReminders(req.user.id, {
                completed,
                upcoming,
                page: parseInt(page),
                limit: parseInt(limit)
            });
            return success(res, result);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * GET /api/reminders/:id
     */
    async getReminderById(req, res) {
        try {
            const reminder = await reminderService.getReminderById(req.params.id, req.user.id);
            return success(res, reminder);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/reminders
     */
    async createReminder(req, res) {
        try {
            const reminder = await reminderService.createReminder(req.user.id, req.body);
            return created(res, reminder, 'Reminder created');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * PUT /api/reminders/:id
     */
    async updateReminder(req, res) {
        try {
            const reminder = await reminderService.updateReminder(req.params.id, req.user.id, req.body);
            return success(res, reminder, 'Reminder updated');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * PUT /api/reminders/:id/complete
     */
    async markComplete(req, res) {
        try {
            const { isCompleted } = req.body;
            const reminder = await reminderService.markComplete(req.params.id, req.user.id, isCompleted !== false);
            return success(res, reminder, 'Reminder updated');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * DELETE /api/reminders/:id
     */
    async deleteReminder(req, res) {
        try {
            await reminderService.deleteReminder(req.params.id, req.user.id);
            return success(res, null, 'Reminder deleted');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/reminders/:id/share
     */
    async shareReminder(req, res) {
        try {
            const { userId, permission } = req.body;
            const reminder = await reminderService.shareReminder(
                req.params.id,
                req.user.id,
                userId,
                permission
            );
            return success(res, reminder, 'Reminder shared');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * DELETE /api/reminders/:id/share/:userId
     */
    async removeShare(req, res) {
        try {
            const reminder = await reminderService.removeShare(
                req.params.id,
                req.user.id,
                req.params.userId
            );
            return success(res, reminder, 'Share removed');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }
}

module.exports = new ReminderController();

