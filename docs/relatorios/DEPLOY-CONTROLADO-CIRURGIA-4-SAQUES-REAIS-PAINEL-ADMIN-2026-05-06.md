# DEPLOY CONTROLADO — CIRURGIA 4 SAQUES REAIS PAINEL ADMIN

**Data:** 2026-05-06  
**Commit alvo:** `ba5478b`  
**Escopo:** publicação controlada de backend + painel admin para fluxo real de saques

---

## 1) Pré-check de repositório

Comandos executados:

- `git status --short`
- `git log --oneline -5`

Confirmação:

- HEAD recente inclui `ba5478b — fix(admin): conectar saques do painel a dados reais`

---

## 2) Deploy backend (Fly)

Comando:

- `flyctl deploy --app goldeouro-backend-v2`

Resultado:

- **Deploy concluído com sucesso**
- App: `goldeouro-backend-v2`
- URL: `https://goldeouro-backend-v2.fly.dev/`
- Monitoramento release: `https://fly.io/apps/goldeouro-backend-v2/monitoring`
- Imagem publicada: `registry.fly.io/goldeouro-backend-v2:deployment-01KQYTK4NJ1CVZM8MCEQFEHG3W`

### Validações de backend

- `GET /health` -> **OK**
- `GET /meta` -> **OK**
- `GET /api/admin/withdraw/list?limit=5` com JWT admin real -> **OK**

**Endpoint list validado:** **SIM**

---

## 3) Deploy painel admin (Vercel)

No diretório `goldeouro-admin`:

- `npm run build` -> **PASSOU**
- `npx vercel --prod --yes` -> **PASSOU**

URLs de deploy:

- Inspect: `https://vercel.com/goldeouro-admins-projects/goldeouro-admin/CMWc527bn4g8n3YmWriAwK9n7BZv`
- Production: `https://goldeouro-admin-fvih0y9fe-goldeouro-admins-projects.vercel.app`

---

## 4) Validação funcional do painel

URLs testadas:

- `https://admin.goldeouro.lol/login`
- `https://admin.goldeouro.lol/painel`
- `https://admin.goldeouro.lol/saque-usuarios`

Credenciais:

- `admin@goldeouro.lol`
- `admin123`

Resultados:

- login real: **PASSOU**
- redirecionamento para `/painel`: **PASSOU**
- `/saque-usuarios`: **PASSOU**
- dados mock fixos (1/2/3 “Usuário”): **NÃO aparecem**
- dados reais/estado real: **SIM**
- `ledger_state` visível na tabela: **SIM** (`COMPENSATED`, `NONE`)

**/saque-usuarios validado:** **SIM**  
**dados mock removidos:** **SIM**

---

## 5) Observações

- No painel (`/painel`) foi observado `404` em endpoint de estatísticas, com fallback para dados vazios.
- Esse ponto não impacta o escopo desta cirurgia (saques reais), mas permanece pendência para módulo de dashboard.

---

## 6) Conclusão

- **Release Fly:** publicado e saudável
- **Endpoint real de listagem:** validado em produção com JWT admin
- **Tela `/saque-usuarios`:** validada com dados reais e `ledger_state`

**Decisão:** **GO** para próximo módulo.

---

**Fim do relatório.**
