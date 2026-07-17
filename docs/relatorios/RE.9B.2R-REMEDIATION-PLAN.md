# RE.9B.2R — Deterministic Deployment Remediation Plan™

**Projeto:** Gol de Ouro™ V1  
**Engine:** Indesconectável Payment Engine™  
**Pipeline:** Release Engineering™  
**Fase:** RE.9B.2R  
**Modo:** READ-ONLY + engenharia de remediação  
**Base:** RE.9B.2 = FAIL  
**Branch de engenharia prevista:** `re/9b-staging-deployment-contract`

## Declaração de modo

Nenhuma correção técnica foi aplicada nesta etapa.

Não foram alterados:

- código da aplicação;
- workflows;
- scripts existentes;
- manifests existentes;
- documentação pré-existente;
- banco;
- staging;
- produção.

Não foram executados deploy, rollback, commit, tag ou push.

Este documento e o snapshot associado são os únicos artefatos criados.

---

## 1. Inventário das não conformidades

| ID | Não conformidade | Gravidade | Risco | Impacto | Causa | Arquivos | Prioridade |
|---|---|---|---|---|---|---|---|
| NC-01 | Workflow A2R faz deploy no mesmo app sem consultar o manifest canônico | Crítica | Bypass operacional | Staging pode receber SHA/tag/secrets diferentes da RC | Segundo deployer independente | `.github/workflows/a2r-staging-asaas-sandbox.yml` | P0 |
| NC-02 | Grupos de concorrência separados permitem race A2R × deploy canônico | Alta | Sobrescrita mútua | Imagem/secrets inconsistentes | Concurrency groups distintos | `backend-deploy-staging.yml`, `a2r-staging-asaas-sandbox.yml` | P0 |
| NC-03 | Deploy canônico executa `flyctl secrets set` pré e pós-deploy | Alta | Mutação externa ao commit | Runtime muda sem novo SHA; releases intermediárias | Flags/metadata tratadas como secrets | `backend-deploy-staging.yml` | P0 |
| NC-04 | Schedulers financeiros default-on no processo HTTP | Alta | Side effect financeiro implícito | Reconciliação/recovery podem iniciar em shadow | `!== 'false'` | `src/payment-engine/scheduler/index.js`, `PaymentEngine.js`, `server-fly.js` | P0 |
| NC-05 | `/meta.environment` hardcoded como `production` | Alta | Gate pós-deploy quebrado | Workflow exige `staging` e falha ou passa com evidência falsa | Literal no endpoint | `server-fly.js` | P0 |
| NC-06 | Divergência `meta.gitCommit` gera apenas warning | Alta | Falso PASS | Deploy pode concluir com SHA errado | Soft-fail no gate | `backend-deploy-staging.yml` | P0 |
| NC-07 | Rollback não captura release/image anterior | Alta | Rollback não determinístico | Falha sem alvo reproduzível | Ausência de baseline pré-deploy | `backend-deploy-staging.yml` | P0 |
| NC-08 | Manifest canônico não governa sozinho o workflow | Alta | Autoridade parcial | Campos `target.*`, `release.commit`, `contract_version` ignorados | Workflow lê só tag/sha/frozen | `backend-deploy-staging.yml`, `release-manifest.json` | P1 |
| NC-09 | Cadeia verify → freeze → deploy não é obrigatória | Alta | Deploy sem certificação | Scripts manuais opcionais | Ausência de gate de pré-condição | workflow + scripts | P1 |
| NC-10 | `setup-flyctl@master`, `@v4`, `ubuntu-latest` flutuantes | Alta | Toolchain mutável | Mesmo commit, tools diferentes | Refs móveis | workflows | P1 |
| NC-11 | Base image `node:20-alpine` sem digest | Alta | Artefato não bit-reproduzível | Rebuilds distintos | Tag Docker flutuante | `Dockerfile` | P1 |
| NC-12 | Imagem usa `npm install`, não `npm ci` | Alta | Resolução menos estrita | Drift de dependências na imagem | Dockerfile legado | `Dockerfile` | P1 |
| NC-13 | Freeze helper desalinhado do contrato RE.9B.1 | Alta | Recriação de drift | Pode sobrescrever schema/branch | Script antigo | `scripts/pe2m2a-release-freeze.mjs` | P1 |
| NC-14 | Verifier RC com `EXPECTED_HEAD` antigo | Média | Falso FAIL/PASS local | HEAD esperado ≠ SHA canônico | Default desatualizado | `scripts/verify-release-candidate.mjs` | P1 |
| NC-15 | Validator opcional (`if -f`) | Média | Skip silencioso | Deploy sem validação estrutural | Condicional permissiva | `backend-deploy-staging.yml` | P1 |
| NC-16 | Health não valida corpo/DB | Média | Falso positivo | App “saudável” com DB down | Gate HTTP-only | workflow + `server-fly.js` | P1 |
| NC-17 | Smoke/verify estruturais não executados no deploy | Média | Cobertura incompleta | Só `test -f` | Ausência de execução | workflow | P1 |
| NC-18 | YAML do dispatch branch pode divergir do SHA implantado | Alta | Bypass por workflow antigo/modificado | Guards podem ser enfraquecidos | Semântica GitHub Actions + workflow | workflows / processo | P1 |
| NC-19 | Tag Git sem proteção comprovada no código | Alta | Tag móvel | Mesmo nome, SHA diferente | Ausência de ruleset no repo auditado | governança GitHub | P1 |
| NC-20 | Docs/playbooks ensinam refs e comandos pré-PE.2M | Média | Bypass humano | Operador pode implantar SHA antigo | Documentação desatualizada | `deployment-governance.md`, relatórios PE.2B | P2 |
| NC-21 | Artefatos históricos (`release-pin`, freeze audits) desalinhados | Baixa | Confusão documental | Sem autoridade operacional | Snapshots históricos | `staging-final/*.json` | P2 |
| NC-22 | Fallback `BACKEND_URL` para URL produtiva | Média | Contaminação observacional | Notificação pode apontar prod | Default hardcoded | `server-fly.js` | P1 |
| NC-23 | Identidade do artefato = git commit, sem digest OCI | Alta | Impossibilidade de redeploy bit-idêntico | Não há imagem pinada | Lacuna de provenance | Dockerfile/workflow/manifest | P1 |
| NC-24 | Banco validado na máquina anterior, não na release nova | Média | Janela de drift | Prova pré-deploy ≠ pós-deploy | Ordem dos gates | workflow | P1 |
| NC-25 | Flags PE em secrets, não em config versionada | Alta | Mutação/runtime externo | Flags podem mudar fora do commit | Modelo atual de secrets set | workflow + Fly | P0 |
| NC-26 | `/meta` não expõe tag, flags, schedulers, workers | Média | Observabilidade insuficiente | Pós-deploy incompleto | Endpoint limitado | `server-fly.js` | P1 |
| NC-27 | Dry-run inexistente | Média | Validação só via deploy real | Sem simulação segura | Feature ausente | workflow | P1 |
| NC-28 | Manifest canonizado ainda só no working tree | Alta | Tag histórica contém contrato antigo | Deploy da tag original usa manifest pré-RE.9B.1 | Alterações não commitadas/publicadas | working tree + tag | P0 |

