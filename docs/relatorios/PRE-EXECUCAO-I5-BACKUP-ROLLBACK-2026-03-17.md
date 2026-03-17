# PRÉ-EXECUÇÃO I.5 — BACKUP, ROLLBACK E SEGURANÇA (READ-ONLY)

**Projeto:** Gol de Ouro  
**Data:** 2026-03-17  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração em código, banco ou deploy. Apenas verificação e documentação.

**Objetivo:** Garantir que, antes da execução da **Fase 1 (idempotência)**, exista um caminho rápido, seguro e testado de retorno ao estado atual. Validar e documentar capacidade de backup e rollback.

---

## 1. Estado atual do sistema

| Item | Valor (verificado em 2026-03-17) |
|------|----------------------------------|
| **Branch** | `feature/bloco-e-gameplay-certified` |
| **Commit HEAD** | `f8ee0ed` — "backup before fly hardening" |
| **Push remoto** | Branch está **ahead 1** em relação a `origin/feature/bloco-e-gameplay-certified` (1 commit local não enviado). |
| **Arquivos modificados (M)** | README.md, server-fly.js, goldeouro-player: App.jsx, Dashboard.jsx, GameFinal.jsx, GameShoot.jsx, Pagamentos.jsx, Profile.jsx, Withdraw.jsx, gameService.js, e outros em docs. |
| **Arquivos não rastreados (??)** | Vários em docs/relatorios e goldeouro-player (incl. DIAGNOSTICO-I5-FLUXO-CHUTE, PRE-EXECUCAO-I5, etc.). |
| **Referência segura para rollback** | Commit `f8ee0ed` existe e pode ser usado. Existem tags (ex.: v1.2.0, v1.2.1, v3.0.0-golden-goal). **Recomendação:** criar uma tag **antes** de aplicar a Fase 1 (ex.: `pre-fase1-idempotencia-2026-03-17`) apontando para o commit que estiver em produção no momento do deploy da Fase 1. |

**Conclusão:** O estado atual tem alterações locais (modificados e não commitados). Para rollback confiável, é essencial que o **estado exato** que está em produção (backend + frontend) esteja identificado por **commit ou tag** antes de qualquer mudança da Fase 1.

---

## 2. Backup do código

| Pergunta | Resposta |
|----------|----------|
| **Existe commit recente antes da mudança?** | Sim. HEAD atual é `f8ee0ed`. Os últimos commits são: f8ee0ed (backup before fly hardening), 95bbfd0 (fix auth), a59a9df (fix cors), cdf2938 (feat gameplay GameFinal). |
| **Foi feito push remoto?** | A branch está ahead 1 em relação à origin; ou seja, há pelo menos 1 commit local que pode não estar no remoto. Para rollback via re-deploy, o remoto precisa ter o commit/tag que representa “versão atual em produção”. |
| **Existe tag ou referência segura?** | Sim. Há tags como v1.2.0, v1.2.1, v3.0.0-golden-goal, GAME_VALIDADO_2025_12_30, pre-fly-redeploy-20250930-111928, etc. Nenhuma delas foi criada especificamente “antes da Fase 1”. |

**Ação recomendada antes da Fase 1 (sem alterar código neste documento):**  
- Confirmar qual **commit** (ou build) está hoje em produção no backend (Fly.io) e no frontend (ex.: Vercel).  
- Criar uma **tag** nesse commit, por exemplo: `pre-fase1-idempotencia-2026-03-17`.  
- Fazer **push** da tag para o remoto.  
Assim, o rollback será: fazer deploy do commit referenciado por essa tag (ou reverter o merge/commit da Fase 1).

---

## 3. Backup do banco

| Item | Situação |
|------|----------|
| **Banco em uso** | Supabase (PostgreSQL). Configuração via variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou equivalente) em .env / ambiente de produção. |
| **Backup automático** | Supabase oferece backups automáticos (conforme plano). A equipe deve **confirmar** no painel Supabase: frequência (diário, etc.) e retenção. |
| **Último backup** | Não acessível por este diagnóstico. **Ação:** verificar no dashboard Supabase a data/hora do último backup e se há point-in-time recovery (PITR) disponível. |
| **Export/dump imediato?** | Possível via `pg_dump` na conexão do projeto ou via ferramentas Supabase. Para Fase 1 **não é necessário** rollback de dados: a Fase 1 não altera schema nem lógica de escrita no banco; apenas o frontend envia um header a mais. |

**Risco para Fase 1:** Nenhuma alteração de tabelas ou de dados é feita pela Fase 1. Rollback do banco **não** faz parte do plano de reversão da Fase 1. Se em alguma etapa futura houver migração de dados ou de schema, aí sim será necessário garantir backup do banco antes.

---

## 4. Plano de rollback

Passos claros e diretos para voltar ao estado anterior à Fase 1.

### 4.1 Rollback do frontend (Player)

A Fase 1 altera o **frontend** (envio de `X-Idempotency-Key` no POST de chute). O backend já suporta o header e não precisa ser revertido para “voltar a funcionar” sem a key.

- **Opção A — Re-deploy da versão anterior**  
  1. No repositório, apontar o deploy do frontend (ex.: Vercel) para o **commit ou tag** criado antes da Fase 1 (ex.: `pre-fase1-idempotencia-2026-03-17`).  
  2. Disparar o deploy (ou permitir que o pipeline faça o deploy desse commit).  
  3. Validar em produção: chute sem header de idempotência deve continuar funcionando (comportamento atual).

