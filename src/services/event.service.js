const crypto = require('crypto');
const logger = require('../utils/logger');
const axiosInstance = require('../utils/axios-instance');
const config = require('../config');

class EventService {
  constructor() {
    this.apiUrl = config.UNIZO_API_URL;
    this.apiKey = config.UNIZO_API_KEY;
    this.eventSecret = config.EVENT_SECRET;
  }

  /**
   * Verify event signature from Unizo API
   */
  verifyEventSignature(payload, signature) {
    if (!signature) {
      throw new Error('No signature provided');
    }

    const sig = Buffer.from(signature);
    const hmac = crypto.createHmac('sha256', this.eventSecret);
    const digest = Buffer.from('sha256=' + hmac.update(payload).digest('hex'));

    if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
      throw new Error('Invalid signature');
    }

    return true;
  }

  /**
   * Register event subscription for a repository
   */
  async registerEventSubscription(repositoryId, eventTypes = config.EVENT_SELECTORS) {
    try {
      logger.info(`Registering event subscription for repository: ${repositoryId}`);

      const subscriptionConfig = {
        repository_id: repositoryId,
        event_types: eventTypes,
        callback_url: `${process.env.APP_URL}${config.EVENT_PATH}`,
        secret: this.eventSecret,
        active: true
      };

      const response = await axiosInstance.post(
        `${this.apiUrl}/event-subscriptions`,
        subscriptionConfig,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );

      logger.info(`Successfully registered event subscription for ${repositoryId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to register event subscription for ${repositoryId}:`, error.message);
      throw new Error(`Event subscription registration failed: ${error.message}`);
    }
  }

  /**
   * Delete event subscription
   */
  async deleteEventSubscription(subscriptionId) {
    try {
      logger.info(`Deleting event subscription: ${subscriptionId}`);

      await axiosInstance.delete(
        `${this.apiUrl}/event-subscriptions/${subscriptionId}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );

      logger.info(`Successfully deleted event subscription ${subscriptionId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete event subscription ${subscriptionId}:`, error.message);
      throw new Error(`Event subscription deletion failed: ${error.message}`);
    }
  }

  /**
   * List event subscriptions
   */
  async listEventSubscriptions(repositoryId = null) {
    try {
      logger.info('Listing event subscriptions');

      const params = repositoryId ? { repository_id: repositoryId } : {};

      const response = await axiosInstance.get(
        `${this.apiUrl}/event-subscriptions`,
        {
          params,
          headers: {
            'X-API-Key': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to list event subscriptions:', error.message);
      throw new Error(`Failed to list event subscriptions: ${error.message}`);
    }
  }

  /**
   * Update event subscription
   */
  async updateEventSubscription(subscriptionId, subscriptionConfig) {
    try {
      logger.info(`Updating event subscription: ${subscriptionId}`);

      const response = await axiosInstance.patch(
        `${this.apiUrl}/event-subscriptions/${subscriptionId}`,
        subscriptionConfig,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );

      logger.info(`Successfully updated event subscription ${subscriptionId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update event subscription ${subscriptionId}:`, error.message);
      throw new Error(`Event subscription update failed: ${error.message}`);
    }
  }

  /**
   * Process event payload
   */
  async processEvent(eventType, payload) {
    try {
      logger.info(`Processing ${eventType} event for repository ${payload.repository?.id}`);

      // Handle different event types
      switch (eventType) {
        case 'repository:created':
          await this.handleRepositoryCreated(payload);
          break;

        case 'repository:renamed':
          await this.handleRepositoryRenamed(payload);
          break;

        case 'repository:deleted':
          await this.handleRepositoryDeleted(payload);
          break;

        case 'repository:archived':
          await this.handleRepositoryArchived(payload);
          break;

        case 'branch:created':
          await this.handleBranchCreated(payload);
          break;

        case 'commit:pushed':
          await this.handleCommitPushed(payload);
          break;

        default:
          logger.warn(`Unhandled event type: ${eventType}`);
      }

      return true;
    } catch (error) {
      logger.error(`Failed to process ${eventType} event:`, error.message);
      throw error;
    }
  }

  // Event handlers
  async handleRepositoryCreated(payload) {
    logger.info(`New repository created: ${payload.repository.name}`);
    // Implement repository creation handling logic
  }

  async handleRepositoryRenamed(payload) {
    logger.info(`Repository renamed from ${payload.old_name} to ${payload.new_name}`);
    // Implement repository rename handling logic
  }

  async handleRepositoryDeleted(payload) {
    logger.info(`Repository deleted: ${payload.repository.name}`);
    // Implement repository deletion handling logic
  }

  async handleRepositoryArchived(payload) {
    logger.info(`Repository archived: ${payload.repository.name}`);
    // Implement repository archival handling logic
  }

  async handleBranchCreated(payload) {
    logger.info(`New branch created: ${payload.branch.name} in ${payload.repository.name}`);
    // Implement branch creation handling logic
  }

  async handleCommitPushed(payload) {
    logger.info(`New commit pushed to ${payload.repository.name}`);
    // Implement commit push handling logic
  }
}

module.exports = new EventService(); 