const { chatService } = require('../services');
const { success, error } = require('../utils/response');
const { uploadImage } = require('../utils/cloudinary');

class ChatController {
    /**
     * GET /api/chat/conversations
     */
    async getConversations(req, res) {
        try {
            const conversations = await chatService.getConversations(req.user.id);
            return success(res, conversations);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * GET /api/chat/messages/:userId
     */
    async getMessages(req, res) {
        try {
            const { limit, cursor } = req.query;
            const result = await chatService.getMessages(
                req.user.id,
                req.params.userId,
                { limit: parseInt(limit), cursor }
            );
            return success(res, result);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/chat/send
     */
    async sendMessage(req, res) {
        try {
            const { receiverId, content } = req.body;
            let imageUrl = null;
            const attachments = [];

            // Handle single image upload (backwards compatible)
            if (req.file) {
                const result = await uploadImage(req.file.buffer, 'aiku/chat');
                imageUrl = result.url;

                // Also add to attachments
                attachments.push({
                    type: 'IMAGE',
                    url: result.url,
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    mimeType: req.file.mimetype,
                });
            }

            // Handle multiple files upload
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const result = await uploadImage(file.buffer, 'aiku/chat');
                    const type = this.getAttachmentType(file.mimetype);
                    attachments.push({
                        type,
                        url: result.url,
                        fileName: file.originalname,
                        fileSize: file.size,
                        mimeType: file.mimetype,
                    });
                }
            }

            const message = await chatService.sendMessage(req.user.id, receiverId, {
                content,
                imageUrl,
                attachments
            });

            // Emit socket event (if socket.io is available)
            if (req.app.get('io')) {
                req.app.get('io').to(receiverId).emit('new_message', message);
            }

            return success(res, message, 'Message sent');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * Get attachment type from mimetype
     */
    getAttachmentType(mimetype) {
        if (mimetype.startsWith('image/')) return 'IMAGE';
        if (mimetype.startsWith('video/')) return 'VIDEO';
        if (mimetype.startsWith('audio/')) return 'AUDIO';
        return 'DOCUMENT';
    }

    /**
     * GET /api/chat/unread
     */
    async getUnreadCount(req, res) {
        try {
            const count = await chatService.getUnreadCount(req.user.id);
            return success(res, { count });
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/chat/read/:userId
     */
    async markAsRead(req, res) {
        try {
            await chatService.markAsRead(req.user.id, req.params.userId);
            return success(res, null, 'Messages marked as read');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * DELETE /api/chat/messages/:id
     */
    async deleteMessage(req, res) {
        try {
            await chatService.deleteMessage(req.params.id, req.user.id);
            return success(res, null, 'Message deleted');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }
}

module.exports = new ChatController();
