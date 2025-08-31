const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Carregar e validar variáveis de ambiente
const env = require('./config/env');

const app = express();

// Configurações para Render
app.set('trust proxy', 1);

// CORS configurado dinamicamente com fallback para desenvolvimento
const corsOrigins = env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean);
const corsOptions = corsOrigins.length
  ? { 
      origin: (origin, cb) => !origin || corsOrigins.includes(origin) ? cb(null, true) : cb(null, false), 
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
    }
  : { 
      origin: true, 
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
    }; // fallback para desenvolvimento

app.use(cors(corsOptions));

// Middlewares de segurança
app.use(helmet());
app.use(rateLimit({ 
  windowMs: 60 * 1000, // 1 minuto
  max: 200 // máximo 200 requests por minuto por IP
}));

// Suporte a JSON
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ===== ROTAS PÚBLICAS (antes de qualquer autenticação) =====

// Rota de teste da API
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Gol de Ouro ativa!',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Rota de health simples (PÚBLICA para Render)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    uptime: process.uptime()
  });
});

// ===== ROTAS PROTEGIDAS =====

// Rota protegida de teste
app.get('/admin/test', (req, res) => {
  const token = req.headers['x-admin-token'];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Token não fornecido',
      message: 'Header x-admin-token é obrigatório'
    });
  }
  
  if (token !== env.ADMIN_TOKEN) {
    return res.status(403).json({ 
      error: 'Token inválido',
      message: 'Acesso negado'
    });
  }
  
  res.json({
    message: '✅ Rota protegida acessada com sucesso',
    timestamp: new Date().toISOString()
  });
});

// Inicialização do servidor
const PORT = Number(process.env.PORT) || Number(env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${env.NODE_ENV}`);
  console.log(`🌐 CORS configurado para: ${corsOrigins.join(', ')}`);
  console.log(`🛡️ Segurança: Helmet + Rate Limit ativos`);
  console.log(`🏥 Healthcheck disponível em: /health`);
  console.log(`🚀 Pronto para produção no Render!`);
});

module.exports = app;


/** ---[ Public Dashboard Endpoint ]-------------------------------------------
 * GET /api/public/dashboard
 * - Traz contadores e �ltimos jogos
 * - Se der erro ou n�o houver tabelas, responde com dados fict�cios (fallback)
 */
if (typeof app !== "undefined") {
  const { Pool } = require("pg");

  app.get("/api/public/dashboard", async (req, res) => {
    // Conecta no Postgres (Supabase/Render) sem depender de conex�es globais do app
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // helpers: consulta escalar com fallback 0 sem explodir a API
    async function scalar(sql) {
      try {
        const { rows } = await pool.query(sql);
        const v = rows?.[0] && Object.values(rows[0])[0];
        return Number(v ?? 0);
      } catch (e) {
        return 0;
      }
    }

    async function getRecentMatches() {
      // tenta tabela "matches"; se n�o existir, devolve fallback
      const sql = `
        select coalesce(
          json_agg(
            json_build_object(
              'id', id,
              'home', home,
              'away', away,
              'kickoff', kickoff,
              'status', status,
              'home_score', home_score,
              'away_score', away_score
            )
            order by kickoff desc
          ), '[]'::json
        ) as items
        from (
          select id, home, away, kickoff, status, home_score, away_score
          from matches
          order by kickoff desc
          limit 5
        ) t;
      `;
      try {
        const { rows } = await pool.query(sql);
        return rows?.[0]?.items ?? [];
      } catch (e) {
        // fallback fict�cio
        const now = new Date();
        const plus = (d) => new Date(now.getTime() + d*24*60*60*1000).toISOString();
        return [
          { id: 1, home: "Caravelas SC", away: "Boreal FC",  kickoff: plus(-2), status: "finished", home_score: 2, away_score: 1 },
          { id: 2, home: "Cerrado AC",   away: "Oceano Azul", kickoff: plus(-1), status: "finished", home_score: 0, away_score: 0 },
          { id: 3, home: "Ra�zes FC",    away: "Laguna FC",   kickoff: plus(+1), status: "scheduled", home_score: null, away_score: null },
          { id: 4, home: "Boreal FC",    away: "Oceano Azul", kickoff: plus(+2), status: "scheduled", home_score: null, away_score: null }
        ];
      }
    }

    try {
      // tenta contadores nas tabelas mais prov�veis (players/users, matches, guesses)
      let players = await scalar("select count(*) from players");
      if (players === 0) {
        // alguns projetos usam 'users' em vez de 'players'
        players = await scalar("select count(*) from users");
      }
      const matches = await scalar("select count(*) from matches");
      const guesses = await scalar("select count(*) from guesses");

      const recent_matches = await getRecentMatches();

      const payload = {
        ok: true,
        players, matches, guesses,
        recent_matches
      };
      res.json(payload);
    } catch (err) {
      console.error("DASHBOARD_ERROR", err);
      // fallback total
      res.json({
        ok: true,
        players: 0,
        matches: 0,
        guesses: 0,
        recent_matches: [
          { id: 1, home: "Caravelas SC", away: "Boreal FC",  kickoff: new Date().toISOString(), status: "scheduled", home_score: null, away_score: null }
        ]
      });
    } finally {
      try { await pool.end(); } catch {}
    }
  });
}
