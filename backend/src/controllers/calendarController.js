const { calendarService } = require('../services');
const { success, created, error } = require('../utils/response');

class CalendarController {
    /**
     * GET /api/calendar
     */
    async getEvents(req, res) {
        try {
            const { startDate, endDate, page, limit } = req.query;
            const result = await calendarService.getEvents(req.user.id, {
                startDate,
                endDate,
                page: parseInt(page),
                limit: parseInt(limit)
            });
            return success(res, result);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * GET /api/calendar/:id
     */
    async getEventById(req, res) {
        try {
            const event = await calendarService.getEventById(req.params.id, req.user.id);
            return success(res, event);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/calendar
     */
    async createEvent(req, res) {
        try {
            const event = await calendarService.createEvent(req.user.id, req.body);
            return created(res, event, 'Event created');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * PUT /api/calendar/:id
     */
    async updateEvent(req, res) {
        try {
            const event = await calendarService.updateEvent(req.params.id, req.user.id, req.body);
            return success(res, event, 'Event updated');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * DELETE /api/calendar/:id
     */
    async deleteEvent(req, res) {
        try {
            await calendarService.deleteEvent(req.params.id, req.user.id);
            return success(res, null, 'Event deleted');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/calendar/:id/share
     */
    async shareEvent(req, res) {
        try {
            const { userId, permission } = req.body;
            const event = await calendarService.shareEvent(req.params.id, req.user.id, { userId, permission });
            return success(res, event, 'Event shared');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * DELETE /api/calendar/:id/share/:userId
     */
    async removeShare(req, res) {
        try {
            const event = await calendarService.removeShare(req.params.id, req.user.id, req.params.userId);
            return success(res, event, 'Share removed');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }
}

module.exports = new CalendarController();
