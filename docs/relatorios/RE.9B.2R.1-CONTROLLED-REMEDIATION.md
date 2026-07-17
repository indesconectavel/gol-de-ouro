# RE.9B.2R.1 — Controlled Remediation Execution (R1 + R2)

## Escopo executado

Somente as remediações R1 e R2 do plano RE.9B.2R foram implementadas.

- **R1:** desarmar o workflow A2R como segundo deployer de staging.
- **R2:** retirar mutações de Fly secrets do deployer canônico e mover as oito
  flags não secretas para configuração versionada.

Nenhum item R3–R9 foi iniciado.

## Pré-condições

| Pré-condição | Evidência | Estado |
|---|---|---|
| Plano RE.9B.2R aprovado | `docs/relatorios/RE.9B.2R-REMEDIATION-PLAN.md` | PASS |
| Branch de engenharia | `.git/worktrees/.../HEAD` aponta para `re/9b-staging-deployment-contract` | PASS |
| Base preservada | ref local da branch permanece em `8cb00e9a576b6a5b2c784615cc5a55b26492c112` | PASS |
| Manifest canônico | `docs/payment-engine/staging/release-manifest.json` não foi alterado neste gate | PASS |
| Produção/staging/banco | Nenhuma operação externa foi executada | PRESERVADOS |
| Deploy pendente | Nenhum workflow ou deploy foi iniciado por este gate; estado remoto não foi consultado | NÃO CRIADO PELO GATE |

## R1 — A2R sem capacidade de deploy

### Antes

`a2r-staging-asaas-sandbox.yml`:

- aceitava SHA e tag substituíveis;
- alterava Fly secrets;
- executava `flyctl deploy` no mesmo app do deployer canônico;
- utilizava concurrency group independente.

### Depois

O workflow:

- executa somente auditoria estática;
- não aceita SHA/tag de deploy;
- não acessa Fly;
- não referencia secrets;
- não altera configuração ou runtime;
- não contém comando de deploy;
- verifica documentalmente a autoridade do manifest e do workflow canônicos;
- usa o mesmo domínio de concorrência do contrato de staging.

### Impacto

O único workflow com capacidade de implantar código em
`goldeouro-backend-staging` passa a ser
`.github/workflows/backend-deploy-staging.yml`.

### Risco residual

- O canal A2R deixa de provisionar sandbox; qualquer futura configuração Asaas
  exigirá gate próprio.
- Actions ainda usam referências flutuantes; isso pertence a R7.

## R2 — Deploy sem mutação de secrets

### Antes

O workflow canônico executava dois blocos `flyctl secrets set`:

1. oito flags PE antes do deploy;
2. metadata, ambiente e as oito flags após o deploy.

### Depois

- Os dois blocos foram removidos.
- As oito flags estão explicitamente versionadas como `"false"` em
  `fly.staging.toml`.
- O workflow valida os oito valores antes do build.
- O workflow lista apenas nomes de secrets e aborta se qualquer configuração
  pública estiver persistida como secret e puder sobrescrever o TOML.
- `DATABASE_URL` e `FLY_API_TOKEN` continuam apenas como secrets reais
  preexistentes; nenhum valor é exibido ou alterado.
- O deploy não corrige drift automaticamente: ele falha fechado e solicita gate
  específico.

### Compatibilidade dos validadores

Os validadores diretamente afetados foram adaptados:

- `pe2m2a-release-freeze.mjs` procura as oito flags no TOML;
- `pe2b-staging-pipeline-validate.mjs` exige as oito flags no TOML e rejeita
  `flyctl secrets set` no workflow.

### Risco residual

Se o app Fly ainda possuir `GIT_TAG`, `NODE_ENV`, `DATABASE_ENV` ou alguma flag
PE armazenada como secret, o novo workflow abortará antes do deploy. A remoção
desses secrets não pertence a este gate e exigirá autorização específica.

## Arquivos alterados

