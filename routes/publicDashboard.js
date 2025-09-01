/**
 * Rota pública: /api/public/dashboard
 * Retorna contagens resumidas para o painel inicial.
 */
const express = require('express');
const router = express.Router();

module.exports = (app, pool) => {
  app.get("/api/public/dashboard", async (req, res) => {
    try {
      // Buscar dados das tabelas corretas
      const usersQ = await pool.query("SELECT COUNT(*)::int as count FROM users");
      const gamesQ = await pool.query(`
        SELECT
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE status = 'waiting')::int as waiting,
          COUNT(*) FILTER (WHERE status = 'active')::int as active,
          COUNT(*) FILTER (WHERE status = 'finished')::int as finished
        FROM games
      `);
      const betsQ = await pool.query("SELECT COUNT(*)::int as total FROM bets");
      const queueQ = await pool.query("SELECT COUNT(*)::int as count FROM queue_board");

      res.json({
        ok: true,
        users: usersQ.rows[0]?.count ?? 0,
        games: gamesQ.rows[0] ?? { total: 0, waiting: 0, active: 0, finished: 0 },
        bets: betsQ.rows[0]?.total ?? 0,
        queue: queueQ.rows[0]?.count ?? 0,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.error("dashboard error:", err);
      res.status(500).json({ ok: false, error: "dashboard", detail: String(err.message || err) });
    }
  });
};
