# MAPA DE ENDPOINTS — V1 GOL DE OURO

**Modo:** READ-ONLY técnico.  
**Fonte:** `server-fly.js` (entrypoint `Dockerfile`), `routes/adminApiFly.js`, `routes/analyticsIngest.js`.  
**Data:** 2026-03-29  

**Legenda — auth**

- **Público:** sem `authenticateToken` nem `x-admin-token`.  
- **JWT:** `Authorization: Bearer` + `JWT_SECRET` (`authenticateToken` em `server-fly.js`).  
- **Admin:** header **`x-admin-token`** = `ADMIN_TOKEN` (≥ 16 caracteres), exceto onde indicado.  

**Legenda — usado por**

- **Player:** `goldeouro-player` (ou cliente equivalente).  
- **Admin:** `goldeouro-admin` ou ferramentas com `x-admin-token`.  
- **MP:** Mercado Pago (webhook).  
- **—:** operador, healthcheck, ou não mapeado a um SPA oficial.  

**Legenda — risco** (impacto × exposição, alinhado às auditorias de superfície)

- **Baixo:** metadados mínimos ou só leitura anónima sem dados sensíveis de negócio.  
- **Médio:** auth pública, dados de utilizador autenticado, ou vazamento operacional limitado.  
- **Alto:** dinheiro, dados agregados sensíveis, superfície de abuso ampla, ou admin/exportação.

---

## `/api/auth`

| Rota | Método | Auth | Usado por | Risco |
|------|--------|------|-----------|-------|
| `/api/auth/register` | POST | Público | Player | Médio |
| `/api/auth/login` | POST | Público | Player | Médio |
| `/api/auth/forgot-password` | POST | Público | Player | Médio |
| `/api/auth/reset-password` | POST | Público | Player | Médio |
| `/api/auth/verify-email` | POST | Público | Player / fluxo email | Médio |
| `/api/auth/change-password` | PUT | JWT | Player | Médio |

---

## `/api/games`

| Rota | Método | Auth | Usado por | Risco |
|------|--------|------|-----------|-------|
| `/api/games/shoot` | POST | JWT | Player | **Alto** (aposta / saldo / lote) |

---

## `/api/payments`

| Rota | Método | Auth | Usado por | Risco |
|------|--------|------|-----------|-------|
| `/api/payments/pix/criar` | POST | JWT | Player | **Alto** |
| `/api/payments/pix/usuario` | GET | JWT | Player | Médio |
| `/api/payments/webhook` | POST | Público (HMAC opcional via `MERCADOPAGO_WEBHOOK_SECRET`) | MP | **Alto** sem secret; Médio com secret e MP válido |

---

## `/api/withdraw`

| Rota | Método | Auth | Usado por | Risco |
|------|--------|------|-----------|-------|
| `/api/withdraw/request` | POST | JWT | Player | **Alto** |
| `/api/withdraw/history` | GET | JWT | Player | Médio |

---

## `/api/admin`

Montagem: `app.use('/api/admin', createAdminRouter(...))`. **Todas** as rotas abaixo passam por `authAdminToken` (**Admin**), exceto quando o bootstrap é tratado à parte.

| Rota | Método | Auth | Usado por | Risco |
|------|--------|------|-----------|-------|
| `/api/admin/stats` | GET | Admin | Admin | Alto |
| `/api/admin/usuarios` | GET | Admin | Admin | Alto |
| `/api/admin/usuarios-bloqueados` | GET | Admin | Admin | Alto |
| `/api/admin/usuarios/:id/reativar` | POST | Admin | Admin | Alto |
| `/api/admin/usuarios/:id` | GET | Admin | Admin | Alto |
| `/api/admin/relatorios/usuarios` | GET | Admin | Admin | Alto |
| `/api/admin/relatorios/financeiro` | GET | Admin | Admin | Alto |
| `/api/admin/relatorios/geral` | GET | Admin | Admin | Alto |
| `/api/admin/relatorios/semanal` | GET | Admin | Admin | Alto |
| `/api/admin/transacoes` | GET | Admin | Admin | Alto |
| `/api/admin/saques` | GET | Admin | Admin | Alto |
| `/api/admin/logs` | GET | Admin | Admin | Médio |
| `/api/admin/chutes` | GET | Admin | Admin | Médio |
| `/api/admin/top-jogadores` | GET | Admin | Admin | Médio |
| `/api/admin/fila` | GET | Admin | Admin | Médio |
| `/api/admin/lotes` | GET | Admin | Admin | Médio |
| `/api/admin/configuracoes` | GET | Admin | Admin | Médio |
| `/api/admin/configuracoes` | POST | Admin | Admin | **Alto** (altera settings persistidos) |
| `/api/admin/exportacao` | GET | Admin | Admin | **Alto** |
| `/api/admin/backup` | GET | Admin | Admin | Alto |
| `/api/admin/backup` | POST | Admin | Admin | **Alto** |

