const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/notes', require('./notes'));
router.use('/calendar', require('./calendar'));
router.use('/reminders', require('./reminders'));
router.use('/friends', require('./friends'));
router.use('/chat', require('./chat'));
router.use('/admin', require('./admin'));
router.use('/upload', require('./upload'));
router.use('/tasks', require('./tasks'));

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
