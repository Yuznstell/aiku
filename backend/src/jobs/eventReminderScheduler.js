const prisma = require('../config/database');
const emailService = require('../services/emailService');

/**
 * Event Reminder Scheduler
 * Checks for events that need reminders and sends notifications
 */
class EventReminderScheduler {
    constructor() {
        this.intervalId = null;
        this.checkInterval = 60 * 1000; // Check every minute
    }

    /**
     * Start the scheduler
     */
    start() {
        console.log('📅 Event reminder scheduler started');
        this.intervalId = setInterval(() => this.checkReminders(), this.checkInterval);
        // Run immediately on start
        this.checkReminders();
    }

    /**
     * Stop the scheduler
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('📅 Event reminder scheduler stopped');
        }
    }

    /**
     * Check for events that need reminders
     */
    async checkReminders() {
        try {
            const now = new Date();

            // Find events with reminders that haven't been sent yet
            const events = await prisma.calendarEvent.findMany({
                where: {
                    reminderMinutes: { not: null },
                    reminderSent: false,
                    startTime: { gt: now }, // Event is in the future
                },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            });

            for (const event of events) {
                const reminderTime = new Date(event.startTime);
                reminderTime.setMinutes(reminderTime.getMinutes() - event.reminderMinutes);

                // Check if it's time to send the reminder
                if (now >= reminderTime) {
                    await this.sendReminder(event);

                    // Mark reminder as sent
                    await prisma.calendarEvent.update({
                        where: { id: event.id },
                        data: { reminderSent: true },
                    });
                }
            }
        } catch (error) {
            console.error('Error checking event reminders:', error);
        }
    }

    /**
     * Send reminder notification via email
     */
    async sendReminder(event) {
        const minutesText = event.reminderMinutes === 1
            ? '1 minute'
            : event.reminderMinutes >= 60
                ? `${event.reminderMinutes / 60} hour(s)`
                : `${event.reminderMinutes} minutes`;

        console.log(`🔔 Reminder: "${event.title}" starts in ${minutesText} (User: ${event.user.name})`);

        // Send email notification
        try {
            await emailService.sendEventReminder(event.user, event);
        } catch (error) {
            console.error('Failed to send email reminder:', error.message);
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: event.userId,
                action: 'REMINDER',
                entityType: 'EVENT',
                entityId: event.id,
                description: `Reminder sent for event: ${event.title}`,
            },
        });
    }
}

module.exports = new EventReminderScheduler();

