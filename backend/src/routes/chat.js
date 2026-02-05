const router = require('express').Router();
const { chatController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { chatValidation, validate, uuidParam } = require('../middleware/validate');
const { upload, handleUploadError } = require('../middleware/upload');

router.use(authenticate);

router.get('/conversations', chatController.getConversations);
router.get('/unread', chatController.getUnreadCount);
router.get('/messages/:userId', chatValidation.getMessages, validate, chatController.getMessages);
router.post('/send', upload.single('image'), handleUploadError, chatController.sendMessage);
router.post('/read/:userId', uuidParam('userId'), validate, chatController.markAsRead);
router.delete('/messages/:id', uuidParam('id'), validate, chatController.deleteMessage);

module.exports = router;
