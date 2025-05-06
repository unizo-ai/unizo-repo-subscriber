const logger = require('../utils/logger');
const repositoryService = require('../services/repository.service');
const configService = require('../services/config.service');
const webhookService = require('../services/webhook.service');

/**
 * Register webhooks for all repositories in an organization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const registerRepositoryWebhooks = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const integrationId = req.headers.integrationid;
    
    logger.info({ organizationId, integrationId }, 'Starting webhook registration process');
    
    // Step 1: Fetch organization webhook config
    const webhookConfig = await configService.getOrganizationWebhookConfig(organizationId);
    
    if (!webhookConfig) {
      logger.warn({ organizationId }, 'No SCM_WATCH_HOOK configuration found for this organization');
      return res.status(404).json({
        error: 'No SCM_WATCH_HOOK configuration found for this organization'
      });
    }
    
    logger.info({ organizationId, webhookUrl: webhookConfig.url }, 'Found webhook configuration');
    
    // Step 2: Process repositories in pages
    let hasMorePages = true;
    let nextPage = null;
    let totalRepositories = 0;
    let registeredWebhooks = 0;
    let failedWebhooks = 0;
    
    while (hasMorePages) {
      // Fetch repositories for the current page
      const { repositories, pagination } = await repositoryService.getRepositories(
        organizationId, 
        integrationId, 
        nextPage
      );
      
      logger.info({ 
        organizationId, 
        page: nextPage,
        repositoryCount: repositories.length,
        hasMorePages: !!pagination.next
      }, 'Retrieved repositories page');
      
      // Process repositories in this page
      for (const repository of repositories) {
        totalRepositories++;
        
        try {
          // Register webhook for this repository
          await webhookService.registerWebhook(
            integrationId,
            organizationId,
            repository,
            webhookConfig
          );
          
          registeredWebhooks++;
          logger.info({ 
            organizationId, 
            repositoryId: repository.id, 
            repositoryName: repository.fullName 
          }, 'Successfully registered webhook');
        } catch (error) {
          failedWebhooks++;
          logger.error({ 
            organizationId, 
            repositoryId: repository.id, 
            repositoryName: repository.fullName,
            error: error.message 
          }, 'Failed to register webhook');
        }
      }
      
      // Check if there are more pages to process
      hasMorePages = !!pagination.next;
      nextPage = pagination.next;
    }
    
    // Return response with summary
    return res.status(200).json({
      message: 'Webhook registration process completed',
      summary: {
        organizationId,
        totalRepositories,
        registeredWebhooks,
        failedWebhooks
      }
    });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Error in webhook registration process');
    next(error);
  }
};

class WebhookController {
  /**
   * Register webhook for a repository
   */
  async registerWebhook(req, res) {
    try {
      const { repositoryName } = req.params;

      // Validate repository exists
      const exists = await repositoryService.repositoryExists(repositoryName);
      if (!exists) {
        logger.warn(`Repository ${repositoryName} not found`);
        return res.status(404).json({
          error: 'Repository not found'
        });
      }

      // Check if webhook already exists
      const existingWebhooks = await webhookService.listWebhooks(repositoryName);
      const webhookExists = existingWebhooks.some(hook => 
        hook.config.url === `${process.env.APP_URL}/webhook`
      );

      if (webhookExists) {
        logger.warn(`Webhook already exists for repository ${repositoryName}`);
        return res.status(409).json({
          error: 'Webhook already exists for this repository'
        });
      }

      // Register webhook
      const webhook = await webhookService.registerWebhook(repositoryName);
      
      logger.info(`Webhook registered successfully for ${repositoryName}`);
      return res.status(201).json(webhook);
    } catch (error) {
      logger.error('Error in registerWebhook:', error);
      return res.status(500).json({
        error: 'Failed to register webhook',
        message: error.message
      });
    }
  }

  /**
   * Delete webhook from a repository
   */
  async deleteWebhook(req, res) {
    try {
      const { repositoryName, webhookId } = req.params;

      // Validate repository exists
      const exists = await repositoryService.repositoryExists(repositoryName);
      if (!exists) {
        logger.warn(`Repository ${repositoryName} not found`);
        return res.status(404).json({
          error: 'Repository not found'
        });
      }

      await webhookService.deleteWebhook(repositoryName, webhookId);
      
      logger.info(`Webhook ${webhookId} deleted successfully from ${repositoryName}`);
      return res.status(204).send();
    } catch (error) {
      logger.error('Error in deleteWebhook:', error);
      return res.status(500).json({
        error: 'Failed to delete webhook',
        message: error.message
      });
    }
  }

  /**
   * List webhooks for a repository
   */
  async listWebhooks(req, res) {
    try {
      const { repositoryName } = req.params;

      // Validate repository exists
      const exists = await repositoryService.repositoryExists(repositoryName);
      if (!exists) {
        logger.warn(`Repository ${repositoryName} not found`);
        return res.status(404).json({
          error: 'Repository not found'
        });
      }

      const webhooks = await webhookService.listWebhooks(repositoryName);
      
      logger.info(`Successfully retrieved webhooks for ${repositoryName}`);
      return res.status(200).json(webhooks);
    } catch (error) {
      logger.error('Error in listWebhooks:', error);
      return res.status(500).json({
        error: 'Failed to list webhooks',
        message: error.message
      });
    }
  }

  /**
   * Handle incoming webhook events
   */
  async handleWebhookEvent(req, res) {
    try {
      const signature = req.headers['x-hub-signature-256'];
      const event = req.headers['x-github-event'];
      const payload = req.body;

      // Verify webhook signature
      try {
        webhookService.verifyWebhookSignature(JSON.stringify(payload), signature);
      } catch (error) {
        logger.error('Invalid webhook signature:', error);
        return res.status(401).json({
          error: 'Invalid webhook signature'
        });
      }

      // Log the event
      logger.info(`Received ${event} event from ${payload.repository?.full_name}`);

      // Process different event types
      switch (event) {
        case 'push':
          // Handle push event
          logger.info(`Push to ${payload.ref} by ${payload.pusher.name}`);
          break;

        case 'pull_request':
          // Handle pull request event
          logger.info(`Pull request ${payload.action}: ${payload.pull_request.title}`);
          break;

        default:
          logger.info(`Unhandled event type: ${event}`);
      }

      return res.status(200).json({
        message: 'Webhook received successfully'
      });
    } catch (error) {
      logger.error('Error in handleWebhookEvent:', error);
      return res.status(500).json({
        error: 'Failed to process webhook',
        message: error.message
      });
    }
  }
}

module.exports = {
  registerRepositoryWebhooks,
  registerWebhook,
  deleteWebhook,
  listWebhooks,
  handleWebhookEvent
};