**Total:** 28 não conformidades.

---

## 2. Plano de remediação por NC

### NC-01 / NC-02 — Eliminar bypass A2R

- **Solução:** transformar A2R em gate separado de configuração, sem `flyctl deploy`; ou exigir o mesmo manifest/tag/SHA e o mesmo concurrency group do deployer canônico; preferência: remover capacidade de deploy do A2R.
- **Arquivos:** `a2r-staging-asaas-sandbox.yml`, docs de governança.
- **Risco técnico:** médio — quebra fluxo Asaas sandbox se ainda depender de redeploy.
- **Impacto esperado:** único deployer de código.
- **Dependências:** decisão HITL sobre A2R.
- **Ordem:** R1.

### NC-03 / NC-25 — Remover `flyctl secrets set` do deploy

- **Solução:** mover flags/config não secretas para `fly.staging.toml`; manter secrets reais pré-provisionados; workflow apenas valida existência/valores seguros via read-only.
- **Arquivos:** `backend-deploy-staging.yml`, `fly.staging.toml`, docs.
- **Risco técnico:** médio — exige garantir que flags já estejam corretas no app.
- **Impacto esperado:** deploy sem mutação de secrets.
- **Dependências:** inventário de secrets staging; gate específico se valores precisarem ser corrigidos uma vez.
- **Ordem:** R2.

### NC-04 / NC-22 — Runtime shadow fail-closed

