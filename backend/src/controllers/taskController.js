const { taskService } = require('../services');
const { success, created, error } = require('../utils/response');

class TaskController {
    /**
     * GET /api/tasks
     */
    async getTasks(req, res) {
        try {
            const result = await taskService.getTasks(req.user.id);
            return success(res, result);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * GET /api/tasks/:id
     */
    async getTaskById(req, res) {
        try {
            const task = await taskService.getTaskById(req.params.id, req.user.id);
            return success(res, task);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/tasks
     */
    async createTask(req, res) {
        try {
            const task = await taskService.createTask(req.user.id, req.body);
            return created(res, task, 'Task created');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * PUT /api/tasks/:id
     */
    async updateTask(req, res) {
        try {
            const task = await taskService.updateTask(req.params.id, req.user.id, req.body);
            return success(res, task, 'Task updated');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * PUT /api/tasks/:id/status
     */
    async updateTaskStatus(req, res) {
        try {
            const { status } = req.body;
            const task = await taskService.updateTaskStatus(req.params.id, req.user.id, status);
            return success(res, task, 'Task status updated');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * DELETE /api/tasks/:id
     */
    async deleteTask(req, res) {
        try {
            await taskService.deleteTask(req.params.id, req.user.id);
            return success(res, null, 'Task deleted');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/tasks/:id/duplicate
     */
    async duplicateTask(req, res) {
        try {
            const task = await taskService.duplicateTask(req.params.id, req.user.id);
            return created(res, task, 'Task duplicated');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }
}

module.exports = new TaskController();
