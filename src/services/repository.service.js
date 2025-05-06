const logger = require('../utils/logger');
const axiosInstance = require('../utils/axios-instance');
const config = require('../config');

class RepositoryService {
  constructor() {
    this.apiUrl = config.UNIZO_API_URL;
    this.apiKey = config.UNIZO_API_KEY;
    this.organization = config.TARGET_ORGANIZATION;
  }

  /**
   * List all repositories in the organization
   */
  async listRepositories(page = 1, perPage = 100) {
    try {
      logger.info(`Fetching repositories for organization: ${this.organization}, page: ${page}`);

      const response = await axiosInstance.get(
        `${this.apiUrl}/organizations/${this.organization}/repositories`,
        {
          params: {
            page,
            limit: perPage,
            sort: 'name',
            order: 'asc'
          },
          headers: {
            'X-API-Key': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );

      return {
        repositories: response.data.items,
        pagination: response.data.pagination
      };
    } catch (error) {
      logger.error(`Failed to fetch repositories for organization ${this.organization}:`, error.message);
      throw new Error(`Repository fetch failed: ${error.message}`);
    }
  }

  /**
   * Get repository details
   */
  async getRepository(repositoryId) {
    try {
      logger.info(`Fetching details for repository: ${repositoryId}`);

      const response = await axiosInstance.get(
        `${this.apiUrl}/repositories/${repositoryId}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch repository ${repositoryId}:`, error.message);
      throw new Error(`Repository fetch failed: ${error.message}`);
    }
  }

  /**
   * Check if repository exists
   */
  async repositoryExists(repositoryId) {
    try {
      await this.getRepository(repositoryId);
      return true;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * List repository branches
   */
  async listBranches(repositoryId) {
    try {
      logger.info(`Fetching branches for repository: ${repositoryId}`);

      const response = await axiosInstance.get(
        `${this.apiUrl}/repositories/${repositoryId}/branches`,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch branches for repository ${repositoryId}:`, error.message);
      throw new Error(`Branch fetch failed: ${error.message}`);
    }
  }

  /**
   * Get repository events
   */
  async listEvents(repositoryId, eventTypes = [], startDate = null, endDate = null) {
    try {
      logger.info(`Fetching events for repository: ${repositoryId}`);

      const params = {
        ...(eventTypes.length > 0 && { types: eventTypes.join(',') }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      };

      const response = await axiosInstance.get(
        `${this.apiUrl}/repositories/${repositoryId}/events`,
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
      logger.error(`Failed to fetch events for repository ${repositoryId}:`, error.message);
      throw new Error(`Event fetch failed: ${error.message}`);
    }
  }
}

module.exports = new RepositoryService();