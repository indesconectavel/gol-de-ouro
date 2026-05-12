'use strict';

const MAX_TARGET_ID_LEN = 512;
const MAX_IP_LEN = 128;
const MAX_METADATA_BYTES = 8000;

function safeJsonForDb(meta) {
  if (meta == null || typeof meta !== 'object' || Array.isArray(meta)) {
    return {};
  }
  try {
    const s = JSON.stringify(meta);
    if (s.length > MAX_METADATA_BYTES) {
      return { _truncated: true, keys: Object.keys(meta).slice(0, 40) };
    }
    return JSON.parse(s);
  } catch (_) {
    return {};
  }
}

function normalizeIp(ip) {
  if (ip == null) return null;
  const s = String(ip).trim();
  if (!s) return null;
  return s.length > MAX_IP_LEN ? s.slice(0, MAX_IP_LEN) : s;
}

function normalizeTargetId(targetId) {
  if (targetId == null) return null;
  const s = String(targetId).trim();
  if (!s) return null;
  return s.length > MAX_TARGET_ID_LEN ? s.slice(0, MAX_TARGET_ID_LEN) : s;
}

/**
 * Persiste uma linha em `admin_logs`. Falhas não interrompem o fluxo HTTP (apenas consola).
 * Não armazenar senhas, tokens ou dados bancários/PIX.
 *
 * @param {object} params
 * @param {import('@supabase/supabase-js').SupabaseClient} params.supabase
 * @param {string} params.adminId
 * @param {string} params.action
 * @param {string|null} [params.targetType]
 * @param {string|null} [params.targetId]
 * @param {Record<string, unknown>} [params.metadata]
 * @param {string|null} [params.ip]
 */
async function logAdminAction({ supabase, adminId, action, targetType, targetId, metadata, ip }) {
  try {
    if (!supabase || !adminId || !action) return;
    const row = {
      admin_id: String(adminId).trim(),
      action: String(action).trim().slice(0, 200),
      target_type: targetType != null ? String(targetType).trim().slice(0, 120) : null,
      target_id: normalizeTargetId(targetId),
      metadata: safeJsonForDb(metadata),
      ip: normalizeIp(ip)
    };
    const { error } = await supabase.from('admin_logs').insert(row);
    if (error) {
      console.error('❌ [ADMIN-AUDIT] insert falhou:', error.message || error);
    }
  } catch (e) {
    console.error('❌ [ADMIN-AUDIT] exceção:', e?.message || e);
  }
}

function getClientIp(req) {
  if (!req || !req.headers) return null;
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.trim()) {
    return normalizeIp(xf.split(',')[0].trim());
  }
  if (req.ip) return normalizeIp(req.ip);
  return null;
}

module.exports = { logAdminAction, getClientIp };
