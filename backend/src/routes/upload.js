const router = require('express').Router();
const { uploadController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimit');

router.use(authenticate);
router.use(uploadLimiter);

router.post('/avatar', upload.single('image'), handleUploadError, uploadController.uploadAvatar);
router.post('/image', upload.single('image'), handleUploadError, uploadController.uploadImage);

module.exports = router;
