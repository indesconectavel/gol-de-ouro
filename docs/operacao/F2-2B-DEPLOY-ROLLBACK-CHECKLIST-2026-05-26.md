# F2.2B — Checklist de deploy e rollback (Engine V2)

**Data:** 2026-05-26  
**Patch:** `database/patches/F2-2B-shoot-apply-fixed-last-shot-winner-2026-05-26.sql`  
**Rollback:** `database/patches/F2-2B-ROLLBACK-shoot-apply-v1-random-2026-05-26.sql`  
**Validação:** `node scripts/f2-2b-validate-shoot-apply-ac.mjs`

---

## 0. Pré-requisitos (bloqueadores)

- [ ] Gate societário sobre saques históricos (OC.INC-01) documentado
- [ ] Certificação V2 planejada (pós-staging PASS)
- [ ] Backup / export `pg_get_functiondef('public.shoot_apply', …)` da produção
- [ ] **Não** aplicar em produção sem autorização final explícita

---

## 1. Definir T0 no patch

Antes de aplicar em **staging** ou **produção**, editar no patch:

```sql
c_engine_v2_from constant timestamptz := timestamptz '2026-05-26T00:00:00+00';
```

Substituir pelo instante real do deploy, por exemplo:

```sql
c_engine_v2_from constant timestamptz := timestamptz '2026-05-26T18:00:00+00';
```

**Regra:** lotes com `created_at < T0` → motor **legado**; lotes criados após → **V2**.

---

## 2. Staging — aplicar patch

1. [ ] Abrir SQL Editor do projeto **staging** (nunca produção nesta etapa)
2. [ ] Colar conteúdo de `F2-2B-shoot-apply-fixed-last-shot-winner-2026-05-26.sql`
3. [ ] Confirmar `T0` ajustado
4. [ ] Executar
5. [ ] Verificar: `SELECT proname FROM pg_proc WHERE proname = 'shoot_apply';`
6. [ ] Opcional: confirmar ausência de `random()` no corpo (busca em `pg_get_functiondef`)

---

## 3. Staging — validação AC

```powershell
# PowerShell (não usar && — usar ; ou linhas separadas)
Set-Location "e:\Chute de Ouro\goldeouro-backend"
node scripts/f2-2b-validate-shoot-apply-ac.mjs
```

| AC | Descrição | Staging |
|----|-----------|---------|
| AC-1 | R$1: 9 miss + 1 goal no 10º | [ ] |
| AC-2 | R$2: 4 miss + 1 goal no 5º | [ ] |
| AC-3 | R$5: 1 miss + 1 goal no 2º | [ ] |
| AC-4 | R$10: 1 goal no 1º | [ ] |
| AC-5 | ≤ 1 goal por lote novo | [ ] |
| AC-6 | Lote V2 não fecha antes do último chute | [ ] |
| AC-7 | Saldo: −aposta em miss; −aposta+prémio em goal | [ ] |
| AC-8 | Chutes históricos inalterados (sem UPDATE em massa) | [ ] |
| AC-9 | Rollback SQL aplicável e função restaurada | [ ] |

Simulação offline (sem DB):

```powershell
node scripts/f2-2b-validate-shoot-apply-ac.mjs --dry-run
```

---

## 4. Staging — teste manual legado (Opção A)

1. [ ] Identificar lote **ativo** com `created_at < T0` (se existir)
2. [ ] Executar 1 chute e confirmar `engine: "legacy"` na resposta RPC (campo novo)
3. [ ] Confirmar que fecho antecipado no gol ainda funciona nesse lote

---

## 5. Produção — gate final (somente após PASS staging)

- [ ] Aprovação escrita (ops + produto + governança)
- [ ] Comunicação interna: RTP / custo por lote alterado
- [ ] Congelar novos jogadores se política OC.INC-03 ainda vigente
- [ ] Ajustar `T0` para instante de produção
- [ ] Aplicar patch SQL em produção
- [ ] **Não** redeploy backend obrigatório (contrato HTTP inalterado; campos `engine`/`indice_vencedor` extras são opcionais)
- [ ] Probe read-only pós-deploy:

```sql
-- Lotes V2 (após T0): nenhum finalizado com menos chutes que tamanho
SELECT l.id, l.tamanho, count(c.id) AS chutes
FROM lotes l
JOIN chutes c ON c.lote_id = l.id
WHERE l.created_at >= 'T0_AQUI'::timestamptz
  AND l.status = 'finalizado'
GROUP BY l.id, l.tamanho
HAVING count(c.id) < l.tamanho;
-- Esperado: 0 linhas
```

---

## 6. Rollback

**Quando usar:** regressão em staging; AC falhou; decisão de abortar Engine V2.

1. [ ] Aplicar `F2-2B-ROLLBACK-shoot-apply-v1-random-2026-05-26.sql`
2. [ ] Confirmar `random()` restaurado no `INSERT` de novos lotes
3. [ ] Lotes já criados sob V2 **não** são revertidos automaticamente (sem migração destrutiva)
4. [ ] Documentar incidente e manter lotes V2 isolados em relatório

**AC-9:** rollback é reversível ao nível da **função**; dados de lotes V2 permanecem no banco.

---

## 7. Ordem de deploy (inalterada)

| Ordem | Componente |
|-------|------------|
| 1 | SQL Supabase (`shoot_apply`) |
| 2 | Backend (opcional; só se houver mudança de contrato) |
| 3 | Validação probes + certificação V2 |

---

## 8. Proibido

- Aplicar em produção sem item §5
- `UPDATE` em `chutes`/`lotes` históricos
- Recalcular saldos ou prémios passados
- Aprovar/cancelar saques nesta entrega
- Deploy automático / push sem validação staging

---

*Checklist F2.2B — Gol de Ouro*
