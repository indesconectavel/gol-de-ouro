// Health Routes - Gol de Ouro V19
// Módulo: health
const express = require('express');
const router = express.Router();
const { supabase } = require('../../../../database/supabase-unified-config');

// Health check básico
router.get('/', async (req, res) => {
  try {
    res.status(200).json({
      status: 'ok',
      service: 'Gol de Ouro Backend',
      version: '1.2.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Health check do banco de dados
router.get('/database', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Testar conexão com o banco
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
        responseTime: `${responseTime}ms`
      });
    }
    
    res.json({
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database health check failed',
      error: error.message
    });
  }
});

module.exports = router;

