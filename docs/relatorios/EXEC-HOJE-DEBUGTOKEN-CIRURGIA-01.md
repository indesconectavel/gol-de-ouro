# Execução de hoje — Cirurgia 01 do bloqueio de /api/debug/token

**Data:** 2026-03-27

---

## 1. Resumo executivo

Foi adicionado um **retorno imediato** na rota `GET /api/debug/token` quando `process.env.NODE_ENV === 'production'`: resposta **HTTP 404** via `res.sendStatus(404)`, **sem** executar o corpo legado (sem logs de debug, sem JSON com headers/token/claims). Fora de produção, o comportamento anterior da rota **permanece** para depuração local.

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `server-fly.js` | Guard no início do handler `GET /api/debug/token`. |
| `docs/relatorios/EXEC-HOJE-DEBUGTOKEN-CIRURGIA-01.md` | Este relatório. |

---

## 3. Estratégia aplicada

- **Condição:** `process.env.NODE_ENV === 'production'`.
- **Ação:** `return res.sendStatus(404)` antes de qualquer acesso a `Authorization`, `jwt.verify`, ou `console.log` da rota.
- **Sem** novo middleware, **sem** alteração em outras rotas, **sem** dependência de WAF/proxy.

---

## 4. Comportamento antigo

Rota **pública** (sem `authenticateToken`): sem Bearer respondia **401** com `req.headers` no JSON; com JWT válido devolvia **claims** completas e prefixo do token; logs com headers e token no console.

---

## 5. Comportamento novo

| Ambiente | Comportamento |
|----------|----------------|
| **`NODE_ENV === 'production'`** | **404** (corpo padrão do Express para 404). Nenhuma execução do bloco legado. |
| **Demais** (`development`, `undefined`, etc.) | Igual ao anterior (debug com logs e respostas com `debug`). |

---

## 6. O que NÃO foi alterado

- Autenticação, PIX, saque, shoot, gameplay, webhooks, Supabase, Mercado Pago, CORS.
- `GET /usuario/perfil`, `GET /api/production-status`, `GET /health`, `GET /api/metrics` e demais rotas.
- Qualquer outro `console.log` fora deste handler.

---

## 7. Como testar

1. **Definir** `NODE_ENV=production` e subir o servidor (ou simular o mesmo ambiente do deploy).
2. **Chamar** `GET /api/debug/token` **sem** header `Authorization` → esperar **404** (não 401 com `debug.headers`).
3. **Chamar** `GET /api/debug/token` **com** `Authorization: Bearer <jwt válido>` → esperar **404** (não 200 com `decoded`).
4. **Confirmar** nos logs que **não** aparecem linhas `🔍 [DEBUG]` desta rota para essas requisições em produção.
5. **Opcional:** com `NODE_ENV=development`, confirmar que o comportamento de debug ainda existe (apenas para validar o não-regresso).

---

## 8. Riscos residuais

- **Deploy:** a proteção só vale no ambiente onde `NODE_ENV` é **realmente** `production` após deploy; se algum host rodar produção sem essa variável, o caminho legado ainda pode ser atingido.
- **Outros caminhos:** bloqueio de borda (WAF) ou hardening adicional não fazem parte desta cirurgia.
- **Rota ainda registrada:** o path continua mapeado no Express; apenas responde 404 em produção (não remove o registro da rota, o que é aceitável e mínimo).

---

## 9. Conclusão

A **cirurgia** cumpre o objetivo: em **produção**, `/api/debug/token` **não** expõe claims, headers, token nem logs sensíveis deste handler; o restante do backend **não** foi refatorado. **Pronto para validação** após deploy com `NODE_ENV=production` e smoke test da rota.

---

*Fim do relatório.*
