# DEPLOY CONTROLADO — CIRURGIA 3 SAQUE MANUAL

**Data:** 2026-05-06  
**Commit alvo:** `e03be1017d03be294ec1124daacfdb5d220ded94`  
**App Fly:** `goldeouro-backend-v2`

## 1) Pré-check de branch/HEAD

- `git status --short` executado (working tree com arquivos não rastreados e subdiretório `goldeouro-admin` modificado, sem bloquear deploy do backend).
- `git log --oneline -5` executado.
- `git rev-parse HEAD` confirmou:
  - **HEAD = `e03be1017d03be294ec1124daacfdb5d220ded94`** ✅

## 2) Deploy controlado no Fly

Comando executado:

- `fly deploy --config fly.toml`

Resultado:

- Deploy concluído com sucesso.
- Release ativa: **`v441`**.
- Imagem ativa: **`goldeouro-backend-v2:deployment-01KQYBK29R01RAHPNA169VA359`**.
- Machines iniciadas:
  - `app`: `080e207b071048` (version 441)
  - `payout_worker`: `784e047bd04e08` (version 441)

## 3) Validação pós-deploy

### 3.1 Fly releases

- `fly releases --app goldeouro-backend-v2`
- Top release:
  - **`v441`** — `complete` — deploy recente ✅

### 3.2 Logs iniciais

- `fly logs --app goldeouro-backend-v2 --no-tail`
- Evidências relevantes:
  - startup do app concluído (`Servidor iniciado na porta 8080`);
  - healthcheck inicialmente falhou durante boot e passou em seguida (`is now passing`);
  - sem erro fatal pós-start;
  - worker de payout em `PAYOUT_MODE=manual` ativo sem falha crítica.

### 3.3 Endpoint `/health`

- `GET https://goldeouro-backend-v2.fly.dev/health`
- Resultado:
  - HTTP **200**
  - payload com `status: "ok"`, `database: "connected"`, `mercadoPago: "connected"` ✅

### 3.4 Endpoint `/meta`

- `GET https://goldeouro-backend-v2.fly.dev/meta`
- Resultado:
  - HTTP **200**
  - `version: "1.2.1"`
  - `gitCommit: null`

## 4) Commit/runtime confirmado?

- **Parcialmente confirmado**:
  - Confirmado que o deploy saiu do ambiente com HEAD no commit alvo.
  - Confirmado release/imagem nova em produção (`v441` + `deployment-01KQYBK29R01RAHPNA169VA359`).
- **Limitação**:
  - `/meta` não expõe hash git (`gitCommit: null`), então não há prova runtime direta por endpoint para o SHA alvo.

## 5) Parecer operacional

- **GO** para smoke test de approve/cancel manual (escopo Cirurgia 3), pois:
  - deploy concluído,
  - app saudável (`/health` 200),
  - `/meta` 200,
  - logs sem erro crítico pós-inicialização.
- **NO-GO** apenas se exigir rastreabilidade estrita de SHA via runtime antes de smoke test; nesse caso, ajustar `/meta` para publicar commit em próxima janela controlada.
