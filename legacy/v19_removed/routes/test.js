/**
 * Rota de teste para produção
 */
const express = require('express');
const router = express.Router();

module.exports = (app, pool) => {
  app.get("/api/test", async (req, res) => {
    try {
      res.json({
        ok: true,
        message: "Teste OK",
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("test error:", err);
      res.status(500).json({ ok: false, error: "test", detail: String(err.message || err) });
    }
  });
  
  app.get("/api/test-db", async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW() as current_time');
      res.json({
        ok: true,
        message: "DB Test OK",
        current_time: result.rows[0].current_time
      });
    } catch (err) {
      console.error("test-db error:", err);
      res.status(500).json({ ok: false, error: "test-db", detail: String(err.message || err) });
    }
  });
};
