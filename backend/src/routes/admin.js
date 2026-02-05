const router = require('express').Router();
const { adminController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/rbac');
const { uuidParam, validate, body } = require('../middleware/validate');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.post('/users',
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['USER', 'ADMIN']).withMessage('Role must be USER or ADMIN'),
    validate,
    adminController.createUser
);
router.get('/users/:id', uuidParam('id'), validate, adminController.getUserById);
router.put('/users/:id', uuidParam('id'), validate, adminController.updateUser);
router.delete('/users/:id', uuidParam('id'), validate, adminController.deleteUser);
router.get('/activity', adminController.getActivityLogs);

module.exports = router;

