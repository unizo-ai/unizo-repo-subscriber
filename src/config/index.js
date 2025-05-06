require('dotenv').config();

const logger = require('../utils/logger');

class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function validateConfig(config) {
  const requiredFields = [
    'PORT',
    'UNIZO_API_URL',
    'UNIZO_API_KEY',
    'UNIZO_AUTH_USER_ID',
    'INTEGRATION_ID',
    'EVENT_SECRET',
    'TARGET_ORGANIZATION'
  ];

  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new ConfigurationError(`Missing required configuration: ${missingFields.join(', ')}`);
  }
}

const config = {
  // Application metadata
  NAME: 'scm-event-listener',
  VERSION: '1.0',
  TYPE: 'application',
  STATE: 'active',

  // Server configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Unizo API configuration
  UNIZO_API_URL: process.env.UNIZO_API_URL || 'https://api.unizo.ai/api/v1',
  UNIZO_API_KEY: process.env.UNIZO_API_KEY,
  UNIZO_AUTH_USER_ID: process.env.UNIZO_AUTH_USER_ID,
  INTEGRATION_ID: process.env.INTEGRATION_ID,
  EVENT_SECRET: process.env.EVENT_SECRET,
  TARGET_ORGANIZATION: process.env.TARGET_ORGANIZATION,

  // Event configuration
  EVENT_SELECTORS: [
    'repository:created',
    'repository:renamed',
    'repository:deleted',
    'repository:archived',
    'branch:created',
    'commit:pushed'
  ],

  // Application configuration
  EVENT_PATH: process.env.EVENT_PATH || '/events',
  HEALTH_CHECK_PATH: process.env.HEALTH_CHECK_PATH || '/health',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

  // Timeouts
  REQUEST_TIMEOUT_MS: parseInt(process.env.REQUEST_TIMEOUT_MS, 10) || 5000,
  EVENT_TIMEOUT_MS: parseInt(process.env.EVENT_TIMEOUT_MS, 10) || 10000,

  // Retry configuration
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES, 10) || 3,
  RETRY_DELAY_MS: parseInt(process.env.RETRY_DELAY_MS, 10) || 1000,

  // Logging configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'json',
};

try {
  validateConfig(config);
  
  // Log configuration (excluding sensitive values)
  const sanitizedConfig = { ...config };
  ['UNIZO_API_KEY', 'EVENT_SECRET', 'UNIZO_AUTH_USER_ID'].forEach(key => {
    if (sanitizedConfig[key]) {
      sanitizedConfig[key] = '***MASKED***';
    }
  });
  
  logger.info('Application configuration loaded:', sanitizedConfig);
} catch (error) {
  logger.error('Configuration validation failed:', error);
  process.exit(1);
}

module.exports = config;