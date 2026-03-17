# INCIDENTE DAS MÁQUINAS — FLY.IO — READ-ONLY

**Projeto:** Gol de Ouro  
**App Fly.io:** goldeouro-backend-v2  
**Data:** 2026-03-09  
**Modo:** READ-ONLY (nenhuma alteração de código, env, deploy ou infraestrutura)  
**Foco:** Infraestrutura do backend no Fly.io (máquinas, releases, health, redundância).

---

## 1. Resumo executivo

A auditoria foi conduzida **exclusivamente sobre o repositório e relatórios de incidente já existentes**. Não houve execução de `flyctl status`, `fly machines list`, `fly releases` nem acesso ao painel do Fly.io; portanto o **estado ao vivo** das máquinas (IDs, started/stopped, checks atuais) e dos releases **não pôde ser confirmado** nesta análise. Com base nos arquivos e relatórios lidos: (1) a causa do crash loop (unhandled rejection SMTP) foi corrigida no código (FIX-SMTP-CRASH-LOOP e SMTP-SAFE-MODE); (2) o health check está configurado em `/health` com `grace_period` 40s no fly.toml e o backend expõe `/health` e `/ready`; (3) relatórios anteriores (DIAGNOSTICO-DEPLOY-FALHO, PUBLICACAO-CORRECAO-LOGIN-500) indicam que, em momentos passados, existiam **duas máquinas**, com uma em **started** (1 passing) e outra em **stopped** (1 warning), e que `/health` retornou 200 após redeploy. **Redundância ativa (duas máquinas saudáveis recebendo tráfego)** não está comprovada por evidência no repositório; a “segunda máquina” segue como **pendência/dúvida operacional**. Diagnóstico final com base apenas em evidência disponível no repo: **ESTÁVEL COM RESSALVAS** — o código e a configuração suportam um backend estável e o histórico indica que o app voltou a responder após as correções, mas o estado atual das máquinas e a redundância real dependem de validação operacional (fly status / painel).

---

## 2. Evidências auditadas

| Fonte | Conteúdo relevante |
|-------|--------------------|
| **fly.toml** | app = goldeouro-backend-v2; primary_region = gru; internal_port = 8080; [[services.http_checks]] path = /health, method = get, interval = 30s, timeout = 10s, grace_period = 40s. Nenhuma definição explícita de quantidade de máquinas. |
| **server-fly.js** | GET /health (async; retorna 200 com status, database, mercadoPago, etc.); GET /ready (200 { status: 'ready' } ou 503); isAppReady e httpServer para graceful shutdown; rate limiter ignora /health e /api/auth. |
| **docs/relatorios/INCIDENTE-FLY-STARTUP-BACKEND-READONLY-2026-03-09.md** | Causa raiz do crash: rejeição não tratada da Promise de transporter.verify() no emailService; boot não depende de SMTP; /health não depende de e-mail. |
| **docs/relatorios/FIX-SMTP-CRASH-LOOP-2026-03-09.md** | Correção aplicada: .catch() na _verifyPromise no emailService; processo não cai mais por falha SMTP. |
| **docs/relatorios/SMTP-SAFE-MODE-2026-03-09.md** | Hardening no emailService: estado explícito, ensureReady(), verify em background com .catch(); backend sobe mesmo com SMTP inválido. |
| **docs/relatorios/DIAGNOSTICO-DEPLOY-FALHO-FLY-E-REDEPLOY-2026-03-09.md** | Release 317 falhou; nova máquina não passou no health a tempo (grace_period 10s); fly.toml alterado para grace_period 40s; redeploy 318; duas máquinas: 2874551a105768 (stopped, 1 warning) e e82d445ae76178 (started, 1 passing). |
| **docs/relatorios/PUBLICACAO-CORRECAO-LOGIN-500-2026-03-09.md** | Deploy realizado; versões 320/321; /health 200; imagem deployment-01KK87DJ4YHRM92MXTG550E8FQ. |

Nenhum output atual de `fly status`, `fly machines list` ou painel Fly.io foi analisado (não disponível no repositório).

---

## 3. Estado real das máquinas

