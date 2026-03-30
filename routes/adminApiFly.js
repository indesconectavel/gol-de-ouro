'use strict';

/**
 * API administrativa montada em server-fly.js sob /api/admin/*
 * Autenticação: header x-admin-token === process.env.ADMIN_TOKEN (mín. 16 caracteres)
 * Resposta padrão: { success: boolean, data?: any, message?: string }
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { normalizeSaqueRead, normalizePagamentoPixRead } = require('../utils/financialNormalization');

const SETTINGS_DIR = path.join(__dirname, '..', 'data');
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'admin-panel-settings.json');

const DEFAULT_SETTINGS = {
  taxaPlataforma: 5.0,
  limiteSaqueMinimo: 10.0,
  limiteSaqueMaximo: 1000.0,
  tempoPartida: 30,
  maxJogadores: 2,
  notificacoesEmail: true,
  notificacoesPush: true,
  manutencao: false,
  versao: '1.2.0'
};

let backupEntries = [];

function authAdminToken(req, res, next) {
  const token = req.headers['x-admin-token'];
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || String(expected).length < 16) {
    return res.status(503).json({
      success: false,
      message: 'ADMIN_TOKEN não configurado no servidor (mínimo 16 caracteres).'
    });
  }
  if (!token || token !== expected) {
    return res.status(401).json({
      success: false,
      message: 'Token administrador inválido ou ausente (x-admin-token).'
    });
  }
  next();
}

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('[ADMIN-API] Falha ao ler settings:', e.message);
  }
  return { ...DEFAULT_SETTINGS };
}

function writeSettings(obj) {
  if (!fs.existsSync(SETTINGS_DIR)) {
    fs.mkdirSync(SETTINGS_DIR, { recursive: true });
  }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeekIso() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function mapUsuarioLista(u) {
  return {
    id: u.id,
    name: u.username || u.email || '—',
    email: u.email || '',
    balance: Number(u.saldo) || 0,
    account_status: u.ativo === false ? 'blocked' : 'active',
    created_at: u.created_at
  };
}

function mapUsuarioBloqueado(u) {
  return {
    id: u.id,
    name: u.username || u.email || '—',
    email: u.email || '',
    blocked_at: u.updated_at || u.created_at
  };
}

function mapSaqueRow(s, userLabel) {
  const n = normalizeSaqueRead(s);
  const st = String(n.status || '').toLowerCase();
  let status = 'pendente';
  if (st.includes('aprov') || st === 'paid' || st === 'completed' || st === 'conclu') status = 'aprovado';
  if (st.includes('rejeit') || st.includes('fail') || st === 'cancel') status = 'rejeitado';
  return {
    id: n.id,
    user_id: userLabel || String(n.usuario_id),
    amount: Number(n.amount ?? n.valor ?? 0),
    status,
    created_at: n.created_at
  };
}

/**
 * Snapshot de lotes ativos em memória (Map `lotesAtivos` no processo Node).
 * GET /api/admin/fila e GET /api/admin/lotes devolvem o mesmo JSON (compat.: nome “fila” histórico).
 * Campo totalNaFila === lotesAtivosCount (não é fila ordenada de jogadores).
 */
function buildAdminLotesSnapshotPayload(getQueueSnapshot) {
  const q = getQueueSnapshot ? getQueueSnapshot() : {};
  return {
    posicao: null,
    status: 'snapshot',
    jaChutou: null,
    marcouGol: null,
    totalNaFila: q.lotesAtivosCount != null ? q.lotesAtivosCount : 0,
    tempoEstimado: null,
    contadorChutesGlobal: q.contadorChutesGlobal != null ? q.contadorChutesGlobal : null,
    observacao:
      'Snapshot deste processo: lotes ativos em memória (Map lotesAtivos) e contador global de chutes. Não há fila por jogador neste endpoint.',
  };
}

