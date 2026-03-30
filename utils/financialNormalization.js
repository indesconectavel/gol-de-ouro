/**
 * Normalização financeira PT/EN — leitura canónica (EN + fallback PT) e dual write.
 * Sem alteração de schema; compatível com colunas espelhadas existentes.
 */

const MONEY_WARN_EPS = 0.02;

function parseMoney(v) {
  if (v === null || v === undefined || v === '') return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

function parseStr(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

/**
 * Registo `pagamentos_pix` com amount/valor alinhados ao valor canónico (EN primeiro).
 * @param {object|null} row
 * @returns {object|null}
 */
function normalizePagamentoPixRead(row) {
  if (!row || typeof row !== 'object') return row;
  const a = parseMoney(row.amount);
  const b = parseMoney(row.valor);
  const canonical = a !== null ? a : b;
  const out = { ...row };
  if (canonical !== null) {
    out.amount = canonical;
    out.valor = canonical;
  }
  if (a !== null && b !== null && Math.abs(a - b) > MONEY_WARN_EPS) {
    console.warn(
      '[FIN-NORM] pagamentos_pix amount≠valor id=%s payment_id=%s',
      row.id,
      row.payment_id
    );
  }
  return out;
}

/**
 * Registo `saques` com pares EN/PT alinhados.
 * @param {object|null} row
 * @returns {object|null}
 */
function normalizeSaqueRead(row) {
  if (!row || typeof row !== 'object') return row;
  const a = parseMoney(row.amount);
  const b = parseMoney(row.valor);
  const money = a !== null ? a : b;
  const pk = parseStr(row.pix_key) || parseStr(row.chave_pix);
  const pt = parseStr(row.pix_type) || parseStr(row.tipo_chave);
  const out = { ...row };
  if (money !== null) {
    out.amount = money;
    out.valor = money;
  }
  if (a !== null && b !== null && Math.abs(a - b) > MONEY_WARN_EPS) {
    console.warn('[FIN-NORM] saques amount≠valor id=%s', row.id);
  }
  if (pk) {
    out.pix_key = pk;
    out.chave_pix = pk;
  }
  if (pt) {
    out.pix_type = pt;
    out.tipo_chave = pt;
  }
  const pkA = parseStr(row.pix_key);
  const pkB = parseStr(row.chave_pix);
  if (pkA && pkB && pkA !== pkB) {
    console.warn('[FIN-NORM] saques pix_key≠chave_pix id=%s', row.id);
  }
  const tA = parseStr(row.pix_type);
  const tB = parseStr(row.tipo_chave);
  if (tA && tB && tA !== tB) {
    console.warn('[FIN-NORM] saques pix_type≠tipo_chave id=%s', row.id);
  }
  return out;
}

/**
 * Ponto único de entrada para leitura normalizada por tabela.
 * @param {'pagamentos_pix'|'saques'} table
 * @param {object|null} row
 */
function normalizeFinancialRecord(table, row) {
  if (table === 'pagamentos_pix') return normalizePagamentoPixRead(row);
  if (table === 'saques') return normalizeSaqueRead(row);
  return row;
}

/**
 * Payload INSERT/UPDATE `pagamentos_pix` com amount=valor e payment_id/external_id espelhados.
 */
function dualWritePagamentoPixRow({
  usuario_id,
  payment_id,
  external_id,
  amount,
  status,
  qr_code,
  qr_code_base64,
  pix_copy_paste,
  expires_at
}) {
  const a = parseMoney(amount);
  const pid = payment_id != null ? String(payment_id).trim() : '';
  const ext = external_id != null && String(external_id).trim() !== '' ? String(external_id).trim() : pid;
  const row = {
    usuario_id,
    payment_id: pid || ext,
    external_id: ext || pid,
    amount: a,
    valor: a,
    status,
    qr_code: qr_code ?? null,
    qr_code_base64: qr_code_base64 ?? null,
    pix_copy_paste: pix_copy_paste ?? null
  };
  if (expires_at !== undefined) row.expires_at = expires_at;
  return row;
}

/**
 * Payload INSERT `saques` com todos os pares PT/EN preenchidos igualmente.
 */
function dualWriteSaqueRow({
  usuario_id,
  amount,
  pix_key,
  pix_type,
  status,
  created_at,
  fee,
  net_amount,
  correlation_id
}) {
  const v = parseMoney(amount);
  const pk = parseStr(pix_key);
  const pt = parseStr(pix_type);
  const row = {
    usuario_id,
    amount: v,
    valor: v,
    pix_key: pk,
    chave_pix: pk,
    pix_type: pt,
    tipo_chave: pt,
    status,
    created_at
  };
  if (fee !== undefined) row.fee = fee;
  if (net_amount !== undefined) row.net_amount = net_amount;
  if (correlation_id !== undefined) row.correlation_id = correlation_id;
  return row;
}

module.exports = {
  normalizeFinancialRecord,
  normalizePagamentoPixRead,
  normalizeSaqueRead,
  dualWritePagamentoPixRow,
  dualWriteSaqueRow,
  parseMoney,
  parseStr
};
