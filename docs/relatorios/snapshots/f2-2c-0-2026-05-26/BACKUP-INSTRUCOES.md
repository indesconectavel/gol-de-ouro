# F2.2C.0 — Instruções de backup (executar imediatamente ANTES do patch)

**Projeto produção:** `gayopagjdrkcmkirmfvy`  
**Modo:** read-only até export; nenhum `CREATE OR REPLACE` antes dos dumps.

## 1. Dump da função `shoot_apply`

```sql
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'shoot_apply'
ORDER BY p.oid DESC
LIMIT 1;
```

Salvar resultado em: `docs/relatorios/snapshots/f2-2c-0-2026-05-26/shoot_apply-ANTES.sql`

## 2. Snapshot read-only (contagens + checksums)

Executar no SQL Editor e arquivar JSON/CSV:

```sql
SELECT 'usuarios' AS t, count(*)::bigint AS n FROM public.usuarios
UNION ALL SELECT 'lotes', count(*) FROM public.lotes
UNION ALL SELECT 'chutes', count(*) FROM public.chutes
UNION ALL SELECT 'saques', count(*) FROM public.saques
UNION ALL SELECT 'pagamentos_pix', count(*) FROM public.pagamentos_pix
UNION ALL SELECT 'metricas_globais', count(*) FROM public.metricas_globais;

SELECT valor_aposta, count(*) FROM public.chutes GROUP BY 1 ORDER BY 1;
SELECT status, count(*) FROM public.lotes GROUP BY 1;
SELECT status, count(*) FROM public.saques GROUP BY 1;
```

Salvar em: `docs/relatorios/snapshots/f2-2c-0-2026-05-26/table-snapshot-antes.json`

## 3. Rollback pronto

`database/rollback/F2-2C-rollback-shoot-apply-before-economic-fix-2026-05-26.sql`
