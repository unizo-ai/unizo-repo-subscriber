const logger = require('../utils/logger');
const axiosInstance = require('../utils/axios-instance');
const config = require('../config');

class WatchService {
  constructor() {
    this.apiUrl = config.UNIZO_API_URL;
    this.authUserId = config.UNIZO_AUTH_USER_ID;
  }

  /**
   * Register a watch for a repository
   */
  async registerWatch(repositoryId, organizationId, webhookUrl, options = {}) {
    try {
      logger.info(`Registering watch for repository: ${repositoryId}`);

      const watchConfig = {
        name: `${repositoryId}-watch`,
        description: `Watch for ${repositoryId} repository`,
        type: 'HOOK',
        resource: {
          type: 'REPOSITORY',
          repository: {
            id: repositoryId
          },
          organization: {
            id: organizationId
          },
          config: {
            url: webhookUrl,
            securedSSLRequired: options.securedSSLRequired || false,
            contentType: 'application/json'
          }
        }
      };

      const response = await axiosInstance.post(
        `${this.apiUrl}/integrations/${config.INTEGRATION_ID}/watches`,
        watchConfig,
        {
          headers: {
            'authuserid': this.authUserId,
            'sourcechannel': 'API',
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Successfully registered watch for ${repositoryId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to register watch for ${repositoryId}:`, error.message);
      throw new Error(`Watch registration failed: ${error.message}`);
    }
  }

  /**
   * Delete a watch
   */
  async deleteWatch(watchId) {
    try {
      logger.info(`Deleting watch: ${watchId}`);

      await axiosInstance.delete(
        `${this.apiUrl}/integrations/${config.INTEGRATION_ID}/watches/${watchId}`,
        {
          headers: {
            'authuserid': this.authUserId,
            'sourcechannel': 'API'
          }
        }
      );

      logger.info(`Successfully deleted watch ${watchId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete watch ${watchId}:`, error.message);
      throw new Error(`Watch deletion failed: ${error.message}`);
    }
  }

  /**
   * List watches
   */
  async listWatches() {
    try {
      logger.info('Listing watches');

      const response = await axiosInstance.get(
        `${this.apiUrl}/integrations/${config.INTEGRATION_ID}/watches`,
        {
          headers: {
            'authuserid': this.authUserId,
            'sourcechannel': 'API'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to list watches:', error.message);
      throw new Error(`Failed to list watches: ${error.message}`);
    }
  }

  /**
   * Update watch configuration
   */
  async updateWatch(watchId, watchConfig) {
    try {
      logger.info(`Updating watch: ${watchId}`);

      const response = await axiosInstance.put(
        `${this.apiUrl}/integrations/${config.INTEGRATION_ID}/watches/${watchId}`,
        watchConfig,
        {
          headers: {
            'authuserid': this.authUserId,
            'sourcechannel': 'API',
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`Successfully updated watch ${watchId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update watch ${watchId}:`, error.message);
      throw new Error(`Watch update failed: ${error.message}`);
    }
  }
}

module.exports = new WatchService();