**Bootstrap (não passa pelo `router.use(authAdminToken)` do ficheiro admin):**

| Rota | Método | Auth | Usado por | Risco |
|------|--------|------|-----------|-------|
| `/api/admin/bootstrap` | POST | JWT | Operação (primeiro admin) | **Alto** (elevação em janela “zero admins”) |

---

## `/api/monitoring` e métricas associadas

| Rota | Método | Auth | Usado por | Risco |
|------|--------|------|-----------|-------|
| `/api/monitoring/metrics` | GET | Público | — / monitorização externa | **Alto** (memória, CPU, PID, contadores de pedidos) |
| `/api/monitoring/health` | GET | Público | — | **Alto** (estado DB, MP, memória, requests) |
| `/api/metrics` | GET | Público | Player (parcial; contrato pode divergir) | Médio (contagem utilizadores; totais de chute no payload podem estar zerados no código atual) |

---

## Outros endpoints (`server-fly.js`)

### Perfil de utilizador (fora de `/api/auth`)

| Rota | Método | Auth | Usado por | Risco |
|------|--------|------|-----------|-------|
| `/api/user/profile` | GET | JWT | Player | Médio |
| `/api/user/profile` | PUT | JWT | Player | Médio |
| `/usuario/perfil` | GET | JWT | Player / legado | Médio |

### Autenticação duplicada

| Rota | Método | Auth | Usado por | Risco |
|------|--------|------|-----------|-------|
| `/auth/login` | POST | Público | Clientes legados | Médio |

### Fila (compatibilidade)

| Rota | Método | Auth | Usado por | Risco |
|------|--------|------|-----------|-------|
| `/api/fila/entrar` | GET | JWT | Player / legado | Baixo |

### Estado, diagnóstico e raiz

| Rota | Método | Auth | Usado por | Risco |
|------|--------|------|-----------|-------|
| `/` | GET | Público | — | Baixo |
| `/health` | GET | Público | Fly / balanceador | **Alto** (inclui `contadorChutes`, `ultimoGolDeOuro`, flags DB/MP) |
| `/ready` | GET | Público | Orquestração | Baixo |
| `/meta` | GET | Público | — | Baixo |
| `/robots.txt` | GET | Público | Crawlers | Baixo |
| `/api/production-status` | GET | Público | — | Médio |
| `/api/debug/token` | GET | Público | Dev | **Alto** fora de `NODE_ENV=production` (404 em produção no código) |

### Analytics (router montado)

| Rota | Método | Auth | Usado por | Risco |
|------|--------|------|-----------|-------|
| `/api/analytics` | POST | Público | Player (`sendBeacon` / analytics) | Médio (spam / logs) |

*(Express: `app.use('/api/analytics', router)` com `router.post('/')` → POST em `/api/analytics`.)*

---

## Resumo por tipo de auth

| Tipo | Quantidade (aprox.) | Observação |
|------|---------------------|------------|
| Público | Auth, webhook, health, monitoring, métricas, analytics, raiz, meta, production-status, debug (condicional) | Webhook e monitoring concentram risco. |
| JWT | Perfil, shoot, withdraw, PIX criar/listar, change-password, bootstrap, fila, `/usuario/perfil`, `/auth/login` espelho | Payload `userId` no token. |
| Admin (`x-admin-token`) | Todas as rotas em `adminApiFly.js` exceto bootstrap | `ADMIN_TOKEN` obrigatório e ≥ 16 chars. |

---

## Notas

- **Não** estão incluídos routers não montados em `server-fly.js` (`routes/paymentRoutes.js`, `routes/gameRoutes.js`, etc.).  
- Métodos **OPTIONS** podem ser gerados por middlewares CORS; não listados explicitamente.  
- Riscos assumem **produção** com secrets corretos; webhook **sem** `MERCADOPAGO_WEBHOOK_SECRET` aumenta risco do POST `/api/payments/webhook` para **Alto** em qualquer ambiente exposto.

---

*Fim do mapa.*
