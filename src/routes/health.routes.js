const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const repositoryService = require('../services/repository.service');

/**
 * @route GET /healthz
 * @desc Basic health check endpoint for Kubernetes probes
 * @access Public
 */
router.get('/', (req, res) => {
  logger.debug('Health check requested');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'unizo-repo-subscriber'
  });
});

/**
 * @route GET /healthz/readiness
 * @desc Readiness probe for Kubernetes
 * @access Public
 */
router.get('/readiness', (req, res) => {
  logger.debug('Readiness check requested');
  
  // Here we could add more logic to check connections to external services
  // For now we just return OK
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'unizo-repo-subscriber',
    message: 'Service is ready to accept traffic'
  });
});

/**
 * @route GET /healthz/liveness
 * @desc Liveness probe for Kubernetes
 * @access Public
 */
router.get('/liveness', (req, res) => {
  logger.debug('Liveness check requested');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'unizo-repo-subscriber',
    message: 'Service is running correctly'
  });
});

// Basic health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  try {
    // Check GitHub API connectivity
    const startTime = Date.now();
    await repositoryService.listRepositories(1, 1);
    const githubApiLatency = Date.now() - startTime;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        githubApi: {
          status: 'healthy',
          latency: `${githubApiLatency}ms`
        },
        memory: {
          status: 'healthy',
          usage: process.memoryUsage()
        }
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;