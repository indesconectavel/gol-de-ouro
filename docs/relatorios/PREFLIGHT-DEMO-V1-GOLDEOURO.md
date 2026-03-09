# Pre-Flight Demo V1 — Gol de Ouro

**Tipo:** Auditoria READ-ONLY (sem alteração de código, deploy ou banco).  
**Data:** 2026-03-06.  
**Objetivo:** Garantir que o ambiente esteja pronto para a apresentação da V1 aos sócios.

---

## 1) Resumo executivo

- **Site:** Disponível; páginas principais retornam conteúdo (login quando não autenticado).
- **Backend:** Disponível; health retorna `ok`, database e Mercado Pago conectados (v1.2.1).
- **Endpoints essenciais:** Mapeados e ativos (auth, perfil, depósito PIX, chute, saque).
- **Página do jogo:** Estrutura confirmada no código; com login o jogo carrega e chama `/api/games/shoot`.
- **Sistema financeiro:** Endpoints ativos; validações de saldo e chave PIX presentes no backend.
- **Riscos:** Identificados 7 itens (1 alto, 4 médios, 2 baixos); principal: dependência Mercado Pago e possível inconsistência na tela de saque do frontend.

**Resultado:** **PASS** com ressalvas — demo pode ser realizada; recomenda-se executar o checklist pré-reunião e confirmar o fluxo de saque no frontend antes da apresentação.

---

## 2) Estado do site

| URL | Status | Observação |
|-----|--------|------------|
| https://www.goldeouro.lol | OK | Página de login exibida. |
| https://www.goldeouro.lol/game | OK | Sem login → redireciona para login. |
| https://www.goldeouro.lol/dashboard | OK | Sem login → redireciona para login. |

- Todas as URLs retornaram conteúdo (HTTP 200 assumido).
- Tempo de resposta não medido nesta auditoria (read-only).
- Nenhum erro de carregamento detectado nas verificações realizadas.

*Detalhes em:* `docs/relatorios/preflight-demo-site.json`

---

## 3) Estado do backend

| Item | Valor |
|------|--------|
| URL | https://goldeouro-backend-v2.fly.dev/health |
| Status | ok |
| Versão | 1.2.1 |
| Database | connected |
| Mercado Pago | connected |
| Contador chutes | 220 |
| Último Gol de Ouro | 0 |

- Endpoints públicos testados: `/`, `/health`, `/meta`, `/api/metrics` — todos retornando JSON válido.
- Dependências essenciais (banco e Mercado Pago) indicadas como conectadas.

*Detalhes em:* `docs/relatorios/preflight-demo-backend.json`

---

## 4) Endpoints verificados

Endpoints usados na demo, mapeados no código e/ou verificados em leitura:

| Categoria | Método | Rota | Auth | Status |
|-----------|--------|------|------|--------|
| Autenticação | POST | /api/auth/register | Não | Ativo |
| Autenticação | POST | /api/auth/login | Não | Ativo |
| Perfil/Saldo | GET | /api/user/profile | Sim | Ativo |
| Depósito | POST | /api/payments/pix/criar | Sim | Ativo |
| Depósito | GET | /api/payments/pix/usuario | Sim | Ativo |
| Jogo | POST | /api/games/shoot | Sim | Ativo |
| Saque | POST | /api/withdraw/request | Sim | Ativo |
| Saque | GET | /api/withdraw/history | Sim | Ativo |
| Health | GET | /health | Não | Verificado |

- Endpoints protegidos exigem header `Authorization: Bearer <token>`.
- Nenhuma alteração de código ou deploy foi feita; apenas leitura e chamadas GET em rotas públicas.

*Detalhes em:* `docs/relatorios/preflight-demo-endpoints.json`

---

## 5) Estado da página do jogo

- **URL:** https://www.goldeouro.lol/game  
- **Sem login:** redireciona para login (comportamento esperado).
- **Com login (fluxo esperado):** página do jogo carrega; no código do frontend estão presentes:
  - Campo, goleiro, bola, botões de chute (direções TL, TR, C, BL, BR).
  - Valores de aposta: R$ 1, 2, 5, 10.
  - Chamada ao endpoint de chute: `POST /api/games/shoot` com `direction` e `amount`.

Erros de console e de API na sessão logada não foram reproduzidos (auditoria read-only, sem credenciais).

*Detalhes em:* `docs/relatorios/preflight-demo-game.json`

---

## 6) Estado do sistema financeiro

- **Depósito PIX:** `POST /api/payments/pix/criar` ativo; valida valor (1–1000) e usa Mercado Pago.
- **Saldo:** obtido via `GET /api/user/profile` (campo `saldo`).
- **Saque:** `POST /api/withdraw/request` com validação de valor mínimo (R$ 10), saldo e chave PIX (PixValidator); ledger e rollback em falha.
- **Histórico de saques:** `GET /api/withdraw/history`.

Nenhuma transação financeira real foi executada.

*Detalhes em:* `docs/relatorios/preflight-demo-finance.json`

---

## 7) Riscos para a demonstração

| ID | Risco | Classificação | Mitigação |
|----|--------|----------------|-----------|
| R1 | Atraso na confirmação do PIX | Médio | Avisar sócios; usar Plano B (mostrar QR sem pagamento real). |
| R2 | Saldo insuficiente para chute/saque | Baixo | Conta demo com saldo ou depósito PIX baixo antes. |
| R3 | Sessão expirada durante a demo | Médio | Login próximo ao início; conexão estável. |
| R4 | Latência da API | Médio | Boa conexão; health verificado. |
| R5 | Mercado Pago indisponível | Alto | Plano B sem PIX real; não alterar código/deploy. |
| R6 | Tela de saque usar endpoint de depósito | Médio | Confirmar em produção se saque chama /api/withdraw/request. |
| R7 | Chave PIX inválida no saque | Baixo | Usar chave válida; erro é esperado para inválida. |

*Detalhes em:* `docs/relatorios/preflight-demo-riscos.json`

---

## 8) Checklist pré-reunião

Executar antes da apresentação (ordem sugerida):

- [ ] Abrir o site: https://www.goldeouro.lol  
- [ ] Testar login (conta demo ou criada previamente)  
- [ ] Verificar saldo no dashboard/perfil  
- [ ] Abrir a página do jogo (/game) e confirmar campo, goleiro, bola e botões  
- [ ] Testar um chute (valor e direção) e conferir resultado e saldo  
- [ ] Abrir tela de saque e conferir formulário e histórico (sem executar saque real se não for o plano)  
- [ ] (Opcional) Verificar health do backend: https://goldeouro-backend-v2.fly.dev/health  

---

## 9) Conclusão

- A auditoria foi **somente leitura**: nenhum código, commit, deploy, banco ou transação financeira foi alterado ou executado.
- **Site e backend estão disponíveis;** endpoints essenciais estão mapeados e ativos; estrutura do jogo e fluxo financeiro conferidos no código.
- **Riscos críticos:** 1 alto (Mercado Pago) e 1 médio (possível uso de endpoint de depósito na tela de saque). Recomenda-se validar o fluxo de saque no frontend em produção antes da demo.

**Recomendação final:** **Demo pronta**, com ajustes recomendados: executar checklist pré-reunião, confirmar integração da tela de saque com `/api/withdraw/request` e ter Plano B para PIX (conforme ROTEIRO-DEMO-V1-GOLDEOURO.md).

---

*Relatório gerado por auditoria PRE-FLIGHT READ-ONLY. Arquivos JSON em docs/relatorios/preflight-demo-*.json.*
