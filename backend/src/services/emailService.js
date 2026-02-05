const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    /**
     * Send email
     */
    async sendEmail({ to, subject, html, text }) {
        try {
            const info = await this.transporter.sendMail({
                from: `"AIKU" <${process.env.SMTP_USER}>`,
                to,
                subject,
                text,
                html,
            });
            console.log('📧 Email sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('📧 Email error:', error.message);
            throw error;
        }
    }

    /**
     * Send event reminder email
     */
    async sendEventReminder(user, event) {
        const minutesText = event.reminderMinutes === 1
            ? '1 minute'
            : event.reminderMinutes >= 60
                ? `${event.reminderMinutes / 60} hour(s)`
                : `${event.reminderMinutes} minutes`;

        const startTime = new Date(event.startTime).toLocaleString('id-ID', {
            dateStyle: 'full',
            timeStyle: 'short',
        });

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px; color: white; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0;">⏰ Event Reminder</h1>
                </div>
                <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #1f2937; margin-top: 0;">${event.title}</h2>
                    <p style="color: #6b7280;">Your event starts in <strong>${minutesText}</strong></p>
                    <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #374151;"><strong>📅 When:</strong> ${startTime}</p>
                        ${event.description ? `<p style="margin: 10px 0 0; color: #374151;"><strong>📝 Details:</strong> ${event.description}</p>` : ''}
                    </div>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                        This is an automated reminder from AIKU.
                    </p>
                </div>
            </div>
        `;

        return this.sendEmail({
            to: user.email,
            subject: `⏰ Reminder: ${event.title} starts in ${minutesText}`,
            html,
            text: `Reminder: ${event.title} starts in ${minutesText} at ${startTime}`,
        });
    }

    /**
     * Send task reminder email
     */
    async sendTaskReminder(user, reminder) {
        const remindAt = new Date(reminder.remindAt).toLocaleString('id-ID', {
            dateStyle: 'full',
            timeStyle: 'short',
        });

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10b981, #06b6d4); padding: 20px; color: white; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0;">🔔 Task Reminder</h1>
                </div>
                <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #1f2937; margin-top: 0;">${reminder.title}</h2>
                    <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #374151;"><strong>⏰ Time:</strong> ${remindAt}</p>
                        ${reminder.description ? `<p style="margin: 10px 0 0; color: #374151;"><strong>📝 Details:</strong> ${reminder.description}</p>` : ''}
                    </div>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                        This is an automated reminder from AIKU.
                    </p>
                </div>
            </div>
        `;

        return this.sendEmail({
            to: user.email,
            subject: `🔔 Reminder: ${reminder.title}`,
            html,
            text: `Reminder: ${reminder.title} at ${remindAt}`,
        });
    }
}

module.exports = new EmailService();