- **Solução:** defaults fail-closed para schedulers/workers; flags explícitas `false` no TOML; remover fallback produtivo de URL em staging; nenhum side effect financeiro default-on.
- **Arquivos:** `scheduler/index.js`, `fly.staging.toml`, possivelmente `server-fly.js`/`PaymentEngine.js`.
- **Risco técnico:** alto se mal isolado; deve ser guardado por environment.
- **Impacto esperado:** HTTP sobe sem timers financeiros.
- **Dependências:** testes unitários de defaults; metadata.
- **Ordem:** R3.

### NC-05 / NC-06 / NC-16 / NC-26 — Metadata e gates

- **Solução:** `/meta` deriva environment/tag/SHA/flags/schedulers/workers de env/build metadata; gates tornam SHA/tag fatais; health valida corpo mínimo.
- **Arquivos:** `server-fly.js`, workflow.
- **Risco técnico:** médio — muda contrato observacional.
- **Impacto esperado:** pós-deploy determinístico.
- **Dependências:** build-args e env versionados.
- **Ordem:** R4.

### NC-07 / NC-24 — Baseline e rollback determinístico

- **Solução:** capturar release ID, image digest, machines, health e meta antes do deploy; persistir artifact; rollback por release ID capturado.
- **Arquivos:** workflow; opcional script helper.
- **Risco técnico:** baixo a médio.
- **Impacto esperado:** rollback reproduzível só em staging.
- **Dependências:** remoção prévia de secrets set intermediários.
- **Ordem:** R5.

### NC-08 / NC-09 / NC-13 / NC-14 / NC-15 / NC-17 / NC-27 — Contrato e cadeia

- **Solução:** workflow valida todos os campos canônicos; inputs `release_tag`, `expected_sha`, `confirm_staging`, `dry_run`; scripts alinhados; validate/smoke obrigatórios; dry-run sem mutação.
- **Arquivos:** workflow, freeze, verifier, validator, smokes.
- **Risco técnico:** médio.
- **Impacto esperado:** cadeia única e auditável.
- **Dependências:** manifest canônico estável.
- **Ordem:** R6.

### NC-10 / NC-11 / NC-12 / NC-23 — Reprodutibilidade de artefato

- **Solução:** pin actions/flyctl por SHA; `FROM node:...@sha256:...`; `npm ci --omit=dev`; capturar e registrar digest OCI no manifest/evidência.
- **Arquivos:** Dockerfile, workflows, manifest schema.
- **Risco técnico:** médio.
- **Impacto esperado:** artefato mais reproduzível.
- **Dependências:** CI capaz de resolver digests.
- **Ordem:** R7.

### NC-18 / NC-19 / NC-28 — Governança Git

- **Solução:** publicar correções em nova RC/tag; proteger tags; exigir dispatch a partir de ref alinhada; nunca mover tag histórica.
- **Arquivos:** processo + rulesets GitHub + nova RC.
- **Risco técnico:** baixo no código; alto operacional se mal executado.
- **Impacto esperado:** imutabilidade administrativa.
- **Dependências:** RE.9B.1 commit + remediações anteriores.
- **Ordem:** R8.

### NC-20 / NC-21 — Documentação histórica

- **Solução:** marcar docs antigos como legacy; apontar para contrato canônico; não reescrever evidências históricas.
- **Arquivos:** docs de governança/relatórios.
- **Risco técnico:** muito baixo.
- **Impacto esperado:** reduzir bypass humano.
- **Dependências:** contrato finalizado.
- **Ordem:** R9.

---

## 3. Preservação da V1

| Correção | Altera V1? | Runtime? | Produção? | Staging? | Financeiro/PIX/Auth? | Deploy atual? | Isolamento |
|---|---|---|---|---|---|---|---|
| Desativar deploy no A2R | Não | Não se só remover deploy | Não | Só impede bypass futuro | Não | Não executa agora | Gate HITL; sem tocar app |
| Remover secrets set | Não no código produtivo | Só se/quando staging for reimplantado | Não | Indireto no futuro deploy | Não | Contrato futuro | Validar read-only primeiro |
| Schedulers fail-closed | Sim, se global | Sim | Potencial se não isolado | Sim após deploy | Sim se global | Sim após deploy | Guard por `NODE_ENV`/`DATABASE_ENV`/flag shadow |
| `/meta` dinâmico | Observacional | Observacional | Só leitura/contrato | Sim após deploy | Não | Sim após deploy | Sem side effects |
| Rollback baseline | Não | Não nesta etapa | Não | Só no futuro fail path | Não | Não | Staging-only |
| Pin toolchain/Dockerfile | Build | Futuro artefato | Não automaticamente | Sim no próximo deploy | Não | Novo artefato | Nova tag/RC |
| Docs legacy | Não | Não | Não | Não | Não | Não | Somente docs |

