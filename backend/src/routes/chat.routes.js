const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { authMiddleware } = require('../middleware/auth.middleware');
const chatController = require('../controllers/chat.controller');

router.use(authMiddleware);

router.get('/sessions', chatController.getSessions);
router.post('/sessions', [
  body('title').optional().trim().isLength({ max: 200 })
], chatController.createSession);
router.get('/sessions/:sessionId',
  validate([param('sessionId').isUUID()]), chatController.getSession);
router.delete('/sessions/:sessionId', chatController.deleteSession);
router.put('/sessions/:sessionId/title', [
  body('title').trim().isLength({ min: 1, max: 200 })
], chatController.updateSessionTitle);

router.get('/sessions/:sessionId/messages', chatController.getMessages);
router.post('/sessions/:sessionId/messages', validate([
  body('content').trim().isLength({ min: 1, max: 50000 }).withMessage('Message content required')
]), chatController.sendMessage);

router.get('/history', chatController.getHistory);
router.delete('/history', chatController.clearHistory);

module.exports = router;
