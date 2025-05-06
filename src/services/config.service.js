const axiosInstance = require('../utils/axios-instance');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Fetches the SCM_WATCH_HOOK configuration for an organization
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Object|null>} The webhook configuration or null if not found
 */
const getOrganizationWebhookConfig = async (organizationId) => {
  try {
    const url = `${config.unizoApiUrl}/organizations/${organizationId}/configurations`;
    
    logger.debug({ organizationId }, 'Fetching organization configurations');
    
    const response = await axiosInstance.get(url, {
      headers: {
        'Accept': 'application/json',
        'apikey': config.unizoApiKey,
        // Optional headers if provided in environment
        ...(process.env.AUTH_USER_ID && { 'authuserid': process.env.AUTH_USER_ID }),
        ...(process.env.CORRELATION_ID && { 'correlationid': process.env.CORRELATION_ID }),
        ...(process.env.SOURCE_CHANNEL && { 'sourcechannel': process.env.SOURCE_CHANNEL }),
      }
    });
    
    // Extract the SCM_WATCH_HOOK configuration
    const configurations = response.data || [];
    const webhookConfig = configurations.find(config => config.type === 'SCM_WATCH_HOOK');
    
    if (webhookConfig) {
      logger.info({ 
        organizationId, 
        webhookConfigFound: true,
        webhookUrl: webhookConfig.data?.url 
      }, 'Found SCM_WATCH_HOOK configuration');
      
      return {
        url: webhookConfig.data?.url,
        ...webhookConfig.data
      };
    }
    
    logger.warn({ organizationId }, 'No SCM_WATCH_HOOK configuration found');
    return null;
  } catch (error) {
    logger.error({ 
      organizationId, 
      error: error.message 
    }, 'Failed to fetch organization webhook configuration');
    
    throw new Error(`Failed to fetch organization webhook configuration: ${error.message}`);
  }
};

module.exports = {
  getOrganizationWebhookConfig
};