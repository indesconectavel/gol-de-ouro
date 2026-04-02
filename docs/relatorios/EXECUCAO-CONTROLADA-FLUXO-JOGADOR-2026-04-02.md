# EXECUÇÃO CONTROLADA — FLUXO DO JOGADOR

**Data:** 2026-04-02 (America/São Paulo, horários locais onde aplicável)  
**Escopo do commit:** apenas arquivos da cirurgia (sem migração GameFinal/App/CSS paralela). Na branch `HEAD` do repositório, a rota `/game` continua usando **`GameShoot`**; as correções de **`gameService`** beneficiam essa tela.

---

## 1. Commit realizado

| Campo | Valor |
|-------|--------|
| **Mensagem** | `fix: saldo real no shoot + apostas recentes via chutes` |
| **SHA** | `af72ce9746773a0163409427826cc5f468654d95` |
| **Arquivos** | `server-fly.js`, `goldeouro-player/src/config/api.js`, `goldeouro-player/src/pages/Dashboard.jsx`, `goldeouro-player/src/services/apiClient.js`, `goldeouro-player/src/services/gameService.js`, `goldeouro-player/src/utils/requestCache.js`, `docs/relatorios/CIRURGIA-FLUXO-JOGADOR-SALDO-DASHBOARD-2026-04-02.md` |

**Estatística:** 7 ficheiros, +284 / −39 linhas (`git log -1 --stat`).

---

## 2. Tag criada

| Campo | Valor |
|-------|--------|
| **Nome** | `pos-cirurgia-fluxo-jogador-2026-04-02` |
| **Tipo** | tag anotada |
| **Alvo** | commit `af72ce9746773a0163409427826cc5f468654d95` |
| **Push** | `git push origin pos-cirurgia-fluxo-jogador-2026-04-02` — **enviada** |

**Branch enviada:** `migracao-canonica-gamefinal-main-2026-04-01` (`d02bb39..af72ce9`).

---

## 3. Deploy

| Campo | Valor |
|-------|--------|
| **Plataforma** | Fly.io |
| **App** | `goldeouro-backend-v2` (`fly.toml`) |
| **Comando** | `fly deploy --yes` |
| **Resultado CLI** | **SUCCESS** (exit code 0) |
| **Image** | `registry.fly.io/goldeouro-backend-v2:deployment-01KN68HG71ZR9MBEAMZPWGG7WF` |
| **Digest resumido** | `sha256:7a5aa02bd6b9af20756ac6146cb7e139cac9b18e4d424f221eefd30db91d9d24` (manifest no log) |
| **Máquina app (rolling)** | `1850066f141908` — estado final reportado como OK |
| **Nota** | Durante o deploy apareceu **WARNING** sobre escuta em `0.0.0.0:8080`; a máquina passou nos checks finais. Monitorar se houver intermitência. |
| **Alteração lateral** | Process group `payout_worker` criou máquinas novas (`784792dc472d38`, standby `683d333c643e38`) — efeito colateral do `fly.toml` atual, não do diff da cirurgia. |

**Frontend (Vercel):** **não** foi executado deploy pelo agente nesta sessão.

---

## 4. Verificação de produção (evidência real)

### 4.1 Backend — nova rota

- **Pedido:** `GET https://goldeouro-backend-v2.fly.dev/api/games/chutes/recentes` (sem `Authorization`).
- **HTTP:** **401** (esperado sem token).
- **Interpretação:** **não é 404** — a rota existe no runtime público após o deploy. Evidência objetiva de que o binário servido inclui o handler novo.

### 4.2 Backend — saúde

- **GET** `https://goldeouro-backend-v2.fly.dev/health` → **200**, JSON com `status":"ok"`, `database":"connected"`.

### 4.3 `POST /api/games/shoot` com `novoSaldo`

- **Não executado** nesta sessão: exige **JWT válido** e fluxo de jogo com saldo controlado. **Sem prova direta** de corpo de resposta com `novoSaldo` em produção.

### 4.4 Frontend player — bundle em `https://app.goldeouro.lol/`

- **HTML referencia:** `/assets/index-brxfDf0E.js` (inalterado em relação a auditorias anteriores).
- **Verificação:** conteúdo do JS baixado **não contém** a substring `chutes/recentes`.
- **Conclusão:** o **player em produção neste host não foi atualizado** com o build que chama `GET /api/games/chutes/recentes` nem, por extensão, as alterações de `Dashboard.jsx` / `apiClient` / `requestCache` deste commit.

---

## 5. Teste do fluxo do jogador (resultado real)

| Item | Estado |
|------|--------|
| Saldo pós-miss = 0 na API | **Não provado** (sem autenticação) |
| UI saldo / aviso recarga | **Não provado** (frontend antigo no bundle analisado) |
| Dashboard “Apostas Recentes” com chutes | **Não provado** (frontend antigo) |
| Backend rota chutes | **Rota ativa** (401 sem token) |

---

## 6. Problemas encontrados

1. **Player em produção defasado** em relação ao commit `af72ce9` — necessário **build + deploy Vercel** (ou pipeline equivalente) a partir da branch que contém o frontend da cirurgia.
2. **Teste E2E do shoot** em produção **pendente** (credenciais / script com token).
3. **WARNING** Fly sobre endereço de escuta — acompanhar em `fly logs` se houver 502.

---

## 7. Classificação final

**REPROVADO** para o critério global *“fluxo do jogador funcional em produção de ponta a ponta com prova concreta”*, porque:

- o **frontend servido** em `app.goldeouro.lol` **não** evidencia o novo cliente;
- **não há** prova de `novoSaldo` nem de lista de chutes na UI em runtime.

**APROVADO COM RESSALVAS** apenas para o **backend Fly**: deploy concluído e **401** na nova rota comprovam presença do código novo no servidor.

---

## 8. Conclusão objetiva

| Pergunta | Resposta |
|----------|----------|
| **A. Deploy ocorreu com sucesso?** | **SIM** (Fly.io, conforme log). |
| **B. Produção está com nova versão?** | **Backend: SIM (com ressalva do warning). Frontend player analisado: NÃO.** |
| **C. Existe prova concreta?** | **SIM** para rota `GET /api/games/chutes/recentes` → **401** e health **200**. **NÃO** para shoot `novoSaldo` nem para bundle do player. |
| **D. Fluxo completo em produção?** | **Não demonstrado.** |
| **Próximo passo obrigatório** | Deploy do **`goldeouro-player`** contendo o commit (ou merge) da cirurgia + teste autenticado do shoot e do dashboard. |

---

*Relatório elaborado com base em comandos executados na máquina do agente (Git, Fly CLI, curl).*
