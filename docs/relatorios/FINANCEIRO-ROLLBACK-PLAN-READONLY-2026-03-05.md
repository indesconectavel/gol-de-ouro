# Plano de backup e rollback — Financeiro (READ-ONLY)

**Data:** 2026-03-05  
**Modo:** READ-ONLY — especificação apenas; nenhum backup nem rollback executado nesta auditoria.  
**Objetivo:** Definir como gerar backup do Supabase com segurança e como reverter deploy no Fly em caso de incidente.

---

## 1. Backup do Supabase (produção)

### 1.1 Método recomendado: pg_dump

- **Ferramenta:** `pg_dump` (PostgreSQL), usando a connection string do projeto Supabase (Production).
- **Onde obter a connection string:** Dashboard Supabase → Project Settings → Database → Connection string (URI). Usar a variante que inclui senha (modo “Transaction” ou “Session” conforme necessidade). **Não colar a URL/senha em relatórios ou em repositório.**
- **Comando genérico (executar em ambiente seguro, com variável de ambiente):**
  ```bash
  pg_dump "$SUPABASE_DB_URL" --no-owner --no-acl -F c -f backups/FINANCEIRO-prod-backup-YYYYMMDD-HHMM.sql
  ```
  Ou formato custom (`-F c`) para restauração com `pg_restore`. Para arquivo SQL texto (portável):
  ```bash
  pg_dump "$SUPABASE_DB_URL" --no-owner --no-acl -f backups/FINANCEIRO-prod-backup-YYYYMMDD-HHMM.sql
  ```
- **Nome do arquivo:** `backups/FINANCEIRO-prod-backup-YYYYMMDD-HHMM.sql` (ex.: `20260305-2050`).
- **Escopo sugerido:** Todas as tabelas do schema `public` (ou pelo menos: `usuarios`, `pagamentos_pix`, `saques`, `transacoes`, `ledger_financeiro`, `chutes` e demais tabelas financeiras).

### 1.2 Checklist de validação do backup

1. **Existência e tamanho:** Arquivo criado e tamanho > 0 (esperado na ordem de MB para DB pequeno/médio).
2. **Integridade (formato custom):** `pg_restore --list backups/FINANCEIRO-prod-backup-YYYYMMDD-HHMM.sql` não deve falhar.
3. **Restore dry-run (opcional, em DB local ou staging):** Restaurar em instância de teste e conferir contagens de linhas em tabelas críticas (`usuarios`, `pagamentos_pix`, `saques`, `ledger_financeiro`).
4. **Não commitar:** A pasta `backups/` ou o arquivo de backup não devem ser commitados no repositório (adicionar ao `.gitignore` se necessário).

### 1.3 Alternativa Supabase Dashboard

- Dashboard → Database → Backups (se o plano tiver backups automáticos). Para ponto-in-time antes de mudança cirúrgica, usar backup automático mais recente ou acionar backup manual se disponível.

---

## 2. Rollback Fly (release anterior)

### 2.1 Comando para voltar à release anterior

- **Listar releases:**
  ```bash
  flyctl releases -a goldeouro-backend-v2
  ```
- **Reverter para a release N (ex.: v311 se a atual for v312):**
  ```bash
  flyctl releases rollback -a goldeouro-backend-v2 --version 311
  ```
  (Substituir `311` pela versão desejada.)
- **Efeito:** Fly passa a usar a imagem da release indicada para as máquinas do app (e do worker, se usarem a mesma imagem). As máquinas são atualizadas para essa imagem.

### 2.2 Validação pós-rollback

1. **Health:** `GET https://goldeouro-backend-v2.fly.dev/health` — deve retornar 200 e `"status":"ok"`.
2. **Game/critical path:** `GET /api/user/profile` (com Bearer válido) e fluxo de jogo (ex.: entrar na fila, shoot) conforme checklist de aceitação do produto.
3. **Logs:** `flyctl logs -a goldeouro-backend-v2 --no-tail` — verificar ausência de erros de boot ou 500 em rotas críticas.

### 2.3 Plano canário (opcional)

- **Escala atual (ex.):** app count = 2 (uma started, uma stopped); payout_worker = 1.
- **Passo 1:** Reduzir app para 1 máquina: `flyctl scale count 1 -a goldeouro-backend-v2` (ou via Dashboard). Validar /health e tráfego na única instância.
- **Passo 2:** Executar rollback (nova imagem = release anterior). Validar /health e fluxo crítico.
- **Passo 3:** Se estável, escalar novamente para 2 app: `flyctl scale count 2 -a goldeouro-backend-v2`.
- **Objetivo:** Minimizar impacto durante rollback e validar em uma instância antes de escalar.

---

## 3. Gate Go/No-Go para mudanças cirúrgicas

- **Go:** Backup do Supabase (pg_dump ou Dashboard) executado e validado (tamanho, list/restore dry-run); plano de rollback Fly revisado e comando de rollback conhecido (ex.: versão anterior anotada).
- **No-Go:** Backup não realizado ou inválido; ou impossibilidade de rollback (ex.: nenhuma release anterior estável conhecida). Não aplicar alterações de código/deploy em produção até que o gate seja **Go**.

---

## 4. Referência rápida (sem secrets)

| Ação | Comando / observação |
|------|----------------------|
| Backup DB | `pg_dump "$SUPABASE_DB_URL" ... -f backups/FINANCEIRO-prod-backup-YYYYMMDD-HHMM.sql` (URL em env, não no relatório) |
| Listar releases | `flyctl releases -a goldeouro-backend-v2` |
| Rollback Fly | `flyctl releases rollback -a goldeouro-backend-v2 --version N` |
| Health | `GET https://goldeouro-backend-v2.fly.dev/health` |
| Logs | `flyctl logs -a goldeouro-backend-v2 --no-tail` |
