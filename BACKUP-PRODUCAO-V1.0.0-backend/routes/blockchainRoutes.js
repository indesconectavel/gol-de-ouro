const express = require('express');
const router = express.Router();

// Middleware de logging
router.use((req, res, next) => {
    console.log(`[Blockchain Route] ${req.method} ${req.originalUrl}`);
    next();
});

// Rota para registrar um evento de jogo na blockchain
router.post('/game', async (req, res) => {
    try {
        const { playerId, gameId, score, timestamp } = req.body;
        if (!playerId || !gameId || score === undefined || !timestamp) {
            return res.status(400).json({ message: 'Dados incompletos para registrar evento de jogo.' });
        }
        
        // Simular registro na blockchain
        const transaction = {
            hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            playerId,
            gameId,
            score,
            timestamp,
            status: 'confirmed',
            blockNumber: Math.floor(Math.random() * 1000000) + 1000000
        };
        
        res.status(200).json({ 
            message: 'Evento de jogo registrado com sucesso na blockchain (simulado).', 
            transaction 
        });
    } catch (error) {
        console.error('Erro ao registrar evento de jogo na blockchain:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor ao registrar evento de jogo.', 
            error: error.message 
        });
    }
});

// Rota para registrar uma transação de pagamento na blockchain
router.post('/payment', async (req, res) => {
    try {
        const { userId, amount, currency, transactionId, timestamp } = req.body;
        if (!userId || !amount || !currency || !transactionId || !timestamp) {
            return res.status(400).json({ message: 'Dados incompletos para registrar transação de pagamento.' });
        }
        
        // Simular registro na blockchain
        const transaction = {
            hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            userId,
            amount,
            currency,
            transactionId,
            timestamp,
            status: 'confirmed',
            blockNumber: Math.floor(Math.random() * 1000000) + 1000000
        };
        
        res.status(200).json({ 
            message: 'Transação de pagamento registrada com sucesso na blockchain (simulado).', 
            transaction 
        });
    } catch (error) {
        console.error('Erro ao registrar transação de pagamento na blockchain:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor ao registrar transação de pagamento.', 
            error: error.message 
        });
    }
});

// Rota para registrar uma atualização de ranking na blockchain
router.post('/ranking', async (req, res) => {
    try {
        const { playerId, newRank, score, timestamp } = req.body;
        if (!playerId || newRank === undefined || score === undefined || !timestamp) {
            return res.status(400).json({ message: 'Dados incompletos para registrar atualização de ranking.' });
        }
        
        // Simular registro na blockchain
        const transaction = {
            hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            playerId,
            newRank,
            score,
            timestamp,
            status: 'confirmed',
            blockNumber: Math.floor(Math.random() * 1000000) + 1000000
        };
        
        res.status(200).json({ 
            message: 'Atualização de ranking registrada com sucesso na blockchain (simulado).', 
            transaction 
        });
    } catch (error) {
        console.error('Erro ao registrar atualização de ranking na blockchain:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor ao registrar atualização de ranking.', 
            error: error.message 
        });
    }
});

// Rota para verificar o status de uma transação na blockchain
router.get('/verify/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        if (!hash) {
            return res.status(400).json({ message: 'Hash da transação é obrigatório.' });
        }
        
        // Simular verificação na blockchain
        const status = {
            hash,
            status: 'confirmed',
            confirmations: Math.floor(Math.random() * 10) + 1,
            blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json({ 
            message: 'Status da transação verificado com sucesso (simulado).', 
            status 
        });
    } catch (error) {
        console.error('Erro ao verificar status da transação na blockchain:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor ao verificar status da transação.', 
            error: error.message 
        });
    }
});

// Rota para obter estatísticas gerais da blockchain
router.get('/stats', async (req, res) => {
    try {
        const stats = {
            totalTransactions: Math.floor(Math.random() * 10000) + 1000,
            totalBlocks: Math.floor(Math.random() * 100000) + 10000,
            averageBlockTime: '2.5s',
            networkHashRate: '150 TH/s',
            activeNodes: Math.floor(Math.random() * 1000) + 100,
            lastUpdate: new Date().toISOString()
        };
        
        res.status(200).json({ 
            message: 'Estatísticas da blockchain obtidas com sucesso (simulado).', 
            stats 
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas da blockchain:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor ao obter estatísticas da blockchain.', 
            error: error.message 
        });
    }
});

// Rota para obter custos estimados de transação
router.get('/costs', async (req, res) => {
    try {
        const costs = {
            gasPrice: '20 Gwei',
            estimatedCost: '0.001 ETH',
            priorityFee: '2 Gwei',
            maxFee: '0.002 ETH',
            currency: 'ETH',
            lastUpdate: new Date().toISOString()
        };
        
        res.status(200).json({ 
            message: 'Custos estimados de transação obtidos com sucesso (simulado).', 
            costs 
        });
    } catch (error) {
        console.error('Erro ao obter custos estimados de transação:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor ao obter custos estimados de transação.', 
            error: error.message 
        });
    }
});

// Rota para verificar o status de conexão com a blockchain
router.get('/status', async (req, res) => {
    try {
        const connectionStatus = {
            connected: true,
            network: 'Polygon Testnet',
            nodeVersion: 'v1.0.0',
            lastBlock: Math.floor(Math.random() * 1000000) + 1000000,
            latency: Math.floor(Math.random() * 100) + 50,
            uptime: '99.9%',
            lastCheck: new Date().toISOString()
        };
        
        res.status(200).json({ 
            message: 'Status de conexão com a blockchain verificado com sucesso (simulado).', 
            status: connectionStatus 
        });
    } catch (error) {
        console.error('Erro ao verificar status de conexão com a blockchain:', error);
        res.status(500).json({ 
            message: 'Erro interno do servidor ao verificar status de conexão com a blockchain.', 
            error: error.message 
        });
    }
});

module.exports = router;