**Regra absoluta:** nenhuma remediação desta série pode ser aplicada diretamente em `goldeouro-backend-v2`, `main`, secrets produtivos ou banco produtivo.

Qualquer mudança de runtime deve:

1. viver em branch de engenharia;
2. ser fail-closed e environment-scoped;
3. gerar nova RC;
4. passar dry-run;
5. implantar só em staging sob HITL;
6. nunca ativar PIX/Wallet/Ledger reais.

---

## 4. Estratégia de implementação

| ID | Classe | Isolada? | Precisa staging? | Precisa shadow? | Precisa nova certificação? |
|---|---|---|---|---|---|
| NC-01/02 A2R | C Workflow | Sim, com HITL | Não para editar YAML | Não | Sim antes de novo RE.9 |
| NC-03/25 secrets | C+D | Parcial | Validação read-only staging | Shadow config | Sim |
| NC-04 runtime | E Runtime | Não | Sim para provar | Sim | Sim |
| NC-05/06/16/26 meta/gates | E+C | Parcial | Sim para provar | Sim | Sim |
| NC-07 rollback | C+F | Sim | Read-only baseline | Não | Sim |
| NC-08/09/13/14/15/17/27 contrato | B+C+F | Sim | Dry-run | Sim | Sim |
| NC-10/11/12/23 repro | C+D | Sim | Build staging | Sim | Sim |
| NC-18/19/28 git | F+D | Não | Não | Não | Sim |
| NC-20/21 docs | A | Sim | Não | Não | Não necessariamente |

---

## 5. Ordem obrigatória

```text
R1  Isolar/desarmar bypass A2R
 ↓
R2  Remover mutações de secrets do deployer canônico
 ↓
R3  Fail-closed de schedulers/workers/shadow flags no TOML + código environment-scoped
 ↓
R4  Corrigir /meta e tornar gates SHA/tag/health fatais
 ↓
R5  Capturar baseline e rollback por release ID
 ↓
R6  Completar contrato: inputs, dry-run, scripts, smoke obrigatório
 ↓
R7  Pin de toolchain/base image/npm ci + digest
 ↓
R8  Commit engenharia → nova RC → nova tag revisionada
 ↓
R9  Atualizar docs legacy / apontadores
 ↓
Validação estática + testes locais
 ↓
Dry-run HITL
 ↓
Shadow certification (RE.9C)
 ↓
Staging deploy HITL (novo RE.9)
 ↓
Certificação staging
 ↓
Produção: NÃO nesta série
```

Produção permanece fora do caminho até gates posteriores e autorização explícita.

---

## 6. Matriz de risco das correções

| Correção | Risco | Justificativa |
|---|---|---|
| Desarmar A2R deploy | Médio | Remove capacidade operacional; não toca apps se só YAML |
| Remover secrets set | Médio | Pode exigir alinhamento prévio one-time em gate específico |
| Schedulers fail-closed | Alto | Toca runtime; exige isolamento por ambiente |
| `/meta` dinâmico | Baixo/Médio | Observabilidade; risco de quebrar consumidores se não versionado |
| Rollback por release ID | Baixo | Somente staging e só em falha |
| Contrato/dry-run/scripts | Baixo | Sem efeito runtime até deploy |
| Pin image/actions/npm ci | Médio | Muda artefato futuro; deve ser certificado |
| Proteção de tags/nova RC | Médio | Processo sensível; tag histórica não pode mover |
| Docs legacy | Muito baixo | Sem runtime |

---

## 7. Compatibilidade

| Ativo | Preservado? | Nota |
|---|---|---|
| Payment Engine™ | Sim | Nenhuma flag ligada; defaults mais fechados |
| Gol de Ouro™ V1 | Sim | Produção intocável |
| Manifest canônico | Sim | Continua fonte única; schema pode versionar |
| Certificações anteriores | Sim | Históricas; não reescritas |
| Baselines | Sim | Tag `pe2m-shadow-staging-ready` permanece histórica |
| Histórico Git | Sim | Sem rewrite |
| Snapshots | Sim | Novos snapshots adicionados; antigos intactos |
| Auditorias | Sim | RE.9A/RE.9B.1/RE.9B.2 permanecem evidência |

