const prisma = require('../config/database');

class TaskService {
    /**
     * Get all tasks for a user
     */
    async getTasks(userId) {
        const tasks = await prisma.task.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        // Group by status
        const grouped = {
            TODO: tasks.filter(t => t.status === 'TODO'),
            DOING: tasks.filter(t => t.status === 'DOING'),
            DONE: tasks.filter(t => t.status === 'DONE'),
        };

        return {
            tasks,
            grouped,
            counts: {
                TODO: grouped.TODO.length,
                DOING: grouped.DOING.length,
                DONE: grouped.DONE.length,
            }
        };
    }

    /**
     * Get single task by ID
     */
    async getTaskById(taskId, userId) {
        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                userId,
            },
        });

        if (!task) {
            const err = new Error('Task not found');
            err.status = 404;
            throw err;
        }

        return task;
    }

    /**
     * Create a new task
     */
    async createTask(userId, { title, status = 'TODO' }) {
        const task = await prisma.task.create({
            data: {
                title,
                status,
                userId,
            },
        });

        return task;
    }

    /**
     * Update task (title, icon, status)
     */
    async updateTask(taskId, userId, data) {
        const task = await this.getTaskById(taskId, userId);

        const updated = await prisma.task.update({
            where: { id: task.id },
            data: {
                title: data.title !== undefined ? data.title : task.title,
                icon: data.icon !== undefined ? data.icon : task.icon,
                status: data.status !== undefined ? data.status : task.status,
            },
        });

        return updated;
    }

    /**
     * Update task status only (for drag-and-drop and status switcher)
     * Auto-sets completedAt when moving to DONE
     */
    async updateTaskStatus(taskId, userId, status) {
        const task = await this.getTaskById(taskId, userId);
        const oldStatus = task.status;

        const validStatuses = ['TODO', 'DOING', 'DONE'];
        if (!validStatuses.includes(status)) {
            const err = new Error('Invalid status');
            err.status = 400;
            throw err;
        }

        // Prepare update data
        const updateData = { status };

        // Auto-set completedAt when moving to DONE
        if (status === 'DONE' && oldStatus !== 'DONE') {
            updateData.completedAt = new Date();
        }
        // Reset completedAt if reopening task from DONE
        else if (status !== 'DONE' && oldStatus === 'DONE') {
            updateData.completedAt = null;
        }

        const updated = await prisma.task.update({
            where: { id: task.id },
            data: updateData,
        });

        return updated;
    }

    /**
     * Delete a task
     */
    async deleteTask(taskId, userId) {
        const task = await this.getTaskById(taskId, userId);

        await prisma.task.delete({
            where: { id: task.id },
        });

        return true;
    }

    /**
     * Duplicate a task
     * Creates a copy with "Copy of..." prefix and same status
     */
    async duplicateTask(taskId, userId) {
        const originalTask = await this.getTaskById(taskId, userId);

        const duplicatedTask = await prisma.task.create({
            data: {
                title: `Copy of ${originalTask.title}`,
                status: originalTask.status,
                userId,
                // Reset completedAt for the duplicate
                completedAt: null,
            },
        });

        return duplicatedTask;
    }
}

module.exports = new TaskService();
