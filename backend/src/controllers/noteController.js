const { noteService } = require('../services');
const { success, created, error, notFound } = require('../utils/response');
const { uploadImage } = require('../utils/cloudinary');

class NoteController {
    /**
     * GET /api/notes
     */
    async getNotes(req, res) {
        try {
            const { search, tag, page, limit } = req.query;
            const result = await noteService.getNotes(req.user.id, { search, tag, page: parseInt(page), limit: parseInt(limit) });
            return success(res, result);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * GET /api/notes/:id
     */
    async getNoteById(req, res) {
        try {
            const note = await noteService.getNoteById(req.params.id, req.user.id);
            return success(res, note);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/notes
     */
    async createNote(req, res) {
        try {
            const { title, content, tags } = req.body;
            const note = await noteService.createNote(req.user.id, { title, content, tags });
            return created(res, note, 'Note created');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * PUT /api/notes/:id
     */
    async updateNote(req, res) {
        try {
            const { title, content, tags } = req.body;
            const note = await noteService.updateNote(req.params.id, req.user.id, { title, content, tags });
            return success(res, note, 'Note updated');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * DELETE /api/notes/:id
     */
    async deleteNote(req, res) {
        try {
            await noteService.deleteNote(req.params.id, req.user.id);
            return success(res, null, 'Note deleted');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/notes/:id/share
     */
    async shareNote(req, res) {
        try {
            const { userId, permission } = req.body;
            const note = await noteService.shareNote(req.params.id, req.user.id, { userId, permission });
            return success(res, note, 'Note shared');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * DELETE /api/notes/:id/share/:userId
     */
    async removeShare(req, res) {
        try {
            const note = await noteService.removeShare(req.params.id, req.user.id, req.params.userId);
            return success(res, note, 'Share removed');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/notes/:id/images
     */
    async uploadImage(req, res) {
        try {
            if (!req.file) {
                return error(res, 'No image uploaded', 400);
            }

            const result = await uploadImage(req.file.buffer, 'aiku/notes');
            return success(res, { url: result.url, publicId: result.publicId }, 'Image uploaded');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }
}

module.exports = new NoteController();
