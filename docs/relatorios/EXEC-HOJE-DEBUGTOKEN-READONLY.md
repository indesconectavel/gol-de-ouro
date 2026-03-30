# Execução de hoje — auditoria READ-ONLY: `/api/debug/token`

**Data:** 2026-03-27  
**Escopo:** análise estática do backend; **sem** alteração de código, patch ou deploy.

---

## 1. Localização do endpoint

| Item | Valor |
|------|--------|
| **Arquivo** | `server-fly.js` |
| **Rota** | `GET /api/debug/token` |
| **Registro** | `app.get('/api/debug/token', (req, res) => { ... })` imediatamente após o handler de `GET /api/production-status` e antes de `GET /usuario/perfil`. |

**Busca no repositório:** a string `/api/debug/token` aparece **apenas** em `server-fly.js` (definição da rota) e em documentação; não há segundo handler em outros `.js` do backend para o mesmo path.

---

## 2. Dados expostos

O handler **não** usa o middleware `authenticateToken`. Ele lê manualmente `Authorization: Bearer <token>`.

**Comportamento por caso:**

1. **Sem token (sem header `Authorization` ou sem Bearer)**  
   - Resposta **401** com corpo incluindo `debug`: `authHeader`, `token`, e **`headers: req.headers`** — ou seja, **eco dos cabeçalhos HTTP completos da requisição** no JSON.

2. **Token presente e JWT válido (`jwt.verify` com `JWT_SECRET`)**  
   - Resposta **200** com `success: true`, `message`, e `debug` contendo:  
     - **`decoded`**: payload JWT **completo** (claims, ex.: `userId`, `email`, exp, etc., conforme emissão do login).  
     - `authHeader`  
     - `token`: **primeiros 20 caracteres** do JWT + `'...'` (prefixo útil para correlacionar sessões).

3. **Token presente mas inválido ou expirado**  
   - Resposta **403** com `debug`: mensagem de erro, `authHeader`, e prefixo de 20 caracteres do token.

**Logs no servidor:** para **qualquer** chamada, o código faz `console.log` de **todos** os `req.headers`, do `authHeader` e do token extraído — aumentando superfície de vazamento em ambientes onde logs são amplamente acessíveis.

---

## 3. Estado atual de segurança

| Pergunta | Resposta objetiva |
|----------|-------------------|
| **É “público”?** | **Sim**, no sentido de **não haver** `authenticateToken` nem checagem de papel (admin). Qualquer cliente HTTP que alcance a origem do API pode invocar a rota. |
| **Exige “login” no sentido de Bearer?** | Para obter o payload decodificado, **precisa** enviar um Bearer JWT; porém **não** há verificação de que o chamador seja o dono legítimo — quem já tiver um token (vazado, interceptado) obtém os **mesmos** dados. |
| **Há middleware / feature flag / env dedicado nesta rota?** | **Não.** Não há `if (process.env.NODE_ENV === 'production')`, variável tipo `ENABLE_DEBUG_ROUTES`, nem restrição por IP neste bloco. (O arquivo usa `NODE_ENV` em **outros** trechos, p.ex. webhook Mercado Pago, mas **não** aqui.) |
| **Risco principal** | Informação sensível: **claims JWT** em claro; em falta de token, **vazamento de cabeçalhos** via `req.headers` na resposta 401; prefixo do token + logs verbosos facilitam engenharia e correlação. |

---

## 4. Melhor estratégia mínima de bloqueio

Ordem sugerida do **menor risco operacional** para o contexto “teste financeiro hoje” (combinar camadas quando possível):

| Opção | O que é | Prós | Contras |
|-------|---------|------|---------|
| **A — Bloqueio na borda (proxy / Fly / WAF)** | Negar `GET /api/debug/token` (ou `/api/debug/*`) antes de chegar ao Node. | **Zero mudança de código**; rollback = remover regra. | Precisa de acesso ao painel/rede; documentar para não esquecer rota ainda “viva” no app. |
| **B — Resposta 404/410 só em produção** | No mesmo arquivo, envolver o handler com `if (process.env.NODE_ENV !== 'production')` ou retornar `404` cedo em produção. | Mudança **mínima** e localizada; mantém debug em dev se desejado. | Exige **deploy** para valer em produção. |
| **C — Remover o bloco da rota** | Apagar o `app.get('/api/debug/token', ...)`. | Elimina superfície no processo; sem condição de ambiente a manter. | Exige deploy; perde atalho de debug até substituir por ferramenta segura. |
| **D — Proteger com auth admin** | Só depois de existir middleware confiável de admin no mesmo servidor. | Alinhado a modelo “só staff”. | **Não** está pronto como “mínimo de hoje” se não houver middleware/admin já padronizado nesta rota. |

**Síntese:** a forma **mínima sem tocar código** é **bloqueio na borda** (A). A forma **mínima no código** com menor superfície é **404/410 em produção** (B) ou **remoção** (C), ambas exigindo deploy para refletir no ambiente remoto.

---

## 5. Riscos de alterar hoje

- **Só infra (A):** risco baixo se a regra for testada com `curl` após aplicar; risco de **falso sentimento de segurança** se o bloqueio for só em um host e outro (staging) ficar aberto.  
- **Deploy de código (B/C):** risco clássico de **erro de sintaxe** ou merge; mitigação: revisar diff pequeno e smoke (`/health`, login, um fluxo crítico).  
- **Não alinhar ambientes:** bloquear em produção mas deixar preview/staging com debug ativo pode vazar tokens de teste — alinhar política por URL.

---

## 6. Recomendação objetiva

1. **Confirmar** com uma requisição controlada (ex.: sem Bearer) que a rota responde como descrito na secção 2 — especialmente o eco de **`req.headers`** no 401.  
2. **Para o teste financeiro de hoje:** aplicar **bloqueio na borda** se disponível **em paralelo** a planejar **uma** mudança de código (404 em produção ou remoção) no próximo deploy, para não depender só de proxy.  
3. **Não** depender de “precisa Bearer” como segurança: a rota continua **anônima** em termos de identidade do chamador e **vaza dados** com token válido ou cabeçalhos na ausência de token.

---

*Auditoria baseada no trecho atual de `server-fly.js` (~linhas 2625–2671). Qualquer alteração futura no arquivo deve ser revalidada.*
