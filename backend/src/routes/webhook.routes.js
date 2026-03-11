const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const crypto = require('crypto');

const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!secret) return next();
  if (!signature) return res.status(401).json({ error: 'Signature manquante' });

  const hmac = crypto.createHmac('sha256', secret);
  const body = JSON.stringify(req.body);
  const expected = 'sha256=' + hmac.update(body).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Signature invalide' });
  }
  next();
};

router.post('/poke', verifyWebhookSignature, webhookController.handlePokeEvent);
router.get('/health', (req, res) => res.json({ status: 'webhook-ok' }));

module.exports = router;
