// Health Check Utility - Gol de Ouro Player
import apiClient from '../services/apiClient';

export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health');
    const data = await response.data;
    return { 
      status: 'healthy', 
      data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return { 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export const readinessCheck = async () => {
  try {
    const response = await apiClient.get('/readiness');
    const data = await response.data;
    return { 
      status: 'ready', 
      data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Readiness check failed:', error);
    return { 
      status: 'not_ready', 
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export const performHealthChecks = async () => {
  const results = {
    health: await healthCheck(),
    readiness: await readinessCheck(),
    timestamp: new Date().toISOString()
  };
  
  console.log('Health Check Results:', results);
  return results;
};