---

## 8. Plano de execução

| Fase | Objetivo | Arquivos | Dependências | Pré-condições | Pós-condições | Aprovação | Rollback | Tempo |
|---|---|---|---|---|---|---|---|---|
| F0 | Freeze de escopo HITL | — | RE.9B.2 FAIL | Branch engenharia | Escopo fechado | Checklist | N/A | 0.5h |
| F1 | Desarmar bypass A2R | `a2r-*.yml` | F0 | Sem deploy ativo | A2R sem deploy ou pinado | Diff review | Reverter YAML | 2–4h |
| F2 | Deploy sem secrets set | workflow + `fly.staging.toml` | F1 | Inventário secrets | Deploy read-only sobre secrets | Diff + dry checks | Reverter YAML/TOML | 4–8h |
| F3 | Runtime shadow fail-closed | scheduler + TOML + guards | F2 | Testes unitários | Defaults off em staging | Testes verdes | Reverter código | 4–8h |
| F4 | Meta/gates fatais | `server-fly.js` + workflow | F3 | Contrato meta | SHA/tag/env comprováveis | Testes + dry-run | Reverter | 4–6h |
| F5 | Baseline/rollback | workflow | F2 | flyctl read-only | Artifact de baseline | Review YAML | Reverter | 3–5h |
| F6 | Contrato completo + dry-run | workflow + scripts | F1–F5 | Manifest canônico | Dry-run PASS | Execução dry-run | Reverter | 6–10h |
| F7 | Reprodutibilidade | Dockerfile + pins | F6 | Digests disponíveis | Build pinado | Review + build local/CI | Reverter | 4–8h |
| F8 | Nova RC/tag | git/processo | F1–F7 | HITL | Tag nova publicada | RE.9C | Não mover tag antiga | 2–4h |
| F9 | Docs legacy | docs | F8 | Contrato estável | Apontadores corretos | Review docs | Reverter docs | 2–3h |
| F10 | Novo RE.9 staging | workflow HITL | F8–F9 | Dry-run PASS | Staging atualizado sob contrato | Health/meta/flags | Rollback staging por release ID | HITL |
| F11 | Produção | — | Fora de escopo | — | — | Proibido nesta série | — | — |

---

## 9. Respostas obrigatórias

1. Não conformidades: **28**.
2. Exigem alteração de código: **8**.
3. Exigem alteração de workflow: **14**.
4. Exigem alteração de documentação: **4** principais + apontadores.
5. Impacta produção nesta etapa? **Não.** Nas remediações futuras? **Não, se isoladas.**
6. Impacta staging nesta etapa? **Não.** No futuro deploy HITL? **Sim, apenas sob novo RE.9.**
7. Impacta Payment Engine™? **Somente defaults mais fechados; sem ativação de ports.**
8. Impacta PIX? **Não deve; schedulers/side effects ficam off.**
9. Impacta runtime? **Sim, nas fases F3–F4 e no futuro deploy staging.**
10. Existe ordem obrigatória? **Sim.**
11. Dá para executar o plano sem risco produtivo? **Sim, se produção permanecer fora do caminho.**
12. Nova certificação necessária? **Sim.**
13. Produção alterada? **Não.**
14. Staging alterado? **Não.**
15. Banco alterado? **Não.**
16. Deploy realizado? **Não.**
17. Commit criado? **Não.**
18. Push realizado? **Não.**
19. Tag criada? **Não.**
20. Plano completo? **Sim, para engenharia de remediação.**

---

## 10. Próximo gate recomendado

**RE.9B.2R.1 — Controlled Remediation Execution™ (WRITE CONTROLADO)**

Escopo inicial sugerido: apenas R1+R2+R6 parcial em branch de engenharia, sem deploy, sem secrets Fly, sem produção.

Depois:

- RE.9C — certificação da RC refatorada;
- novo RE.9 — staging HITL;
- RE.10 só após staging certificado.

---

## Veredito

**PASS**

Todas as não conformidades do RE.9B.2 foram catalogadas, o plano de remediação está completo, os riscos e a ordem obrigatória estão definidos, e nenhuma alteração corretiva foi executada nesta etapa.
