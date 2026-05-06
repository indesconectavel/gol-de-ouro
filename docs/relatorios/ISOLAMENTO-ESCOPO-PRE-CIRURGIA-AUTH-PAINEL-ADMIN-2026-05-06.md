# ISOLAMENTO DE ESCOPO — PRÉ-CIRURGIA AUTH PAINEL ADMIN

**Data:** 2026-05-06  
**Objetivo:** preparar working tree com segurança para iniciar cirurgia de autenticação real do painel admin, sem misturar escopos.

---

## 1) Status interno do subprojeto `goldeouro-admin`

Comandos executados em `goldeouro-admin`:

- `git status --short`
- `git diff`

Resultado:

- `M vercel.json`

Diff observado:

- inclusão de bloco `rewrites` em `vercel.json` (subprojeto admin)

Conclusão:

- há alteração funcional/configuracional **interna ao admin** e ela **não** deve ser commitada neste passo de documentação.

---

## 2) Status da raiz após inspeção

`git status --short` na raiz apontou:

- `m goldeouro-admin` (subprojeto com dirty state)
- `M goldeouro-player/vercel.json` (fora do escopo admin auth)
- múltiplos `docs/relatorios/*.md` não rastreados
- scripts de diagnóstico/smoke não rastreados
- arquivo temporário `scripts/tmp-generate-bcrypt-hash.js` não rastreado

---

## 3) Isolamento aplicado

- `goldeouro-player/vercel.json` mantido **fora do escopo** (não staged)
- scripts úteis de smoke/diagnóstico preservados (não staged)
- temporário removido do escopo:
  - `scripts/tmp-generate-bcrypt-hash.js` (apagado por ser artefato temporário)

---

## 4) Estratégia de commit seguro (somente docs)

Commit separado exclusivamente com relatórios relacionados a:

1. diagnóstico auth painel admin  
2. smoke test saque manual  
3. preparação/validação pós-cirurgia

Sem incluir:

- alterações funcionais do subprojeto `goldeouro-admin`
- alterações do `goldeouro-player`
- scripts temporários/operacionais

---

## 5) Decisão operacional

**Status de preparação:** isolamento de escopo concluído para commit documental.  
**Próximo passo seguro:** commitar apenas relatórios selecionados e iniciar cirurgia auth admin em branch/commit dedicado.

---

**Fim do relatório.**