**Não foi possível determinar o estado atual** (quantidade, IDs, started/stopped, checks) a partir apenas do repositório. A informação abaixo vem **exclusivamente de relatórios anteriores** e pode não refletir o estado de agora.

- **fly.toml:** Não define número de VMs; a escala (1 ou 2 máquinas) é definida via Fly dashboard ou CLI, não pelo arquivo.
- **Relatório DIAGNOSTICO-DEPLOY-FALHO (2026-03-09):** Após redeploy Release 318:
  - **Máquina 2874551a105768:** STATE **stopped**, CHECKS **1 total, 1 warning**.
  - **Máquina e82d445ae76178:** STATE **started**, CHECKS **1 total, 1 passing**.
  - Conclusão do próprio relatório: uma máquina em started com 1 passing é suficiente para o app estar no ar; a outra pode permanecer stopped.

**Para obter o estado real atual:** é necessário executar `fly status` e `fly machines list` (ou equivalente) no app goldeouro-backend-v2, ou inspecionar o painel Fly.io.

---

## 4. Estado real dos releases

**Não foi possível determinar o estado atual** dos releases (qual está “released”, qual falhou, qual está em cada máquina). A informação abaixo vem **apenas de relatórios**.

- **Relatórios citam:** Releases 313, 317 (falhou), 318 (redeploy com grace_period 40s), 320/321 (deploy da correção de login 500).
- **Release 317:** Falhou porque a nova máquina não passou no health check no tempo (grace 10s); mensagem de log: “machine was in a non-started state prior to the update so leaving the new version stopped”.
- **Release 318:** Redeploy com fly.toml já com grace_period 40s; ambas as máquinas atualizadas para a nova configuração; ao final, uma started (1 passing) e uma stopped (1 warning).
- **Releases 320/321:** Deploy da correção do login 500; /health 200 confirmado no relatório.

**Para obter o estado atual dos releases:** é necessário executar `fly releases` (ou equivalente) ou ver o painel Fly.io.

---

## 5. Health check e disponibilidade

- **Configuração (fly.toml):** `path = "/health"`, `method = "get"`, `interval = "30s"`, `timeout = "10s"`, `grace_period = "40s"`. Porta do serviço: 8080.
- **Código (server-fly.js):** GET `/health` responde sempre **200** com JSON `{ status: 'ok', timestamp, version: '1.2.0', database: 'connected'|'disconnected', mercadoPago: '...', ... }`. Não depende de emailService/SMTP. Faz ping ao Supabase se não conectado.
- **Rota adicional:** GET `/ready` retorna 200 `{ status: 'ready' }` quando `isAppReady === true`, ou 503 quando ainda não pronto; não é referenciada no fly.toml atual (apenas `/health` está em http_checks).
- **Relatórios:** Após correção do grace_period e do SMTP, `/health` foi confirmado retornando 200 (DIAGNOSTICO-DEPLOY-FALHO, PUBLICACAO-CORRECAO-LOGIN-500).
- **Conclusão:** A configuração do health e o comportamento do `/health` no código estão alinhados e compatíveis com um backend estável; a **estabilidade contínua** (sem falhas intermitentes ou restarts excessivos) não pode ser comprovada sem logs ou métricas atuais do Fly.

---

## 6. Redundância real do backend

- Nos relatórios auditados, **em nenhum momento** as duas máquinas aparecem simultaneamente como **started** e com checks **passing**. O cenário descrito é: uma máquina **started** com 1 passing e outra **stopped** com 1 warning.
- Portanto, com base apenas nas evidências do repositório, **não está comprovado** que exista redundância ativa (duas instâncias saudáveis recebendo tráfego). O que está documentado é **uma** máquina sustentando o app e outra em estado stopped/warning.
- Para afirmar que a redundância está ativa seria necessário: (1) confirmar que há duas (ou mais) máquinas com estado **started** e checks **passing**, e (2) que o Fly está distribuindo tráfego entre elas (ou que há política de failover configurada e testada).

---

## 7. Riscos ocultos encontrados

