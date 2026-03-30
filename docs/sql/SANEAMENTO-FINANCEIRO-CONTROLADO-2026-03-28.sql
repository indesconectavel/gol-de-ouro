-- =============================================================================
-- SANEAMENTO FINANCEIRO CONTROLADO — PT/EN (espelhamento seguro)
-- Data: 2026-03-28
-- Regras: sem RENAME, sem DROP; só NULL/vazio preenchido a partir do par;
--         nunca sobrescrever quando ambos os lados têm valores diferentes.
-- Execução: Supabase SQL Editor ou psql. Preferir transação BEGIN/COMMIT por lote.
-- Script Node equivalente: scripts/saneamento-financeiro-controlado-2026-03-28.js
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) DIAGNÓSTICO — pagamentos_pix (amount ↔ valor)
-- ---------------------------------------------------------------------------

SELECT 'pp: amount NULL e valor preenchido' AS diagnostico, COUNT(*) AS n
FROM public.pagamentos_pix
WHERE amount IS NULL AND valor IS NOT NULL;

SELECT 'pp: valor NULL e amount preenchido' AS diagnostico, COUNT(*) AS n
FROM public.pagamentos_pix
WHERE valor IS NULL AND amount IS NOT NULL;

SELECT 'pp: ambos NULL' AS diagnostico, COUNT(*) AS n
FROM public.pagamentos_pix
WHERE amount IS NULL AND valor IS NULL;

SELECT 'pp: ambos preenchidos e valores diferentes (>0.01)' AS diagnostico, COUNT(*) AS n
FROM public.pagamentos_pix
WHERE amount IS NOT NULL AND valor IS NOT NULL
  AND ABS(COALESCE(amount, 0) - COALESCE(valor, 0)) > 0.01;

-- ---------------------------------------------------------------------------
-- 2) DIAGNÓSTICO — pagamentos_pix (external_id duplicado) — SÓ INVENTÁRIO
-- ---------------------------------------------------------------------------

SELECT external_id, COUNT(*) AS n, array_agg(id ORDER BY created_at) AS ids
FROM public.pagamentos_pix
WHERE external_id IS NOT NULL AND TRIM(external_id) <> ''
GROUP BY external_id
HAVING COUNT(*) > 1
ORDER BY n DESC;

-- ---------------------------------------------------------------------------
-- 3) DIAGNÓSTICO — pagamentos_pix (payment_id duplicado)
-- ---------------------------------------------------------------------------

SELECT payment_id, COUNT(*) AS n, array_agg(id ORDER BY created_at) AS ids
FROM public.pagamentos_pix
WHERE payment_id IS NOT NULL AND TRIM(payment_id::text) <> ''
GROUP BY payment_id
HAVING COUNT(*) > 1
ORDER BY n DESC;

-- ---------------------------------------------------------------------------
-- 4) UPDATES SEGUROS — pagamentos_pix (executar apenas após diagnóstico > 0)
-- ---------------------------------------------------------------------------

-- Espelhar valor → amount quando amount é NULL
-- UPDATE public.pagamentos_pix
-- SET amount = valor, updated_at = NOW()
-- WHERE amount IS NULL AND valor IS NOT NULL;

-- Espelhar amount → valor quando valor é NULL
-- UPDATE public.pagamentos_pix
-- SET valor = amount, updated_at = NOW()
-- WHERE valor IS NULL AND amount IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5) DIAGNÓSTICO — saques (amount ↔ valor)
-- ---------------------------------------------------------------------------

SELECT 'sq: amount NULL e valor OK' AS diagnostico, COUNT(*) AS n
FROM public.saques
WHERE amount IS NULL AND valor IS NOT NULL;

SELECT 'sq: valor NULL e amount OK' AS diagnostico, COUNT(*) AS n
FROM public.saques
WHERE valor IS NULL AND amount IS NOT NULL;

SELECT 'sq: ambos NULL' AS diagnostico, COUNT(*) AS n
FROM public.saques
WHERE amount IS NULL AND valor IS NULL;

SELECT 'sq: ambos preenchidos e diferentes' AS diagnostico, COUNT(*) AS n
FROM public.saques
WHERE amount IS NOT NULL AND valor IS NOT NULL
  AND ABS(COALESCE(amount, 0) - COALESCE(valor, 0)) > 0.01;

-- ---------------------------------------------------------------------------
-- 6) DIAGNÓSTICO — saques (pix_key ↔ chave_pix)
-- ---------------------------------------------------------------------------

SELECT 'sq: pix_key NULL, chave_pix OK' AS diagnostico, COUNT(*) AS n
FROM public.saques
WHERE (pix_key IS NULL OR TRIM(pix_key) = '') AND chave_pix IS NOT NULL AND TRIM(chave_pix) <> '';

SELECT 'sq: chave_pix NULL, pix_key OK' AS diagnostico, COUNT(*) AS n
FROM public.saques
WHERE (chave_pix IS NULL OR TRIM(chave_pix) = '') AND pix_key IS NOT NULL AND TRIM(pix_key) <> '';

SELECT 'sq: ambos preenchidos e diferentes' AS diagnostico, COUNT(*) AS n
FROM public.saques
WHERE pix_key IS NOT NULL AND TRIM(pix_key) <> ''
  AND chave_pix IS NOT NULL AND TRIM(chave_pix) <> ''
  AND TRIM(pix_key) <> TRIM(chave_pix);

-- ---------------------------------------------------------------------------
-- 7) DIAGNÓSTICO — saques (pix_type ↔ tipo_chave)
-- ---------------------------------------------------------------------------

