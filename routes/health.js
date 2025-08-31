const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota de healthcheck para monitoramento
router.get('/', async (req, res) => {
    try {
        // Testar conexão com banco
        const client = await db.connect();
        await client.query('SELECT NOW()');
        client.release();
        
        // Resposta de sucesso
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            database: 'connected'
        });
    } catch (error) {
        // Resposta de erro
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            database: 'disconnected',
            error: error.message
        });
    }
});

// Rota de healthcheck simples (sem teste de banco)
router.get('/ping', (req, res) => {
    res.status(200).json({
        status: 'pong',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