- **Opção B — Reverter o commit da Fase 1**  
  1. Se a Fase 1 foi feita em um commit específico: `git revert <commit-fase1> --no-edit` e push para a branch usada no deploy.  
  2. Deploy da branch atualizado.  
  3. Validar chute em produção.

**Tempo estimado:** 5–15 minutos (deploy do frontend conforme ambiente).

### 4.2 Rollback do backend

A Fase 1 **não** exige alteração do backend para “ativar” idempotência; o backend já lê o header e rejeita duplicata. Se por engano tiver sido alterado algo no backend na Fase 1:

- Fazer deploy do backend a partir do **commit/tag** anterior à Fase 1 (mesmo referencial do frontend).  
- Tempo estimado: 5–15 minutos (conforme Fly.io / pipeline).

### 4.3 Rollback de banco

**Não aplicável à Fase 1.** Nenhuma migração nem mudança de dados. Se no futuro houver mudança de schema ou de dados, o plano deve incluir backup prévio e, se necessário, script de reversão ou restauração a partir do backup Supabase.

### 4.4 Dependência de alguém

- Rollback de **código** depende de quem tem permissão para: (1) criar tag/push, (2) reverter commit e (3) disparar ou aprovar deploy (Vercel, Fly.io, etc.).  
- Rollback de **banco** (para fases futuras) pode depender de acesso ao Supabase e de política de backup/restore.

---

## 5. Critérios de rollback

Abortar a Fase 1 e reverter imediatamente se ocorrer qualquer um dos seguintes:

| Gatilho | Ação |
|--------|------|
| **Chute não funciona** (usuário não consegue chutar; 4xx/5xx em POST /api/games/shoot) | Rollback do frontend (e, se alterado, do backend) para a versão anterior. |
| **Erro no frontend** (tela de jogo quebra, erro de JavaScript, loading infinito) | Rollback do frontend. |
| **Bloqueio de chutes válidos** (muitos 409 “Chute já processado” para usuários que só deram um clique; chave de idempotência mal gerada ou reutilizada incorretamente) | Rollback do frontend e revisão da geração/reuso da chave antes de nova tentativa. |
| **Duplicidade continua acontecendo** (dois débitos para um único gesto mesmo com idempotency key) | Investigar; se for por bug no backend no uso da key, considerar rollback do backend se houver mudança; caso contrário, rollback do frontend já reduz risco (volta ao estado “sem key”). |
| **Erro inesperado em produção** (aumento relevante de erros 500, timeout, ou impacto em outras rotas) | Rollback da(s) parte(s) alterada(s) e análise em ambiente de staging. |

Regra prática: **em caso de dúvida sobre impacto em usuários ou em dinheiro, reverter primeiro e analisar depois.**

---

## 6. Tempo estimado de reversão

| Ação | Tempo | Complexidade |
|------|--------|--------------|
| Rollback apenas frontend (re-deploy commit/tag anterior) | 5–15 min | Baixa |
| Rollback frontend + backend (se backend tiver sido alterado) | 10–20 min | Baixa |
| Criação de tag + push + re-deploy | 5–10 min adicionais na preparação | Baixa |

Não há rollback de banco na Fase 1; portanto a reversão é **somente de aplicação** (código/build), o que mantém o tempo de reversão em minutos e a complexidade baixa, desde que o ponto de referência (tag/commit) esteja definido antes do deploy.

---

## 7. Conclusão

### Estamos seguros para executar?

- **Sim, desde que:**  
  1. O estado atual em produção esteja **referenciado** por commit ou tag **antes** de qualquer alteração da Fase 1.  
  2. A equipe tenha **acesso** para fazer re-deploy do frontend (e do backend, se necessário) a partir desse commit/tag.  
  3. Os critérios de rollback acima sejam aceitos e comunicados (quem decide reverter e em quanto tempo).

Sem um “ponto de restauração” claro (tag/commit em produção), o rollback deixa de ser determinístico e pode levar mais tempo ou erro humano.

### Rollback é rápido e confiável?

- **Sim.** A Fase 1 não mexe em banco nem em contrato que exija migração. Voltar o frontend (e, se for o caso, o backend) ao commit/tag anterior e fazer re-deploy é suficiente. Com tag criada antes da Fase 1, o processo é **rápido** (minutos) e **confiável** (mesmo código que estava estável).

### Há algum bloqueio?

- **Possíveis bloqueios:**  
  1. **Estado atual não versionado:** Se o que está em produção for um build a partir de alterações locais não commitadas, não há referência git para rollback. **Solução:** commitar e fazer push do estado atual (ou do último estável), criar a tag nesse commit e só então aplicar a Fase 1.  
  2. **Falta de permissão:** Quem for executar a Fase 1 precisa ter permissão para criar tag, push e re-deploy; caso contrário, combinar com quem tem.  
  3. **Backup do banco:** Para a Fase 1 não é bloqueante; para fases futuras que alterem banco, confirmar no Supabase a política de backup e PITR.

**Resposta direta:** Com **tag (ou commit) de referência criada antes da Fase 1** e **acesso a deploy**, o sistema está em condições de executar a Fase 1 com rollback rápido e sem dano financeiro: a reversão restaura o comportamento atual (sem idempotency key) em minutos.

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração foi feita em código, banco, deploy ou infraestrutura. Verificação baseada em estado do repositório (branch, commit, status, tags) em 2026-03-17.*
