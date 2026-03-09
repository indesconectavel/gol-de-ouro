/**
 * Controller read-only para endpoints admin de saques (ex.: saques presos em PROCESSING).
 * Não altera lógica de saque/worker; apenas leitura.
 */
const { supabaseAdmin } = require('../database/supabase-unified-config');
const { PROCESSING } = require('../src/domain/payout/withdrawalStatus');

const THRESHOLD_MINUTES = 10;
const LIMIT = 50;

/**
 * GET /api/admin/saques-presos - Lista saques com status PROCESSING e created_at há mais de 10 min.
 * Requer x-admin-token. Resposta: { success, meta: { threshold_minutes, now, total, buckets }, data: [] }.
 */
async function saquesPresos(req, res) {
  try {
    if (!supabaseAdmin) {
      return res.status(503).json({ success: false, error: 'Supabase indisponível' });
    }
    const now = new Date();
    const sinceIso = new Date(now.getTime() - THRESHOLD_MINUTES * 60 * 1000).toISOString();
    const { data: rows, error: listError } = await supabaseAdmin
      .from('saques')
      .select('id, usuario_id, amount, valor, fee, net_amount, correlation_id, transacao_id, created_at')
      .eq('status', PROCESSING)
      .lt('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .limit(LIMIT);

    if (listError) {
      console.error('❌ [ADMIN-SAQUES-PRESOS] Erro na query:', listError.message);
      return res.status(500).json({ success: false, error: 'Erro ao listar saques' });
    }

    const list = Array.isArray(rows) ? rows : [];
    const buckets = { '10_30': 0, '30_60': 0, '60_plus': 0 };
    const data = list.map((row) => {
      const created = row.created_at ? new Date(row.created_at) : null;
      const ageMinutes = created ? Math.floor((now.getTime() - created.getTime()) / 60000) : 0;
      if (ageMinutes >= 10 && ageMinutes < 30) buckets['10_30']++;
      else if (ageMinutes >= 30 && ageMinutes < 60) buckets['30_60']++;
      else if (ageMinutes >= 60) buckets['60_plus']++;
      return {
        id: row.id,
        usuario_id: row.usuario_id,
        amount: row.amount != null ? Number(row.amount) : null,
        valor: row.valor != null ? Number(row.valor) : null,
        fee: row.fee != null ? Number(row.fee) : null,
        net_amount: row.net_amount != null ? Number(row.net_amount) : null,
        correlation_id: row.correlation_id ?? null,
        transacao_id: row.transacao_id ?? null,
        created_at: row.created_at ?? null,
        age_minutes: ageMinutes
      };
    });

    return res.json({
      success: true,
      meta: {
        threshold_minutes: THRESHOLD_MINUTES,
        now: now.toISOString(),
        total: data.length,
        buckets
      },
      data
    });
  } catch (err) {
    console.error('❌ [ADMIN-SAQUES-PRESOS] Erro:', err?.message);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

module.exports = { saquesPresos };
