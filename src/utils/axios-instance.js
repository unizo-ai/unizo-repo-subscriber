const axios = require('axios');
const logger = require('./logger');

const axiosInstance = axios.create({
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add request logging
    logger.debug('Making request:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    logger.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    logger.debug('Response received:', {
      status: response.status,
      statusText: response.statusText,
    });
    return response;
  },
  async (error) => {
    if (error.response) {
      logger.error('Response error:', {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      logger.error('Request failed:', error.message);
    } else {
      logger.error('Axios error:', error.message);
    }

    // Implement retry logic for specific status codes
    if (error.config && error.response && [429, 500, 502, 503, 504].includes(error.response.status)) {
      const retryConfig = error.config;
      retryConfig.retryCount = (retryConfig.retryCount || 0) + 1;

      if (retryConfig.retryCount <= 3) {
        const delayMs = Math.pow(2, retryConfig.retryCount) * 1000;
        logger.info(`Retrying request (attempt ${retryConfig.retryCount}) after ${delayMs}ms`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return axiosInstance(retryConfig);
      }
    }

    return Promise.reject(error);
  }
);

module.exports = axiosInstance;