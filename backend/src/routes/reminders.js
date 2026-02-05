const router = require('express').Router();
const { reminderController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { reminderValidation, validate, uuidParam } = require('../middleware/validate');

router.use(authenticate);

router.get('/', reminderController.getReminders);
router.post('/', reminderValidation.create, validate, reminderController.createReminder);
router.get('/:id', uuidParam('id'), validate, reminderController.getReminderById);
router.put('/:id', reminderValidation.update, validate, reminderController.updateReminder);
router.put('/:id/complete', uuidParam('id'), validate, reminderController.markComplete);
router.delete('/:id', uuidParam('id'), validate, reminderController.deleteReminder);

// Sharing
router.post('/:id/share', uuidParam('id'), validate, reminderController.shareReminder);
router.delete('/:id/share/:userId', reminderController.removeShare);

module.exports = router;

