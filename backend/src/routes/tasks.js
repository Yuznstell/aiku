const router = require('express').Router();
const { taskController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { uuidParam, validate } = require('../middleware/validate');
const { body } = require('express-validator');

// Task validation
const taskValidation = {
    create: [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('status').optional().isIn(['TODO', 'DOING', 'DONE']).withMessage('Invalid status'),
    ],
    update: [
        body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
        body('status').optional().isIn(['TODO', 'DOING', 'DONE']).withMessage('Invalid status'),
    ],
    updateStatus: [
        body('status').isIn(['TODO', 'DOING', 'DONE']).withMessage('Invalid status'),
    ],
};

router.use(authenticate);

router.get('/', taskController.getTasks);
router.post('/', taskValidation.create, validate, taskController.createTask);
router.get('/:id', uuidParam('id'), validate, taskController.getTaskById);
router.put('/:id', uuidParam('id'), taskValidation.update, validate, taskController.updateTask);
router.put('/:id/status', uuidParam('id'), taskValidation.updateStatus, validate, taskController.updateTaskStatus);
router.post('/:id/duplicate', uuidParam('id'), validate, taskController.duplicateTask);
router.delete('/:id', uuidParam('id'), validate, taskController.deleteTask);

module.exports = router;
