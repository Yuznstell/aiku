const router = require('express').Router();
const { calendarController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { calendarValidation, validate, uuidParam } = require('../middleware/validate');

router.use(authenticate);

router.get('/', calendarController.getEvents);
router.post('/', calendarValidation.create, validate, calendarController.createEvent);
router.get('/:id', uuidParam('id'), validate, calendarController.getEventById);
router.put('/:id', calendarValidation.update, validate, calendarController.updateEvent);
router.delete('/:id', uuidParam('id'), validate, calendarController.deleteEvent);

// Sharing
router.post('/:id/share', calendarController.shareEvent);
router.delete('/:id/share/:userId', calendarController.removeShare);

module.exports = router;