function createAdminRouter(deps) {
  const { getSupabase, isDbConnected, getQueueSnapshot } = deps;
  const router = express.Router();
  router.use(authAdminToken);

  router.get('/stats', async (req, res) => {
    try {
      const supabase = getSupabase();
      if (!isDbConnected() || !supabase) {
        return res.status(503).json({ success: false, message: 'Banco indisponível' });
      }

      const { count: totalUsers } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
      const { count: activeUsers } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);
      const { count: blockedUsers } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', false);
      const { count: totalChutes } = await supabase.from('chutes').select('*', { count: 'exact', head: true });
      const { data: goalsRows } = await supabase.from('chutes').select('id').eq('resultado', 'goal');
      const totalGoals = goalsRows ? goalsRows.length : 0;

      const { data: pixApproved } = await supabase
        .from('pagamentos_pix')
        .select('amount, valor, created_at')
        .eq('status', 'approved');
      let totalRevenue = 0;
      let receitaHoje = 0;
      const t0 = startOfTodayIso();
      for (const p of pixApproved || []) {
        const n = normalizePagamentoPixRead(p);
        const v = Number(n.amount ?? n.valor ?? 0);
        totalRevenue += v;
        if (n.created_at && n.created_at >= t0) receitaHoje += v;
      }

      const { data: saquesRows } = await supabase.from('saques').select('amount, valor, created_at');
      let totalWithdrawals = 0;
      for (const s of saquesRows || []) {
        const n = normalizeSaqueRead(s);
        totalWithdrawals += Number(n.amount ?? n.valor ?? 0);
      }

      const { count: chutesHoje } = await supabase
        .from('chutes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', t0);

      const { data: topChutes } = await supabase
        .from('chutes')
        .select('usuario_id')
        .limit(5000);
      const byUser = {};
      for (const c of topChutes || []) {
        byUser[c.usuario_id] = (byUser[c.usuario_id] || 0) + 1;
      }
      const topIds = Object.entries(byUser)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([uid]) => uid);
      let topJogadores = [];
      if (topIds.length) {
        const { data: usersTop } = await supabase.from('usuarios').select('id, username, email').in('id', topIds);
        const nameById = {};
        for (const u of usersTop || []) nameById[u.id] = u.username || u.email;
        topJogadores = topIds.map((id) => ({
          id,
          nome: nameById[id] || String(id),
          partidas: byUser[id]
        }));
      }

      const q = getQueueSnapshot ? getQueueSnapshot() : {};
      const totalTransactions = (pixApproved?.length || 0) + (saquesRows?.length || 0);

      const data = {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalGames: totalChutes || 0,
        totalTransactions,
        totalRevenue,
        totalWithdrawals,
        netBalance: totalRevenue - totalWithdrawals,
        // Nome legado no JSON: queueLength === lotesAtivosCount (mesmo significado que totalNaFila no snapshot /fila).
        queueLength: q.lotesAtivosCount != null ? q.lotesAtivosCount : 0,
        contadorChutesGlobal: q.contadorChutesGlobal != null ? q.contadorChutesGlobal : null,
        dashboardCards: {
          users: totalUsers || 0,
          games: { total: totalChutes || 0, waiting: 0, active: q.lotesAtivosCount || 0, finished: 0, today: chutesHoje || 0 },
          bets: totalChutes || 0,
          queue: q.lotesAtivosCount || 0,
          revenue: totalRevenue,
          profit: totalRevenue - totalWithdrawals,
          averageBet: totalChutes ? totalRevenue / totalChutes : 0,
          successRate: totalChutes ? (totalGoals / totalChutes) * 100 : 0,
          topPlayers: topJogadores.map((t) => ({ name: t.nome, games: t.partidas }))
        },
        estatisticas: {
          totalUsuarios: totalUsers || 0,
          totalJogos: totalChutes || 0,
          totalReceita: `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`,
          totalLucro: `R$ ${(totalRevenue - totalWithdrawals).toFixed(2).replace('.', ',')}`,
          usuariosAtivos: activeUsers || 0,
          jogosHoje: chutesHoje || 0,
          receitaHoje: `R$ ${receitaHoje.toFixed(2).replace('.', ',')}`,
          topJogadores: topJogadores.map((t, i) => ({
            posicao: i + 1,
            nome: t.nome,
            pontuacao: t.partidas
          }))
        },
        estatisticasGerais: {
          totalUsuarios: totalUsers || 0,
          usuariosAtivos: activeUsers || 0,
          usuariosBloqueados: blockedUsers || 0,
          totalPartidas: totalChutes || 0,
          mediaGolsPorPartida: totalChutes ? totalGoals / totalChutes : 0
        }
      };

      return res.json({ success: true, data });
    } catch (err) {
      console.error('[ADMIN-API] /stats', err);
      return res.status(500).json({ success: false, message: err.message || 'Erro ao montar estatísticas' });
    }
  });

  router.get('/usuarios', async (req, res) => {
    try {
      const supabase = getSupabase();
      if (!isDbConnected() || !supabase) {
        return res.status(503).json({ success: false, message: 'Banco indisponível' });
      }
      let q = supabase
        .from('usuarios')
        .select('id, username, email, saldo, ativo, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (req.query.ativo === 'false') q = q.eq('ativo', false);
      const { data, error } = await q;
      if (error) return res.status(500).json({ success: false, message: error.message });
      const list = (data || []).map(mapUsuarioLista);
      return res.json({ success: true, data: list });
    } catch (err) {
      console.error('[ADMIN-API] /usuarios', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/usuarios-bloqueados', async (req, res) => {
    try {
      const supabase = getSupabase();
      if (!isDbConnected() || !supabase) {
        return res.status(503).json({ success: false, message: 'Banco indisponível' });
      }
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, username, email, saldo, ativo, created_at, updated_at')
        .eq('ativo', false)
        .order('updated_at', { ascending: false })
        .limit(200);
      if (error) return res.status(500).json({ success: false, message: error.message });
      return res.json({ success: true, data: (data || []).map(mapUsuarioBloqueado) });
    } catch (err) {
      console.error('[ADMIN-API] /usuarios-bloqueados', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post('/usuarios/:id/reativar', async (req, res) => {
    try {
      const supabase = getSupabase();
      if (!isDbConnected() || !supabase) {
        return res.status(503).json({ success: false, message: 'Banco indisponível' });
      }
      const id = req.params.id;
      const { error } = await supabase.from('usuarios').update({ ativo: true, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) return res.status(500).json({ success: false, message: error.message });
      return res.json({ success: true, data: { id, ativo: true } });
    } catch (err) {
      console.error('[ADMIN-API] reativar', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/usuarios/:id', async (req, res) => {
    try {
      const supabase = getSupabase();
      if (!isDbConnected() || !supabase) {
        return res.status(503).json({ success: false, message: 'Banco indisponível' });
      }
      const id = req.params.id;
      const { data: user, error: uErr } = await supabase
        .from('usuarios')
        .select('id, username, email, saldo, ativo, created_at, updated_at, tipo')
        .eq('id', id)
        .single();
      if (uErr || !user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

      const { data: chutes } = await supabase.from('chutes').select('resultado, valor_aposta, premio, created_at').eq('usuario_id', id);
      let totalChutes = 0;
      let totalGols = 0;
      let totalApostado = 0;
      let totalPremios = 0;
      for (const c of chutes || []) {
        totalChutes++;
        if (c.resultado === 'goal') totalGols++;
        totalApostado += Number(c.valor_aposta) || 0;
        totalPremios += Number(c.premio) || 0;
      }

      const { data: pix } = await supabase.from('pagamentos_pix').select('amount, valor, status').eq('usuario_id', id).eq('status', 'approved');
      let totalCreditos = 0;
      for (const p of pix || []) {
        const n = normalizePagamentoPixRead(p);
        totalCreditos += Number(n.amount ?? n.valor ?? 0);
      }

      const { data: saques } = await supabase.from('saques').select('amount, valor').eq('usuario_id', id);
      let totalDebitos = 0;
      for (const s of saques || []) {
        const n = normalizeSaqueRead(s);
        totalDebitos += Number(n.amount ?? n.valor ?? 0);
      }

      const data = {
        id: user.id,
        name: user.username || user.email,
        email: user.email,
        account_status: user.ativo === false ? 'blocked' : 'active',
        created_at: user.created_at,
        totalChutes,
        totalGols,
        saldo: Number(user.saldo) || 0,
        totalCreditos,
        totalDebitos,
        ultimoLogin: user.updated_at,
        partidasJogadas: totalChutes,
        partidasVencidas: totalGols,
        eficiencia: totalChutes ? (totalGols / totalChutes) * 100 : 0
      };
      return res.json({ success: true, data });
    } catch (err) {
      console.error('[ADMIN-API] /usuarios/:id', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  async function buildRelatorioUsuariosRows(supabase) {
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('id, username, email, saldo, ativo')
      .limit(300);
    if (error) throw error;
    const { data: chutes } = await supabase.from('chutes').select('usuario_id, resultado, valor_aposta, premio');
    const byUser = {};
    for (const c of chutes || []) {
      if (!byUser[c.usuario_id]) {
        byUser[c.usuario_id] = { totalChutes: 0, totalGols: 0, totalCreditos: 0, totalDebitos: 0 };
      }
      byUser[c.usuario_id].totalChutes++;
      if (c.resultado === 'goal') byUser[c.usuario_id].totalGols++;
      byUser[c.usuario_id].totalDebitos += Number(c.valor_aposta) || 0;
      byUser[c.usuario_id].totalCreditos += Number(c.premio) || 0;
    }
    const { data: pixAll } = await supabase.from('pagamentos_pix').select('usuario_id, amount, valor, status').eq('status', 'approved');
    for (const p of pixAll || []) {
      const n = normalizePagamentoPixRead(p);
      const uid = p.usuario_id;
      if (!byUser[uid]) byUser[uid] = { totalChutes: 0, totalGols: 0, totalCreditos: 0, totalDebitos: 0 };
      byUser[uid].totalCreditos += Number(n.amount ?? n.valor ?? 0);
    }
    const { data: saquesAll } = await supabase.from('saques').select('usuario_id, amount, valor');
    for (const s of saquesAll || []) {
      const n = normalizeSaqueRead(s);
      const uid = n.usuario_id;
      if (!byUser[uid]) byUser[uid] = { totalChutes: 0, totalGols: 0, totalCreditos: 0, totalDebitos: 0 };
      byUser[uid].totalDebitos += Number(n.amount ?? n.valor ?? 0);
    }
    return (users || []).map((u) => {
      const agg = byUser[u.id] || { totalChutes: 0, totalGols: 0, totalCreditos: 0, totalDebitos: 0 };
      return {
        id: u.id,
        name: u.username || u.email,
        email: u.email,
        totalChutes: agg.totalChutes,
        totalGols: agg.totalGols,
        totalCreditos: agg.totalCreditos,
        totalDebitos: agg.totalDebitos,
        saldo: Number(u.saldo) || 0
      };
    });
  }

  router.get('/relatorios/usuarios', async (req, res) => {
    try {
      const supabase = getSupabase();
      if (!isDbConnected() || !supabase) {
        return res.status(503).json({ success: false, message: 'Banco indisponível' });
      }
      const rows = await buildRelatorioUsuariosRows(supabase);
      return res.json({ success: true, data: rows });
    } catch (err) {
      console.error('[ADMIN-API] /relatorios/usuarios', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/relatorios/financeiro', async (req, res) => {
    try {
      const supabase = getSupabase();
      if (!isDbConnected() || !supabase) {
        return res.status(503).json({ success: false, message: 'Banco indisponível' });
      }
      const { data: pix } = await supabase.from('pagamentos_pix').select('amount, valor, created_at, status').eq('status', 'approved');
      let receitaTotal = 0;
      let receitaHoje = 0;
      let receitaSemana = 0;
      let receitaMes = 0;
      const t0 = startOfTodayIso();
      const w0 = startOfWeekIso();
      const m0 = new Date();
      m0.setDate(1);
      m0.setHours(0, 0, 0, 0);
      const m0iso = m0.toISOString();
      const transacoes = [];
      let tid = 1;
      for (const p of pix || []) {
        const n = normalizePagamentoPixRead(p);
        const v = Number(n.amount ?? n.valor ?? 0);
        receitaTotal += v;
        const ca = n.created_at;
        if (ca >= t0) receitaHoje += v;
        if (ca >= w0) receitaSemana += v;
        if (ca >= m0iso) receitaMes += v;
        if (transacoes.length < 30) {
          transacoes.push({
            id: tid++,
            tipo: 'Entrada',
            valor: v,
            data: (ca || '').slice(0, 10),
            status: 'Concluída'
          });
        }
      }
      const { data: saques } = await supabase.from('saques').select('amount, valor, created_at, status');
      let despesasTotal = 0;
      for (const s of saques || []) {
        const n = normalizeSaqueRead(s);
        const v = Number(n.amount ?? n.valor ?? 0);
        despesasTotal += v;
        const ca = n.created_at;
        if (transacoes.length < 40) {
          const st = String(n.status || '').toLowerCase();
          transacoes.push({
            id: tid++,
            tipo: 'Saída',
            valor: v,
            data: (ca || '').slice(0, 10),
            status: st.includes('pend') ? 'Pendente' : 'Concluída'
          });
        }
      }
      const data = {
        receitaTotal,
        despesasTotal,
        lucroTotal: receitaTotal - despesasTotal,
        receitaHoje,
        receitaSemana,
        receitaMes,
        transacoes
      };
      return res.json({ success: true, data });
    } catch (err) {
      console.error('[ADMIN-API] /relatorios/financeiro', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/relatorios/geral', async (req, res) => {
    try {
      const supabase = getSupabase();
      if (!isDbConnected() || !supabase) {
        return res.status(503).json({ success: false, message: 'Banco indisponível' });
      }
      const { count: totalUsuarios } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
      const { count: usuariosAtivos } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);
      const { count: usuariosBloqueados } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', false);
      const { count: totalChutes } = await supabase.from('chutes').select('*', { count: 'exact', head: true });
      const { data: goalsRows } = await supabase.from('chutes').select('id').eq('resultado', 'goal');
      const totalGols = goalsRows ? goalsRows.length : 0;
      const { count: totalTransacoes } = await supabase.from('pagamentos_pix').select('*', { count: 'exact', head: true });
      const { count: totalSaques } = await supabase.from('saques').select('*', { count: 'exact', head: true });
      const { data: pix } = await supabase.from('pagamentos_pix').select('amount, valor').eq('status', 'approved');
      let receitaTotal = 0;
      for (const p of pix || []) {
        const n = normalizePagamentoPixRead(p);
        receitaTotal += Number(n.amount ?? n.valor ?? 0);
      }
      const { data: saquesRows } = await supabase.from('saques').select('amount, valor');
      let saquesTotal = 0;
      for (const s of saquesRows || []) {
        const n = normalizeSaqueRead(s);
        saquesTotal += Number(n.amount ?? n.valor ?? 0);
      }
      const t0 = startOfTodayIso();
      const { count: transacoesHoje } = await supabase
        .from('pagamentos_pix')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', t0);
      const { count: saquesHoje } = await supabase
        .from('saques')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', t0);
      const { count: novosUsuariosHoje } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', t0);

      const data = {
        resumo: {
          totalUsuarios: totalUsuarios || 0,
          usuariosAtivos: usuariosAtivos || 0,
          usuariosBloqueados: usuariosBloqueados || 0,
          totalTransacoes: totalTransacoes || 0,
          totalSaques: totalSaques || 0,
          totalChutes: totalChutes || 0,
          totalGols: totalGols || 0,
          receitaTotal,
          saquesTotal,
          saldoLiquido: receitaTotal - saquesTotal
        },
        estatisticas: {
          taxaAcerto: totalChutes ? (totalGols / totalChutes) * 100 : 0,
          mediaChutesPorUsuario: totalUsuarios ? (totalChutes || 0) / totalUsuarios : 0,
          mediaGolsPorUsuario: totalUsuarios ? totalGols / totalUsuarios : 0,
          transacoesHoje: transacoesHoje || 0,
          saquesHoje: saquesHoje || 0,
          novosUsuariosHoje: novosUsuariosHoje || 0
        },
        periodos: {
          ultimaAtualizacao: new Date().toISOString(),
          periodoRelatorio: 'Tempo real (dados do banco)',
          proximaAtualizacao: null
        }
      };
      return res.json({ success: true, data });
    } catch (err) {
      console.error('[ADMIN-API] /relatorios/geral', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/relatorios/semanal', async (req, res) => {
    try {
      const supabase = getSupabase();
      if (!isDbConnected() || !supabase) {
        return res.status(503).json({ success: false, message: 'Banco indisponível' });
      }
      const w0 = startOfWeekIso();
      const { data: pix } = await supabase
        .from('pagamentos_pix')
        .select('amount, valor')
        .eq('status', 'approved')
        .gte('created_at', w0);
      let credits = 0;
      for (const p of pix || []) {
        const n = normalizePagamentoPixRead(p);
        credits += Number(n.amount ?? n.valor ?? 0);
      }
      const { data: saques } = await supabase.from('saques').select('amount, valor').gte('created_at', w0);
      let debits = 0;
      for (const s of saques || []) {
        const n = normalizeSaqueRead(s);
        debits += Number(n.amount ?? n.valor ?? 0);
      }
      const { count: totalGames } = await supabase.from('chutes').select('*', { count: 'exact', head: true }).gte('created_at', w0);
      const data = {
        credits,
        debits,
        balance: credits - debits,
        totalGames: totalGames || 0
      };
      return res.json({ success: true, data });
    } catch (err) {
      console.error('[ADMIN-API] /relatorios/semanal', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/transacoes', async (req, res) => {
    try {
      const supabase = getSupabase();
      if (!isDbConnected() || !supabase) {
        return res.status(503).json({ success: false, message: 'Banco indisponível' });
      }
      const { data: users } = await supabase.from('usuarios').select('id, username, email');
      const label = {};
      for (const u of users || []) label[u.id] = u.username || u.email;
      const { data: pix } = await supabase
        .from('pagamentos_pix')
        .select('id, usuario_id, amount, valor, status, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      const out = [];
      for (const p of pix || []) {
        const n = normalizePagamentoPixRead(p);
        const uid = p.usuario_id;
        out.push({
          id: `pix-${n.id}`,
          user_id: label[uid] || String(uid || '—'),
          type: 'credit',
          amount: Number(n.amount ?? n.valor ?? 0),
          description: `PIX ${n.status || ''}`,
          transaction_date: n.created_at
        });
      }
      const { data: saques } = await supabase.from('saques').select('*').order('created_at', { ascending: false }).limit(100);
      for (const s of saques || []) {
        const n = normalizeSaqueRead(s);
        out.push({
          id: `saque-${n.id}`,
          user_id: label[n.usuario_id] || String(n.usuario_id),
          type: 'debit',
          amount: Number(n.amount ?? n.valor ?? 0),
          description: `Saque (${n.status || ''})`,
          transaction_date: n.created_at
        });
      }
      out.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
      return res.json({ success: true, data: out.slice(0, 150) });
    } catch (err) {
      console.error('[ADMIN-API] /transacoes', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/saques', async (req, res) => {
    try {
      const supabase = getSupabase();
      if (!isDbConnected() || !supabase) {
        return res.status(503).json({ success: false, message: 'Banco indisponível' });
      }
      const { data: users } = await supabase.from('usuarios').select('id, username, email');
      const label = {};
      for (const u of users || []) label[u.id] = u.username || u.email;
      const { data: saques, error } = await supabase.from('saques').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) return res.status(500).json({ success: false, message: error.message });
      const list = (saques || []).map((s) => mapSaqueRow(s, label[s.usuario_id]));
      return res.json({ success: true, data: list });
    } catch (err) {
      console.error('[ADMIN-API] /saques', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/logs', async (req, res) => {
    try {
      const mem = process.memoryUsage();
      const data = {
        entries: [],
        observacao:
          'Sem tabela de logs de auditoria no V1. Use logs da hospedagem (Fly) ou agregador externo. Métricas do processo abaixo são reais.',
        processo: {
          uptimeSegundos: Math.round(process.uptime()),
          heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          nodeEnv: process.env.NODE_ENV || 'development'
        }
      };
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/chutes', async (req, res) => {
    try {
      const supabase = getSupabase();
      if (!isDbConnected() || !supabase) {
        return res.status(503).json({ success: false, message: 'Banco indisponível' });
      }
      const { data: chutes, error } = await supabase
        .from('chutes')
        .select('id, usuario_id, lote_id, direcao, resultado, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) return res.status(500).json({ success: false, message: error.message });
      const userIds = [...new Set((chutes || []).map((c) => c.usuario_id))];
      const { data: users } = await supabase.from('usuarios').select('id, username, email').in('id', userIds);
      const names = {};
      for (const u of users || []) names[u.id] = u.username || u.email;
      const list = (chutes || []).map((c) => ({
        user_name: names[c.usuario_id] || String(c.usuario_id),
        game_id: c.lote_id,
        direction: c.direcao,
        scored: c.resultado === 'goal',
        created_at: c.created_at
      }));
      return res.json({ success: true, data: list });
    } catch (err) {
      console.error('[ADMIN-API] /chutes', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/top-jogadores', async (req, res) => {
    try {
      const supabase = getSupabase();
      if (!isDbConnected() || !supabase) {
        return res.status(503).json({ success: false, message: 'Banco indisponível' });
      }
      const { data: chutes } = await supabase.from('chutes').select('usuario_id, resultado');
      const byUser = {};
      for (const c of chutes || []) {
        if (!byUser[c.usuario_id]) byUser[c.usuario_id] = { partidas: 0, gols: 0 };
        byUser[c.usuario_id].partidas++;
        if (c.resultado === 'goal') byUser[c.usuario_id].gols++;
      }
      const sorted = Object.entries(byUser)
        .map(([uid, v]) => ({
          id: uid,
          totalPartidas: v.partidas,
          totalGols: v.gols,
          eficiencia: v.partidas ? (v.gols / v.partidas) * 100 : 0
        }))
        .sort((a, b) => b.totalGols - a.totalGols)
        .slice(0, 50);
      const ids = sorted.map((x) => x.id);
      const { data: users } = await supabase.from('usuarios').select('id, username, email').in('id', ids);
      const names = {};
      for (const u of users || []) names[u.id] = u.username || u.email;
      const data = sorted.map((r) => ({
        name: names[r.id] || String(r.id),
        totalGols: r.totalGols,
        totalPartidas: r.totalPartidas,
        eficiencia: r.eficiencia
      }));
      return res.json({ success: true, data });
    } catch (err) {
      console.error('[ADMIN-API] /top-jogadores', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Alias histórico: “fila” = contagem de lotes ativos (ver buildAdminLotesSnapshotPayload).
  router.get('/fila', async (req, res) => {
    try {
      const data = buildAdminLotesSnapshotPayload(getQueueSnapshot);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/lotes', async (req, res) => {
    try {
      const data = buildAdminLotesSnapshotPayload(getQueueSnapshot);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/configuracoes', (req, res) => {
    try {
      const data = readSettings();
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.post('/configuracoes', (req, res) => {
    try {
      const cur = readSettings();
      const next = { ...cur, ...req.body };
      writeSettings(next);
      return res.json({ success: true, data: next });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/exportacao', async (req, res) => {
    try {
      const format = req.query.format;
      const tipo = req.query.tipo;
      if (format === 'csv' && tipo) {
        const supabase = getSupabase();
        if (!isDbConnected() || !supabase) {
          return res.status(503).send('Banco indisponível');
        }
        if (tipo === 'usuarios') {
          const { data } = await supabase.from('usuarios').select('id, username, email, saldo, ativo, created_at').limit(2000);
          const rows = (data || []).map((u) => ({
            id: u.id,
            nome: u.username,
            email: u.email,
            saldo: u.saldo,
            ativo: u.ativo,
            criado: u.created_at
          }));
          const csv = ['id,nome,email,saldo,ativo,criado']
            .concat(rows.map((r) => [r.id, r.nome, r.email, r.saldo, r.ativo, r.criado].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')))
            .join('\n');
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          return res.send(csv);
        }
        if (tipo === 'chutes') {
          const { data } = await supabase
            .from('chutes')
            .select('id, usuario_id, lote_id, direcao, resultado, valor_aposta, created_at')
            .limit(2000);
          const csv = ['id,usuario_id,lote_id,direcao,resultado,valor_aposta,criado']
            .concat(
              (data || []).map((r) =>
                [r.id, r.usuario_id, r.lote_id, r.direcao, r.resultado, r.valor_aposta, r.created_at]
                  .map((x) => `"${String(x).replace(/"/g, '""')}"`)
                  .join(',')
              )
            )
            .join('\n');
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          return res.send(csv);
        }
        if (tipo === 'transacoes') {
          const { data: pix } = await supabase.from('pagamentos_pix').select('*').limit(500);
          const lines = ['tipo,id,usuario_id,valor,status,criado'];
          for (const p of pix || []) {
            const n = normalizePagamentoPixRead(p);
            lines.push(
              `"pix","${n.id}","${n.usuario_id}","${n.amount}","${n.status}","${n.created_at}"`
            );
          }
          const { data: sx } = await supabase.from('saques').select('*').limit(500);
          for (const s of sx || []) {
            const n = normalizeSaqueRead(s);
            lines.push(`"saque","${n.id}","${n.usuario_id}","${n.amount}","${n.status}","${n.created_at}"`);
          }
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          return res.send(lines.join('\n'));
        }
        if (tipo === 'saques') {
          const { data } = await supabase.from('saques').select('*').limit(2000);
          const csv = ['id,usuario_id,valor,status,criado']
            .concat(
              (data || []).map((r) => {
                const n = normalizeSaqueRead(r);
                return `"${n.id}","${n.usuario_id}","${n.amount}","${n.status}","${n.created_at}"`;
              })
            )
            .join('\n');
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          return res.send(csv);
        }
        return res.status(400).json({ success: false, message: 'tipo CSV inválido' });
      }

      const supabase = getSupabase();
      if (!isDbConnected() || !supabase) {
        return res.status(503).json({ success: false, message: 'Banco indisponível' });
      }
      const { count: cUser } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
      const { count: cChutes } = await supabase.from('chutes').select('*', { count: 'exact', head: true });
      const { count: cPix } = await supabase.from('pagamentos_pix').select('*', { count: 'exact', head: true });
      const { count: cSaques } = await supabase.from('saques').select('*', { count: 'exact', head: true });
      return res.json({
        success: true,
        data: {
          usuarios: { total: cUser || 0 },
          chutes: { total: cChutes || 0 },
          transacoes: { total: (cPix || 0) + (cSaques || 0) },
          saques: { total: cSaques || 0 },
          csvQuery: 'GET /api/admin/exportacao?format=csv&tipo=usuarios|chutes|transacoes|saques'
        }
      });
    } catch (err) {
      console.error('[ADMIN-API] /exportacao', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  router.get('/backup', (req, res) => {
    return res.json({ success: true, data: [...backupEntries] });
  });

  router.post('/backup', (req, res) => {
    const action = (req.body && req.body.action) || 'create';
    if (action === 'delete') {
      const id = req.body.backupId || req.body.id;
      backupEntries = backupEntries.filter((b) => b.id !== id);
      return res.json({ success: true, data: { removed: id } });
    }
    const id = `bkp-${Date.now()}`;
    const entry = {
      id,
      name: id,
      date: new Date().toISOString(),
      size: '—',
      status: 'registered',
      files: 0,
      description: 'Registro de backup solicitado pelo painel (sem arquivo binário neste V1).'
    };
    backupEntries.unshift(entry);
    return res.json({ success: true, data: entry });
  });

  return router;
}

module.exports = createAdminRouter;
