const logger = require('../utils/logger');
const repositoryService = require('../services/repository.service');
const eventService = require('../services/event.service');

class EventController {
  /**
   * Register event subscription for a repository
   */
  async registerEventSubscription(req, res) {
    try {
      const { repositoryId } = req.params;
      const { eventTypes } = req.body;

      // Validate repository exists
      const exists = await repositoryService.repositoryExists(repositoryId);
      if (!exists) {
        logger.warn(`Repository ${repositoryId} not found`);
        return res.status(404).json({
          error: 'Repository not found'
        });
      }

      // Check if subscription already exists
      const existingSubscriptions = await eventService.listEventSubscriptions(repositoryId);
      const subscriptionExists = existingSubscriptions.some(sub => 
        sub.repository_id === repositoryId
      );

      if (subscriptionExists) {
        logger.warn(`Event subscription already exists for repository ${repositoryId}`);
        return res.status(409).json({
          error: 'Event subscription already exists for this repository'
        });
      }

      // Register event subscription
      const subscription = await eventService.registerEventSubscription(
        repositoryId,
        eventTypes || undefined
      );
      
      logger.info(`Event subscription registered successfully for ${repositoryId}`);
      return res.status(201).json(subscription);
    } catch (error) {
      logger.error('Error in registerEventSubscription:', error);
      return res.status(500).json({
        error: 'Failed to register event subscription',
        message: error.message
      });
    }
  }

  /**
   * Delete event subscription
   */
  async deleteEventSubscription(req, res) {
    try {
      const { subscriptionId } = req.params;

      await eventService.deleteEventSubscription(subscriptionId);
      
      logger.info(`Event subscription ${subscriptionId} deleted successfully`);
      return res.status(204).send();
    } catch (error) {
      logger.error('Error in deleteEventSubscription:', error);
      return res.status(500).json({
        error: 'Failed to delete event subscription',
        message: error.message
      });
    }
  }

  /**
   * List event subscriptions
   */
  async listEventSubscriptions(req, res) {
    try {
      const { repositoryId } = req.query;

      const subscriptions = await eventService.listEventSubscriptions(repositoryId);
      
      logger.info('Successfully retrieved event subscriptions');
      return res.status(200).json(subscriptions);
    } catch (error) {
      logger.error('Error in listEventSubscriptions:', error);
      return res.status(500).json({
        error: 'Failed to list event subscriptions',
        message: error.message
      });
    }
  }

  /**
   * Handle incoming events
   */
  async handleEvent(req, res) {
    try {
      const signature = req.headers['x-unizo-signature'];
      const eventType = req.headers['x-unizo-event'];
      const payload = req.body;

      // Verify event signature
      try {
        eventService.verifyEventSignature(JSON.stringify(payload), signature);
      } catch (error) {
        logger.error('Invalid event signature:', error);
        return res.status(401).json({
          error: 'Invalid event signature'
        });
      }

      // Process the event
      await eventService.processEvent(eventType, payload);

      return res.status(200).json({
        message: 'Event processed successfully'
      });
    } catch (error) {
      logger.error('Error in handleEvent:', error);
      return res.status(500).json({
        error: 'Failed to process event',
        message: error.message
      });
    }
  }
}

module.exports = new EventController(); 