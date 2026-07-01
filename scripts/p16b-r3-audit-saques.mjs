#!/usr/bin/env node
/**
 * P1.6B.R3 — Auditoria read-only de saques elegíveis para homologação auth webhook.
 */
import { createRequire } from 'node:module';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
dotenv.config();

const { createClient } = require('@supabase/supabase-js');
const { isTechnicalE2EAccount, KNOWN_TECHNICAL_USER_IDS } = require('../src/utils/technicalE2EAccount');

const MIN_AMOUNT = Number(process.env.P16B_MIN_AMOUNT || 10);

function emit(tag, obj) {
  console.log(`###${tag}###${JSON.stringify(obj)}`);
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    emit('P16B_R3_VERDICT', { result: 'FAIL', error: 'SUPABASE credentials missing' });
    process.exit(1);
  }

  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: pendentes, error } = await sb
    .from('saques')
    .select(
      'id, usuario_id, status, amount, valor, net_amount, correlation_id, asaas_transfer_id, asaas_transfer_status, created_at, pix_key, chave_pix'
    )
    .in('status', ['pendente', 'pending'])
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) {
    emit('P16B_R3_VERDICT', { result: 'FAIL', error: error.message });
    process.exit(1);
  }

  const userIds = [...new Set((pendentes || []).map((s) => s.usuario_id).filter(Boolean))];
  const { data: users } = userIds.length
    ? await sb.from('usuarios').select('id, email, saldo').in('id', userIds)
    : { data: [] };
  const umap = Object.fromEntries((users || []).map((u) => [u.id, u]));

  const enriched = (pendentes || []).map((s) => {
    const u = umap[s.usuario_id];
    const amount = parseFloat(s.amount ?? s.valor ?? 0);
    const technical = isTechnicalE2EAccount({ id: s.usuario_id, email: u?.email });
    const eligible =
      technical &&
      amount >= MIN_AMOUNT &&
      ['pendente', 'pending'].includes(String(s.status || '').toLowerCase());
    return {
      id: s.id,
      usuario_id: s.usuario_id,
      email: u?.email ?? null,
      status: s.status,
      amount,
      net_amount: s.net_amount,
      saldo: u?.saldo ?? null,
      technical,
      eligible,
      correlation_id: s.correlation_id,
      created_at: s.created_at
    };
  });

  const technicalEligible = enriched.filter((r) => r.eligible);

  const techProfiles = [];
  for (const uid of KNOWN_TECHNICAL_USER_IDS) {
    const { data: u } = await sb.from('usuarios').select('id, email, saldo').eq('id', uid).maybeSingle();
    const { data: techSaques } = await sb
      .from('saques')
      .select('id, status, amount, valor, net_amount, created_at')
      .eq('usuario_id', uid)
      .order('created_at', { ascending: false })
      .limit(5);
    techProfiles.push({ user: u, recentSaques: techSaques || [] });
  }

  const { data: inFlight } = await sb
    .from('saques')
    .select('id, usuario_id, status, asaas_transfer_id, asaas_transfer_status, amount, net_amount')
    .eq('status', 'aguardando_confirmacao')
    .not('asaas_transfer_id', 'is', null)
    .limit(5);

  emit('P16B_R3_AUDIT', {
    at: new Date().toISOString(),
    minAmount: MIN_AMOUNT,
    pendenteCount: enriched.length,
    technicalEligibleCount: technicalEligible.length,
    technicalEligible,
    allPendentes: enriched,
    technicalProfiles: techProfiles,
    inFlightWithTransfer: inFlight || []
  });

  if (technicalEligible.length === 0) {
    emit('P16B_R3_VERDICT', {
      result: 'STOP_PREPARATION_REQUIRED',
      reason: 'Nenhum saque técnico em status pendente elegível',
      preparation: [
        'Criar saque técnico (conta validacao/e2e) valor mínimo R$ 10 via fluxo oficial',
        'Confirmar chave PIX cadastrada na conta técnica',
        'Confirmar painel Asaas com URL + token auth habilitados',
        'Reexecutar P1.6B.R3 com P16B_SAQUE_ID definido'
      ]
    });
    process.exit(2);
  }

  emit('P16B_R3_VERDICT', {
    result: 'READY',
    recommendedSaqueId: technicalEligible[0].id
  });
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
