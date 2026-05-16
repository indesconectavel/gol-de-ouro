# DEPLOY CONTROLADO — AUTH REAL PAINEL ADMIN

**Data:** 2026-05-06  
**Projeto:** `goldeouro-admin`  
**Escopo:** deploy somente do painel admin com cirurgia de autenticação JWT real

---

## 1) Pré-check do projeto

No diretório `goldeouro-admin`:

- `git status --short` retornou:
  - `M vercel.json`

Obs.: estado já existente no subprojeto, preservado durante o deploy.

---

## 2) Build local

Comando:

- `npm run build`

Resultado:

- **PASSOU** (`vite build` concluído com sucesso)

---

## 3) Deploy produção (Vercel)

Comando:

- `vercel --prod --yes`

Resultado:

- **PASSOU** (exit code 0)
- Inspect URL: `https://vercel.com/goldeouro-admins-projects/goldeouro-admin/8WiQL21HmDakFAedDLthkR2Jm6aA`
- Deployment URL: `https://goldeouro-admin-lqwoc5jmq-goldeouro-admins-projects.vercel.app`

---

## 4) Validação funcional em produção

URLs validadas:

1. `https://admin.goldeouro.lol/`
2. `https://admin.goldeouro.lol/login`
3. `https://admin.goldeouro.lol/painel`

### Resultado por URL

- `/` -> redireciona para `/login` (**OK**)
- `/login` -> carrega tela de login (**OK**)
- `/painel` sem token -> redireciona para `/login` (**OK**)

---

## 5) Teste de login real

Credenciais testadas:

- `admin@goldeouro.lol`
- `admin123`

Resultado:

- **FALHOU** (erro de conexão bloqueado por CSP no frontend em produção)

Evidência observada:

- tentativa de conexão para URL com `%20` antes de `/api/auth/login`
- bloqueio de `connect-src` por CSP para domínio fora da allowlist esperada

Impacto:

- token JWT não foi emitido/salvo no cliente nesse fluxo de teste
- não foi possível completar validação de pós-login e logout com sessão autenticada

---

## 6) Checklist solicitado

- Build passou/falhou: **PASSOU**
- Deploy produção: **PASSOU**
- URLs validadas: **SIM**
- Login passou/falhou: **FALHOU**
- Token JWT salvo no localStorage: **NÃO**
- Redirecionamento para `/painel` após login: **NÃO VALIDADO** (login falhou)
- Logout remove token: **NÃO VALIDADO** (login falhou)
- Acesso sem token redireciona para `/login`: **SIM**

---

## 7) Decisão GO/NO-GO

**NO-GO** para próxima etapa de integração funcional em produção até corrigir configuração de runtime/frontend de produção (URL alvo e CSP de `connect-src`) que está bloqueando a chamada de login real.

---

**Fim do relatório.**
