// Health Check Utility - Gol de Ouro Player
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const healthCheck = async () => {
  try {
    const response = await fetch(`${baseUrl}/health`);
    const data = await response.json();
    return { 
      status: response.ok ? 'healthy' : 'unhealthy', 
      data,
      statusCode: response.status,
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
    const response = await fetch(`${baseUrl}/readiness`);
    const data = await response.json();
    return { 
      status: response.ok ? 'ready' : 'not_ready', 
      data,
      statusCode: response.status,
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
