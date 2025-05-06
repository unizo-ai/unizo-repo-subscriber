const express = require('express');
const { body, param, header, validationResult } = require('express-validator');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const logger = require('../utils/logger');

/**
 * @route POST /unizo/v1/organizations/{organizationId}/repositories/register
 * @desc Register webhooks for all repositories in an organization
 * @access Private
 */
router.post(
  '/organizations/:organizationId/repositories/register',
  [
    // Validate path parameter
    param('organizationId')
      .notEmpty()
      .withMessage('Organization ID is required')
      .isString()
      .withMessage('Organization ID must be a string'),
    
    // Validate headers
    header('integrationId')
      .notEmpty()
      .withMessage('integrationId header is required')
      .isString()
      .withMessage('integrationId must be a string'),
    
    // Custom middleware to check validation results
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          errors: errors.array().map(err => ({
            param: err.param,
            message: err.msg
          }))
        });
      }
      next();
    }
  ],
  webhookController.registerRepositoryWebhooks
);

// Middleware to parse raw body for webhook signature verification
const rawBodyParser = (req, res, next) => {
  if (req.method === 'POST' && req.headers['x-hub-signature-256']) {
    let data = '';
    req.setEncoding('utf8');
    
    req.on('data', chunk => {
      data += chunk;
    });

    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Route error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
};

// Register routes
router.use(rawBodyParser);

// Webhook registration routes
router.post('/repositories/:repositoryName/webhooks', webhookController.registerWebhook);
router.delete('/repositories/:repositoryName/webhooks/:webhookId', webhookController.deleteWebhook);
router.get('/repositories/:repositoryName/webhooks', webhookController.listWebhooks);

// Webhook event handler route
router.post('/webhook', webhookController.handleWebhookEvent);

// Apply error handling
router.use(errorHandler);

module.exports = router;