SELECT 'sq: pix_type NULL, tipo_chave OK' AS diagnostico, COUNT(*) AS n
FROM public.saques
WHERE (pix_type IS NULL OR TRIM(pix_type) = '') AND tipo_chave IS NOT NULL AND TRIM(tipo_chave) <> '';

SELECT 'sq: tipo_chave NULL, pix_type OK' AS diagnostico, COUNT(*) AS n
FROM public.saques
WHERE (tipo_chave IS NULL OR TRIM(tipo_chave) = '') AND pix_type IS NOT NULL AND TRIM(pix_type) <> '';

SELECT 'sq: tipos diferentes' AS diagnostico, COUNT(*) AS n
FROM public.saques
WHERE pix_type IS NOT NULL AND TRIM(pix_type) <> ''
  AND tipo_chave IS NOT NULL AND TRIM(tipo_chave) <> ''
  AND LOWER(TRIM(pix_type)) <> LOWER(TRIM(tipo_chave));

-- ---------------------------------------------------------------------------
-- 8) INVENTÁRIO — fee, net_amount, correlation_id (sem UPDATE automático)
-- ---------------------------------------------------------------------------

SELECT 'sq: fee NULL' AS diagnostico, COUNT(*) AS n FROM public.saques WHERE fee IS NULL;
SELECT 'sq: net_amount NULL' AS diagnostico, COUNT(*) AS n FROM public.saques WHERE net_amount IS NULL;
SELECT 'sq: correlation_id NULL' AS diagnostico, COUNT(*) AS n
FROM public.saques
WHERE correlation_id IS NULL OR TRIM(correlation_id::text) = '';

-- ---------------------------------------------------------------------------
-- 9) UPDATES SEGUROS — saques (espelhamento; executar só onde diagnóstico > 0)
-- ---------------------------------------------------------------------------

-- UPDATE public.saques SET amount = valor, updated_at = NOW()
-- WHERE amount IS NULL AND valor IS NOT NULL;

-- UPDATE public.saques SET valor = amount, updated_at = NOW()
-- WHERE valor IS NULL AND amount IS NOT NULL;

-- UPDATE public.saques SET pix_key = TRIM(chave_pix), updated_at = NOW()
-- WHERE (pix_key IS NULL OR TRIM(pix_key) = '') AND chave_pix IS NOT NULL AND TRIM(chave_pix) <> '';

-- UPDATE public.saques SET chave_pix = TRIM(pix_key), updated_at = NOW()
-- WHERE (chave_pix IS NULL OR TRIM(chave_pix) = '') AND pix_key IS NOT NULL AND TRIM(pix_key) <> '';

-- UPDATE public.saques SET pix_type = LOWER(TRIM(tipo_chave)), updated_at = NOW()
-- WHERE (pix_type IS NULL OR TRIM(pix_type) = '') AND tipo_chave IS NOT NULL AND TRIM(tipo_chave) <> '';

-- UPDATE public.saques SET tipo_chave = LOWER(TRIM(pix_type)), updated_at = NOW()
-- WHERE (tipo_chave IS NULL OR TRIM(tipo_chave) = '') AND pix_type IS NOT NULL AND TRIM(pix_type) <> '';

-- NOTA fee / net_amount: o backend (server-fly.js) usa env PAGAMENTO_TAXA_SAQUE para cálculo
-- informativo no pedido de saque; não há regra única validada para backfill histórico sem revisão
-- manual. Não atualizar fee/net_amount neste ficheiro sem decisão explícita.

-- ---------------------------------------------------------------------------
-- 10) VALIDAÇÃO FINAL (repetir após UPDATEs)
-- ---------------------------------------------------------------------------

SELECT 'VAL pp: amount NULL com valor OK' AS check, COUNT(*) FROM public.pagamentos_pix WHERE amount IS NULL AND valor IS NOT NULL;
SELECT 'VAL pp: valor NULL com amount OK' AS check, COUNT(*) FROM public.pagamentos_pix WHERE valor IS NULL AND amount IS NOT NULL;
SELECT 'VAL pp: conflito monetário' AS check, COUNT(*) FROM public.pagamentos_pix
WHERE amount IS NOT NULL AND valor IS NOT NULL AND ABS(amount - valor) > 0.01;

SELECT 'VAL sq: amount NULL' AS check, COUNT(*) FROM public.saques WHERE amount IS NULL AND valor IS NOT NULL;
SELECT 'VAL sq: valor NULL' AS check, COUNT(*) FROM public.saques WHERE valor IS NULL AND amount IS NOT NULL;
SELECT 'VAL sq: money conflito' AS check, COUNT(*) FROM public.saques
WHERE amount IS NOT NULL AND valor IS NOT NULL AND ABS(amount - valor) > 0.01;
SELECT 'VAL sq: pix_key NULL' AS check, COUNT(*) FROM public.saques
WHERE (pix_key IS NULL OR TRIM(pix_key) = '') AND chave_pix IS NOT NULL AND TRIM(chave_pix) <> '';
SELECT 'VAL sq: chave_pix NULL' AS check, COUNT(*) FROM public.saques
WHERE (chave_pix IS NULL OR TRIM(chave_pix) = '') AND pix_key IS NOT NULL AND TRIM(pix_key) <> '';
SELECT 'VAL sq: chaves diferentes' AS check, COUNT(*) FROM public.saques
WHERE TRIM(pix_key) <> TRIM(chave_pix) AND pix_key IS NOT NULL AND chave_pix IS NOT NULL;
SELECT 'VAL sq: tipos diferentes' AS check, COUNT(*) FROM public.saques
WHERE LOWER(TRIM(pix_type)) <> LOWER(TRIM(tipo_chave)) AND pix_type IS NOT NULL AND tipo_chave IS NOT NULL;
