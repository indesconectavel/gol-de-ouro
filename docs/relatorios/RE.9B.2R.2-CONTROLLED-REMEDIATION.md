# RE.9B.2R.2 — Controlled Remediation Execution (R3 + R4)

## Escopo executado

Somente R3 e R4 foram implementadas.

- **R3:** staging shadow fail-closed para schedulers e worker financeiros.
- **R4:** metadata operacional real e gates pós-deploy fatais.

R1/R2 foram preservadas. Nenhuma atividade R5–R9 foi iniciada.

## Pré-condições

| Pré-condição | Evidência | Estado |
|---|---|---|
| RE.9B.2R | Plano presente e aprovado | PASS |
| RE.9B.2R.1 | Relatório e snapshot presentes | PASS |
| Manifest canônico | Não alterado neste gate | PASS |
| Baseline | Ref local permanece `8cb00e9a576b6a5b2c784615cc5a55b26492c112` | PASS |
| Produção/staging/banco | Nenhuma operação externa executada | PRESERVADOS |
| Deploy pendente | Nenhum deploy iniciado por este gate; estado remoto não consultado | NÃO CRIADO PELO GATE |
| Regressões abertas | Nenhuma regressão R1/R2 identificada | PASS |

## R3 — Runtime shadow fail-closed

### Alterações

`fly.staging.toml` declara explicitamente:

- `MP_RECONCILE_ENABLED=false`;
- `ASAAS_PAYOUT_RECOVERY_ENABLED=false`;
- `ENABLE_PIX_PAYOUT_WORKER=false`;
- `APP_NAME=goldeouro-backend-staging`.

Antes de `PaymentEngine.start()`, `server-fly.js` verifica que, em
`NODE_ENV=staging`, as três flags estão explicitamente `false`. Ausência, valor
inválido ou `true` impede o boot. O guard não é executado em produção.

O workflow:

- valida as três flags no TOML antes do build;
- aborta se elas estiverem armazenadas como Fly secrets e puderem sobrescrever
  a configuração versionada;
- mantém as oito flags PE explicitamente false;
- não altera secrets.

Os validadores de freeze/pipeline foram adaptados para exigir os três guards.

### Impacto

- Nenhum runtime foi alterado nesta etapa porque não houve deploy.
- Em futura RC staging, o processo HTTP inicia somente se schedulers e worker
  estiverem explicitamente desativados.
- Produção mantém a execução atual porque o guard é limitado a staging.

### Risco residual

- Um operador externo ainda pode tentar implantar outra configuração fora do
  pipeline; o guard de boot impedirá o startup staging inseguro.
- Side effects acionados explicitamente por endpoints não pertencem a R3; os
  timers automáticos ficam desativados.

## R4 — Metadata real e gates fatais

### Metadata do build

O Dockerfile recebe e persiste como metadata não sensível:

- commit;
- tag;
- versão do contrato;
- timestamp determinístico do commit.

O timestamp vem de `git show --format=%cI`, evitando timestamp arbitrário de
execução.

### Endpoint `/meta`

O endpoint operacional foi alterado apenas de forma observacional:

- `environment` deriva de `NODE_ENV`, com fallback `production` para preservar
  a V1;
- app deriva de `FLY_APP_NAME`/`APP_NAME`;
- SHA, tag, versão do contrato e timestamp vêm do artefato;
- expõe somente estados booleanos não sensíveis das oito flags PE;
- expõe estados de schedulers e worker;
- indica `shadowMode`.

Nenhum token, URL de banco ou credencial é exposto. Endpoints de negócio não
foram alterados.

### Gates pós-deploy

O workflow passa a exigir:

- `health.status=ok`;
- `health.database=connected`;
- app e ambiente staging;
- `shadowMode=true`;
- `productionRuntime=false`;
- SHA, tag, versão do contrato e timestamp idênticos ao build;
- oito flags PE false;
- schedulers financeiros false;
- worker financeiro false.

Divergência de SHA deixou de ser warning e passa a abortar.

### Risco residual

- `/meta` ainda depende da imagem ser implantada; certificação live pertence ao
  futuro RE.9.
- Actions e base image continuam flutuantes, reservadas para R7.
- Captura de baseline/rollback permanece para R5.

## Arquivos alterados

