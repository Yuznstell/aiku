const router = require('express').Router();
const { noteController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { noteValidation, validate, uuidParam } = require('../middleware/validate');
const { upload, handleUploadError } = require('../middleware/upload');
const { checkNotePermission } = require('../middleware/permission');

// All routes require authentication
router.use(authenticate);

// List and create notes
router.get('/', noteController.getNotes);
router.post('/', noteValidation.create, validate, noteController.createNote);

// Single note operations with permission checks
router.get('/:id', uuidParam('id'), validate, checkNotePermission('VIEWER'), noteController.getNoteById);
router.put('/:id', noteValidation.update, validate, checkNotePermission('EDITOR'), noteController.updateNote);
router.delete('/:id', uuidParam('id'), validate, checkNotePermission('OWNER'), noteController.deleteNote);

// Sharing (owner only)
router.post('/:id/share', noteValidation.share, validate, checkNotePermission('OWNER'), noteController.shareNote);
router.delete('/:id/share/:userId', checkNotePermission('OWNER'), noteController.removeShare);

// Image upload (editor or owner)
router.post('/:id/images', checkNotePermission('EDITOR'), upload.single('image'), handleUploadError, noteController.uploadImage);

module.exports = router;

