# DEPLOY CONTROLADO — CIRURGIA 5 DASHBOARD REAL

**Data:** 2026-05-06  
**Commit alvo:** `ae7717c`  
**Escopo:** publicar backend + painel admin e validar dashboard real

---

## 1) Pré-check de repositório

Comandos executados:

- `git status --short`
- `git log --oneline -5`

Confirmação:

- commit `ae7717c — fix(admin): conectar dashboard a dados reais` está no topo do histórico local.

---

## 2) Deploy backend (Fly)

Comando:

- `flyctl deploy --app goldeouro-backend-v2`

Resultado:

- **Deploy concluído**
- Release/Imagem: `deployment-01KQYZ9V4T8T6VA018ANJ451Y0`
- App: `goldeouro-backend-v2`
- URL: `https://goldeouro-backend-v2.fly.dev/`

### Validações backend

- `GET /health` -> **OK**
- `GET /meta` -> **OK**
- `GET /api/admin/dashboard/stats` com JWT admin -> **OK**

Resposta validada (exemplo real):

- `total_users`: 464
- `saldo_total`: 169101.5
- `saques_pendentes`: 0
- `saques_total`: 22
- `ledger_transacoes_total`: 61
- `volume_financeiro_total`: 157
- `updated_at`: timestamp ISO

**Endpoint dashboard validado:** **SIM**

---

## 3) Deploy painel admin (Vercel)

No diretório `goldeouro-admin`:

- `npm run build` -> **PASSOU**
- `npx vercel --prod --yes` -> **PASSOU**

URLs:

- Inspect: `https://vercel.com/goldeouro-admins-projects/goldeouro-admin/6rxAp4VGYESCyB4cW5ZyTkmEqUWW`
- Production: `https://goldeouro-admin-8mvybn6ai-goldeouro-admins-projects.vercel.app`

---

## 4) Validação funcional em produção

URLs validadas:

- `https://admin.goldeouro.lol/login`
- `https://admin.goldeouro.lol/painel`

Fluxo:

- `/login` carrega -> **SIM**
- login admin (`admin@goldeouro.lol` / `admin123`) -> **SIM**
- redireciona para `/painel` -> **SIM**
- dashboard mostra métricas reais -> **SIM**
- fallback silencioso de zeros com sucesso de API -> **NÃO detectado na sessão autenticada**
- erro real em falha -> **SIM** (mensagem de credenciais inválidas exibida)

### Evidência visual do painel

Métricas observadas no `/painel`:

- Total de Usuários: 464
- Saldo Total: R$ 169.101,50
- Saques Pendentes: 0
- Total de Saques: 22
- Transações Ledger: 61
- Volume Financeiro: R$ 157,00

---

## 5) Conclusão

- **Release Fly:** concluída
- **Endpoint dashboard validado:** **SIM**
- **Deploy Vercel URL:** `https://goldeouro-admin-8mvybn6ai-goldeouro-admins-projects.vercel.app`
- **`/painel` validado:** **SIM**
- **Métricas reais:** **SIM**

**GO/NO-GO para próximo módulo:** **GO**

---

**Fim do relatório.**
