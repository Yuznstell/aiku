const router = require('express').Router();
const { friendController } = require('../controllers');
const { authenticate } = require('../middleware/auth');
const { friendValidation, validate, uuidParam } = require('../middleware/validate');

router.use(authenticate);

router.get('/', friendController.getFriends);
router.get('/search', friendController.searchUsers);
router.get('/requests/pending', friendController.getPendingRequests);
router.get('/requests/sent', friendController.getSentRequests);
router.post('/request', friendValidation.request, validate, friendController.sendRequest);
router.post('/accept/:id', friendValidation.respond, validate, friendController.acceptRequest);
router.post('/reject/:id', friendValidation.respond, validate, friendController.rejectRequest);
router.delete('/:id', uuidParam('id'), validate, friendController.removeFriend);

module.exports = router;
