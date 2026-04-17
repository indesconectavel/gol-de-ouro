# Preparação de promoção — backend idempotência `POST /api/games/shoot`

**Data:** 2026-04-16  
**Modo:** preparação automática controlada (sem SQL, sem frontend, sem novo teste funcional).  
**Escopo-alvo:** exclusivamente `server-fly.js` no bloco da rota `POST /api/games/shoot`.

---

## 1) Objetivo operacional desta etapa

Isolar e deixar pronto para promoção o menor conjunto backend necessário para ativar idempotência no runtime:

1. leitura de `x-idempotency-key` / `idempotency-key`;
2. envio de `p_idempotency_key` para `supabase.rpc('shoot_apply', ...)`;
3. exposição de `idempotentReplay` na resposta HTTP;
4. tratamento de erros de conflito/validação de chave de idempotência.

---

## 2) Estado real do working tree no início

Arquivos modificados rastreados (`git diff --name-only`):

- `database/shoot_apply_atomic_transaction.sql`
- `docs/relatorios/PREPARACAO-AUTOMATICA-FLUXO-JOGADOR-2026-04-02.md`
- `goldeouro-player/src/services/gameService.js`
- `server-fly.js`

Além disso, há muitos arquivos não rastreados em `docs/`.

**Decisão de isolamento:** não tocar nos diffs paralelos; promover apenas o delta mínimo em `server-fly.js`.

---

## 3) Escopo mínimo confirmado em `server-fly.js`

`git diff -- server-fly.js` mostrou apenas os blocos relevantes à idempotência:

- captura de header:
  - `req.headers['x-idempotency-key']`
  - `req.headers['X-Idempotency-Key']`
  - `req.headers['idempotency-key']`
- normalização/corte da chave (`slice(0, 200)`);
- montagem de `shootRpcArgs` com adição condicional:
  - `shootRpcArgs.p_idempotency_key = idempotencyKey`;
- novas respostas de erro:
  - `SHOOT_APPLY_IDEMPOTENCY_KEY_INVALIDA` -> `400`
  - `SHOOT_APPLY_IDEMPOTENCY_CONFLITO` -> `409`
- mapeamento de replay:
  - `const idempotentReplay = !!rpcPayload.idempotent_replay;`
  - inclusão em `shootResult`.

**Sem alteração detectada** nesse diff em SQL, frontend ou outros endpoints.

---

## 4) Resultado da preparação para promoção

A etapa deixou pronto o pacote mínimo de backend para commit/push/PR/deploy com rastreabilidade:

- arquivo de código-alvo: `server-fly.js`;
- arquivo de evidência desta etapa: `docs/relatorios/PREPARACAO-PROMOCAO-BACKEND-IDEMPOTENCIA-SHOOT-2026-04-16.md`.

Os demais arquivos modificados no working tree permanecem fora do escopo e não devem entrar neste pacote.

---

## 5) Proposta de commit limpo (próxima ação)

### 5.1 Arquivos que devem entrar no commit

- `server-fly.js`
- `docs/relatorios/PREPARACAO-PROMOCAO-BACKEND-IDEMPOTENCIA-SHOOT-2026-04-16.md`

### 5.2 Mensagem sugerida

`fix(shoot): ativar idempotency key no runtime e expor idempotentReplay`

### 5.3 Título sugerido de PR

`fix(runtime): alinhar idempotência do /api/games/shoot no backend Fly`

---

## 6) Gate de segurança antes de merge/deploy

Checklist mínimo para não misturar escopo:

- [ ] `git diff --cached --name-only` contém só `server-fly.js` e este relatório;
- [ ] `git diff --cached server-fly.js` contém apenas os blocos de idempotência listados na secção 3;
- [ ] nenhum arquivo SQL/frontend staged;
- [ ] run de deploy backend em `main` concluído com prova de release;
- [ ] após deploy, executar prova de runtime (não realizada nesta etapa por restrição do pedido).

---

## 7) Conclusão

A preparação está concluída em modo cirúrgico: escopo mínimo identificado e documentado para promoção de idempotência no backend, sem tocar em SQL/frontend e sem repetir testes funcionais nesta fase.

