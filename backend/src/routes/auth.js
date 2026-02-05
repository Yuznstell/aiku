const router = require('express').Router();
const { authController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { authValidation, validate } = require('../middleware/validate');

// Public routes
router.post('/register', authLimiter, authValidation.register, validate, authController.register);
router.post('/login', authLimiter, authValidation.login, validate, authController.login);
router.post('/refresh', authLimiter, authController.refresh);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/password', authenticate, authController.changePassword);

module.exports = router;