| Risco | Evidência | Status |
|-------|-----------|--------|
| **Segunda máquina parada ou com check warning** | DIAGNOSTICO-DEPLOY-FALHO: uma máquina stopped, 1 warning. | Pendência operacional; estado atual não verificado nesta auditoria. |
| **Health check antes do app escutar** | Já mitigado: grace_period aumentado de 10s para 40s no fly.toml. | Mitigado no código/config. |
| **Crash loop por SMTP** | Causa raiz identificada e corrigida (FIX-SMTP-CRASH-LOOP, SMTP-SAFE-MODE). | Mitigado no código. |
| **Release “released” com máquina nova ainda não saudável** | Relatório 317: nova máquina deixada stopped por não passar no check a tempo. | Mitigado pelo grace_period 40s; novo deploy pode ainda falhar se startup > 40s ou outro problema. |
| **Uma única máquina sustentando o tráfego** | Relatórios mostram apenas uma started com passing. | Risco operacional: sem redundância ativa, falha dessa máquina derruba o backend. |
| **Timeout de startup** | Se connectSupabase() ou testMercadoPago() demorar mais que 40s, o health pode falhar no grace period. | Possível; depende de latência de rede e do Supabase/MP. |

---

## 8. O que está comprovado vs o que ainda depende de validação

| Comprovado (por código ou relatórios) | Ainda dependente de validação manual/operacional |
|---------------------------------------|---------------------------------------------------|
| fly.toml usa `/health`, grace_period 40s, porta 8080. | Quantidade atual de máquinas e seus IDs. |
| server-fly.js expõe /health (200) e /ready (200/503); não depende de SMTP. | Estado atual de cada máquina (started/stopped, checks passing/warning/failing). |
| Causa do crash loop (SMTP) foi corrigida no emailService. | Se ambas as máquinas estão ativas e recebendo tráfego. |
| Relatórios indicam que /health retornou 200 após correções e redeploy. | Se há falhas intermitentes de health ou restarts excessivos. |
| No passado havia duas máquinas; uma started (1 passing), outra stopped (1 warning). | Se a segunda máquina foi religada e está saudável. |
| GET https://goldeouro-backend-v2.fly.dev/health foi testado e retornou 200 em relatórios. | Equilíbrio de tráfego ou failover entre máquinas. |
| Rota /ready existe e não está no fly.toml (opcional para uso futuro). | Versão exata da imagem rodando em cada máquina e consistência entre elas. |

---

## 9. Diagnóstico final da infra

**Classificação: ESTÁVEL COM RESSALVAS**

- **Estável:** O código e a configuração (fly.toml, server-fly.js, emailService) suportam um backend que sobe sem depender de SMTP, responde em `/health` e `/ready`, e não cai por unhandled rejection do verify. Relatórios confirmam que, após as correções de SMTP e do grace_period, o app voltou a responder e `/health` retornou 200.
- **Ressalvas:** (1) O estado **atual** das máquinas e dos releases não foi verificado nesta auditoria (não há output de flyctl nem painel no escopo). (2) A redundância (duas máquinas saudáveis) **não** está comprovada nas evidências lidas; a segunda máquina aparece como stopped/warning. (3) A infraestrutura está **pronta para sustentar o próximo bloco** do ponto de vista de código e configuração, desde que uma validação operacional confirme que pelo menos uma máquina está started com check passing e que não há crash loop ou health intermitente.

---

## 10. Conclusão objetiva

Com base **apenas** no repositório e nos relatórios de incidente e deploy:

- A **infraestrutura do backend no Fly.io está em condições de sustentar o próximo bloco** do projeto do ponto de vista de aplicação e configuração: crash por SMTP foi mitigado, health check está configurado com grace adequado e o backend expõe /health e /ready de forma coerente.
- Para considerar a infra **totalmente estável e redundante**, é necessário **validar operacionalmente**: (1) executar `fly status` e `fly machines list` para o app goldeouro-backend-v2 e confirmar quantas máquinas existem e em que estado (started/stopped, checks); (2) confirmar se a segunda máquina foi religada e está saudável, se a redundância é desejada; (3) opcionalmente, verificar logs recentes no Fly para descartar restarts excessivos ou falhas intermitentes de health.

Nenhuma alteração foi realizada. Nenhum deploy foi executado. Esta análise foi conduzida em modo estritamente READ-ONLY.