| Arquivo | Tipo | Motivo |
|---|---|---|
| `.github/workflows/a2r-staging-asaas-sandbox.yml` | Modificado | R1: remover deploy e mutações |
| `.github/workflows/backend-deploy-staging.yml` | Modificado | R1 concurrency + R2 sem secrets set |
| `fly.staging.toml` | Modificado | R2: flags não secretas versionadas |
| `scripts/pe2m2a-release-freeze.mjs` | Modificado | Preservar freeze após mudança da fonte das flags |
| `scripts/pe2b-staging-pipeline-validate.mjs` | Modificado | Preservar gate estrutural de R2 |
| `docs/relatorios/RE.9B.2R.1-CONTROLLED-REMEDIATION.md` | Criado | Evidência narrativa |
| `docs/relatorios/snapshots/re9b2r1-controlled-remediation.json` | Criado | Evidência estruturada |

Total: cinco arquivos existentes modificados e dois artefatos criados.

## Auditoria pós-remediação

### Integridade

| Item | Resultado |
|---|---|
| Manifest canônico preservado | PASS |
| Release freeze preservado | PASS — fonte das flags atualizada para TOML |
| Gates anti-produção preservados | PASS |
| Runtime da aplicação preservado | PASS — nenhum arquivo em `src/` ou `server-fly.js` alterado |
| Payment Engine preservada | PASS |
| Oito flags | Explicitamente false no TOML |
| Mutação de secrets no deployer canônico | Ausente |
| Mutação/deploy no A2R | Ausente |

### Drift antes/depois

O drift identificado é intencional e limitado ao contrato:

- A2R: deployer mutável → auditor estático;
- flags: Fly secrets mutáveis → TOML versionado;
- workflow: correção automática de configuração → validação fail-closed.

Nenhum drift funcional inesperado foi identificado.

### Compatibilidade

| Referência | Compatível | Motivo |
|---|---|---|
| RE.9A | Sim | Remove exatamente os bloqueadores de secrets/A2R |
| RE.9B.1 | Sim | Manifest canônico permanece inalterado |
| RE.9B.2R | Sim | Executa somente R1 e R2 |
| Baseline `8cb00e9a...` | Sim | Tag, SHA e branch ref não foram movidos |

## Validações executadas

- busca por comandos Fly/mutações/secrets no A2R: zero;
- busca por `flyctl secrets set` no deployer canônico: zero;
- presença das oito flags `false` no TOML: oito de oito;
- busca por alterações RE.9B.2R.1 em `src/`: zero;
- diagnósticos de editor nos cinco arquivos: zero erros.

O shell local continuou indisponível; portanto, não foram executados parser
externo, testes Node ou comandos Git. Nenhuma integração externa foi acionada.

## Impacto

| Dimensão | Alterada? | Justificativa |
|---|---|---|
| Comportamento funcional | Não | Código da aplicação intacto |
| Runtime atual | Não | Nenhum deploy/restart/configuração externa |
| Contrato de deployment | Sim | R1 e R2 intencionalmente endurecem o contrato |
| Staging | Não | Nenhuma chamada Fly |
| Produção | Não | Nenhum arquivo/workflow produtivo ou chamada externa |
| Banco | Não | Nenhuma conexão ou comando |
| PIX/Wallet/Ledger | Não | Nenhum código financeiro alterado/executado |

## Respostas obrigatórias

1. R1 concluída: **sim**.
2. R2 concluída: **sim**.
3. Arquivo fora do escopo alterado: **não**.
4. Arquivos: **5 modificados + 2 criados = 7 tocados**.
5. Alteração funcional: **não**.
6. Alteração do runtime atual: **não**.
7. Alteração de workflow: **sim, exclusivamente R1/R2**.
8. Alteração do manifest: **não**.
9. Produção alterada: **não**.
10. Staging alterado: **não**.
11. Banco alterado: **não**.
12. Deploy realizado: **não**.
13. Commit criado: **não**.
14. Push realizado: **não**.
15. Tag criada/movida: **não**.
16. Regressões identificadas: **nenhuma; possível secret legado causa abort fail-closed**.
17. Contrato mais determinístico: **sim**.
18. Rollback necessário: **não**.
19. R3 + R4 autorizadas: **sim para engenharia em branch, sem deploy**.
20. Evidências: **diff dos cinco arquivos, buscas estáticas, lints e snapshot**.

## Veredito

**PASS**