| Arquivo | Motivo |
|---|---|
| `fly.staging.toml` | R3: guards shadow explicitamente false; R4: app metadata |
| `server-fly.js` | R3: boot fail-closed staging; R4: `/meta` operacional |
| `Dockerfile` | R4: build metadata não sensível |
| `.github/workflows/backend-deploy-staging.yml` | R3/R4: pré e pós-gates |
| `scripts/pe2m2a-release-freeze.mjs` | Preservar freeze com guards R3 |
| `scripts/pe2b-staging-pipeline-validate.mjs` | Preservar validação estrutural R3 |
| `docs/relatorios/RE.9B.2R.2-CONTROLLED-REMEDIATION.md` | Evidência narrativa |
| `docs/relatorios/snapshots/re9b2r2-controlled-remediation.json` | Evidência estruturada |

Total: seis arquivos existentes modificados e dois artefatos criados.

## Auditoria pós-remediação

### Integridade

| Item | Resultado |
|---|---|
| Manifest canônico | Preservado |
| Release Freeze | Preservado e ampliado para guards R3 |
| Deterministic Contract | Preservado |
| Gates anti-produção | Preservados |
| Payment Engine (`src/`) | Intacta |
| R1 | A2R permanece sem deploy/Fly/secrets |
| R2 | Workflows permanecem sem `flyctl secrets set` |
| Baseline/tag | Não movidas |

### Drift antes/depois

Drift intencional:

- staging antes aceitava schedulers ausentes/default-on; agora o boot falha;
- `/meta` antes inventava `production`; agora reflete o runtime;
- SHA divergente antes alertava; agora aborta;
- health antes aceitava qualquer HTTP 2xx; agora valida status e banco.

Nenhum drift inesperado foi encontrado.

### Compatibilidade

| Referência | Compatível | Evidência |
|---|---|---|
| RE.9A | Sim | Corrige metadata/runtime identificados |
| RE.9B.1 | Sim | Manifest inalterado |
| RE.9B.2 | Sim | Reduz dependências implícitas |
| RE.9B.2R | Sim | Executa R3/R4 |
| RE.9B.2R.1 | Sim | R1/R2 continuam válidas |
| Baseline atual | Sim | Sem commit/tag/deploy |

## Validações

- 11 flags/guards `false` encontrados no TOML;
- literal `environment: 'production'` removido do `/meta`;
- estados não sensíveis presentes no metadata;
- SHA divergente configurado como erro fatal;
- health valida banco;
- zero `flyctl secrets set` nos dois workflows staging;
- zero arquivos em `src/` alterados por este gate;
- diagnósticos de editor: zero erros.

O shell local permaneceu indisponível; parser externo e testes Node não foram
executados. Nenhuma integração externa foi acionada.

## Impacto

| Dimensão | Alterada? | Justificativa |
|---|---|---|
| Comportamento funcional de negócio | Não | Rotas/regras financeiras intactas |
| Runtime atual | Não | Sem deploy |
| Runtime futuro staging | Sim, intencional | Boot fail-closed, timers off |
| Deployment contract | Sim | Gates mais estritos |
| Workflow | Sim | R3/R4 exclusivamente |
| Produção | Não | Sem deploy; fallback de `/meta` preserva `production` |
| Staging | Não | Nenhuma operação Fly |
| Banco | Não | Nenhuma escrita/conexão nesta etapa |

## Respostas obrigatórias

1. R3 concluída: **sim**.
2. R4 concluída: **sim**.
3. Arquivo fora do escopo: **não**.
4. Arquivos: **6 modificados + 2 criados = 8 tocados**.
5. Alteração em `src/`: **não**.
6. Alteração funcional de negócio: **não**.
7. Runtime atual alterado: **não**; contrato futuro staging: **sim, fail-closed**.
8. Workflow alterado: **sim, somente R3/R4**.
9. Manifest alterado: **não**.
10. Produção alterada: **não**.
11. Staging alterado: **não**.
12. Banco alterado: **não**.
13. Deploy realizado: **não**.
14. Commit criado: **não**.
15. Push realizado: **não**.
16. Tag criada/movida: **não**.
17. Regressões identificadas: **nenhuma na validação estática**.
18. Contrato mais determinístico: **sim**.
19. Risco residual diminuiu: **sim**.
20. R5 + R6 autorizadas: **sim, somente engenharia sem deploy**.
21. Evidências: **diff, buscas estáticas, lints, relatório e snapshot**.

## Veredito

**PASS**
