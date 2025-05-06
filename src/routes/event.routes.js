const express = require('express');
const { body, param, header, validationResult } = require('express-validator');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const logger = require('../utils/logger');

// Middleware to parse raw body for event signature verification
const rawBodyParser = (req, res, next) => {
  if (req.method === 'POST' && req.headers['x-unizo-signature']) {
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

// Validation middleware
const validateRequest = (req, res, next) => {
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

// Event subscription routes
router.post(
  '/repositories/:repositoryId/subscriptions',
  [
    param('repositoryId')
      .notEmpty()
      .withMessage('Repository ID is required')
      .isString()
      .withMessage('Repository ID must be a string'),
    body('eventTypes')
      .optional()
      .isArray()
      .withMessage('Event types must be an array'),
    validateRequest
  ],
  eventController.registerEventSubscription
);

router.delete(
  '/subscriptions/:subscriptionId',
  [
    param('subscriptionId')
      .notEmpty()
      .withMessage('Subscription ID is required')
      .isString()
      .withMessage('Subscription ID must be a string'),
    validateRequest
  ],
  eventController.deleteEventSubscription
);

router.get(
  '/subscriptions',
  [
    body('repositoryId')
      .optional()
      .isString()
      .withMessage('Repository ID must be a string'),
    validateRequest
  ],
  eventController.listEventSubscriptions
);

// Event handler route
router.post(
  '/events',
  [
    header('x-unizo-signature')
      .notEmpty()
      .withMessage('Event signature is required'),
    header('x-unizo-event')
      .notEmpty()
      .withMessage('Event type is required')
      .isString()
      .withMessage('Event type must be a string'),
    validateRequest
  ],
  eventController.handleEvent
);

// Apply error handling
router.use(errorHandler);

module.exports = router; 