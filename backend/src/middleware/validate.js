const { validationResult, body, param, query } = require('express-validator');

// Handle validation errors
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }

    next();
};

// Auth validation rules
const authValidation = {
    register: [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Name is required')
            .isLength({ max: 100 })
            .withMessage('Name must be less than 100 characters'),
    ],
    login: [
        body('email')
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
    ],
};

// Note validation rules
const noteValidation = {
    create: [
        body('title')
            .trim()
            .notEmpty()
            .withMessage('Title is required')
            .isLength({ max: 255 })
            .withMessage('Title must be less than 255 characters'),
        body('content')
            .optional()
            .isString(),
        body('tags')
            .optional()
            .isArray()
            .withMessage('Tags must be an array'),
    ],
    update: [
        param('id').isUUID().withMessage('Invalid note ID'),
        body('title')
            .optional()
            .trim()
            .isLength({ max: 255 })
            .withMessage('Title must be less than 255 characters'),
        body('content')
            .optional()
            .isString(),
    ],
    share: [
        param('id').isUUID().withMessage('Invalid note ID'),
        body('userId')
            .isUUID()
            .withMessage('Invalid user ID'),
        body('permission')
            .isIn(['VIEWER', 'EDITOR'])
            .withMessage('Permission must be VIEWER or EDITOR'),
    ],
};

// Calendar validation rules
const calendarValidation = {
    create: [
        body('title')
            .trim()
            .notEmpty()
            .withMessage('Title is required'),
        body('startTime')
            .isISO8601()
            .withMessage('Start time must be a valid date'),
        body('endTime')
            .isISO8601()
            .withMessage('End time must be a valid date'),
        body('color')
            .optional()
            .matches(/^#[0-9A-Fa-f]{6}$/)
            .withMessage('Color must be a valid hex color'),
    ],
    update: [
        param('id').isUUID().withMessage('Invalid event ID'),
        body('title').optional().trim(),
        body('startTime').optional().isISO8601(),
        body('endTime').optional().isISO8601(),
    ],
};

// Reminder validation rules
const reminderValidation = {
    create: [
        body('title')
            .trim()
            .notEmpty()
            .withMessage('Title is required'),
        body('remindAt')
            .isISO8601()
            .withMessage('Remind time must be a valid date'),
        body('repeatType')
            .optional()
            .isIn(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
            .withMessage('Invalid repeat type'),
    ],
    update: [
        param('id').isUUID().withMessage('Invalid reminder ID'),
        body('title').optional().trim(),
        body('remindAt').optional().isISO8601(),
    ],
};

// Friend validation rules
const friendValidation = {
    request: [
        body('addresseeId')
            .isUUID()
            .withMessage('Invalid user ID'),
    ],
    respond: [
        param('id').isUUID().withMessage('Invalid friendship ID'),
    ],
};

// Chat validation rules
const chatValidation = {
    send: [
        body('receiverId')
            .isUUID()
            .withMessage('Invalid receiver ID'),
        body('content')
            .optional()
            .isString(),
    ],
    getMessages: [
        param('userId').isUUID().withMessage('Invalid user ID'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('cursor')
            .optional()
            .isUUID()
            .withMessage('Invalid cursor'),
    ],
};

// UUID param validation
const uuidParam = (paramName = 'id') => [
    param(paramName).isUUID().withMessage(`Invalid ${paramName}`),
];

module.exports = {
    validate,
    body,
    authValidation,
    noteValidation,
    calendarValidation,
    reminderValidation,
    friendValidation,
    chatValidation,
    uuidParam,
};

