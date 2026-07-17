# RE.9B.2R.3 — Controlled Remediation Execution (R5 + R6)

## Escopo

Somente R5 e R6 foram implementadas:

- **R5:** baseline staging read-only, evidência persistida e rollback por versão
  exata;
- **R6:** contrato de inputs imutáveis, igualdade tag/SHA/checkout/manifest,
  validações obrigatórias e dry-run sem deploy.

R1–R4 foram preservadas. R7–R9 não foram iniciadas.

## Pré-condições

| Pré-condição | Evidência | Estado |
|---|---|---|
| RE.9B.2R | Plano presente | PASS |
| RE.9B.2R.1 | Relatório/snapshot presentes | PASS |
| RE.9B.2R.2 | Relatório/snapshot presentes | PASS |
| Manifest canônico | Não alterado neste gate | PASS |
| Baseline local | Ref permanece `8cb00e9a576b6a5b2c784615cc5a55b26492c112` | PASS |
| Produção/staging/banco | Nenhuma operação executada | PRESERVADOS |
| Deploy pendente | Nenhum deploy iniciado pelo gate; estado remoto não consultado | NÃO CRIADO PELO GATE |
| Regressões abertas | Nenhuma regressão estática R1–R4 | PASS |

## R5 — Baseline e rollback determinístico

### Captura antes do deploy futuro

O workflow passa a registrar, em modo read-only:

- status do app staging;
- inventário de releases;
- inventário de machines e imagens;
- health e metadata correntes;
- versão exata da release de rollback;
- imagem atual, quando disponível;
- timestamp UTC da captura;
- tag e SHA alvo;
- comando exato de rollback.

Os arquivos são armazenados em `evidence/re9b-deployment` e publicados como
artifact do GitHub Actions com retenção de 30 dias.

### Rollback

O rollback futuro:

- só pode executar após tentativa real de deploy;
- só dispara por falha do deploy, health ou metadata;
- utiliza a versão capturada antes do deploy;
- fixa explicitamente `goldeouro-backend-staging`;
- valida `/health` após o rollback;
- nunca referencia o app produtivo.

O rollback não foi executado neste gate.

### Risco residual

- O schema JSON do flyctl será certificado no dry-run futuro.
- `actions/upload-artifact@v4` e flyctl ainda não estão pinados por SHA; R7.
- Se a release atual não puder ser determinada, o workflow aborta antes do
  deploy.

## R6 — Contrato e dry-run

### Inputs obrigatórios

O workflow exige:

- `release_tag`;
- `expected_sha` completo;
- `confirm_staging=STAGING`;
- `dry_run`.

Não existe fallback para `main`, `dev`, `master`, `latest` ou `HEAD`.
Somente tags `pe2m-shadow-staging-ready` ou sucessoras `-rN` são aceitas.

### Cadeia de igualdade

Antes do build, o workflow exige:

```text
input expected_sha
= manifest release.sha
= manifest release.commit
= artifact.identity
= tag peeled
= checkout HEAD
```

Também valida:

- manifest frozen;
- tag do manifest igual ao input;
- target environment staging;
- target app igual ao app fixo;
- contract version presente.

### Validações obrigatórias

O validator antes opcional tornou-se obrigatório. A sequência executa:

1. `validate-staging-deployment-contract.mjs`;
2. `pe2b-staging-pipeline-validate.mjs`;
3. `pe2m-shadow-final-smoke.mjs`;
4. `verify-pe2m-shadow-final.mjs`.

Foi criado um validator estático dedicado que comprova:

- autoridade do manifest;
- inputs e guards do workflow;
- ausência de mutação de secrets;
- A2R somente read-only;
- flags e runtime guards no TOML;
- metadata e fail-closed staging.

### Dry-run

Com `dry_run=true`:

- checkout, manifest, scripts, secrets names, banco e baseline são verificados;
- evidências são publicadas;
- não há build/deploy;
- health/meta pós-deploy são pulados;
- rollback é impossível;
- produção não é consultada;
- nenhuma configuração é alterada.

### Scripts alinhados

- `pe2m2a-release-freeze.mjs` tornou-se verificador read-only do freeze,
  derivando branch/tag/SHA do manifest e sem reescrever o arquivo;
- `verify-release-candidate.mjs` deriva branch/SHA defaults do manifest;
- `pe2b-staging-pipeline-validate.mjs` valida inputs explícitos, sem tag
  hardcoded.

### Risco residual

- O manifest atual ainda representa a RC histórica; nova RC/tag é R8.
- Toolchain/base image continuam mutáveis; R7.
- Docs históricas permanecem para R9.
- O dry-run foi implementado, mas não executado neste gate.

## Arquivos

| Arquivo | Tipo | Motivo |
|---|---|---|
| `.github/workflows/backend-deploy-staging.yml` | Modificado | R5 baseline/rollback/artifact; R6 inputs/dry-run/gates |
| `scripts/pe2m2a-release-freeze.mjs` | Modificado | R6 freeze read-only e derivado do manifest |
| `scripts/verify-release-candidate.mjs` | Modificado | R6 defaults canônicos |
| `scripts/pe2b-staging-pipeline-validate.mjs` | Modificado | R6 inputs explícitos |
| `scripts/validate-staging-deployment-contract.mjs` | Criado | R6 validator estático |
| `docs/relatorios/RE.9B.2R.3-CONTROLLED-REMEDIATION.md` | Criado | Evidência |
| `docs/relatorios/snapshots/re9b2r3-controlled-remediation.json` | Criado | Snapshot |

Total: quatro arquivos existentes modificados e três arquivos criados.

## Auditoria pós-remediação

### Integridade

| Item | Resultado |
|---|---|
| Manifest canônico | Preservado |
| Release Freeze | Preservado e convertido para verificação read-only |
| Deterministic Deployment Contract | Ampliado |
| Gates R1–R4 | Preservados |
| Runtime atual | Preservado |
| Payment Engine / `src/` | Preservada |
| A2R | Continua sem deploy/Fly/secrets |
| Secrets set | Continua ausente nos workflows staging |

### Determinismo

Antes:

- rollback dependia da “release anterior” implícita;
- tag e SHA eram hardcoded;
- validator podia ser ignorado;
- não existia dry-run;
- freeze helper reescrevia o manifest.

Depois:

- rollback usa versão capturada;
- tag e SHA são inputs obrigatórios comparados em seis pontos;
- validações são obrigatórias;
- dry-run bloqueia etapas mutáveis;
- freeze é somente leitura.

Fontes ainda dependentes do ambiente:

- estado live do Fly;
- secrets reais preexistentes;
- banco staging;
- actions, runner, flyctl e base image flutuantes (R7).

### Drift

O drift é intencional e restrito ao pipeline. Nenhum drift funcional ou de
runtime atual foi identificado.

### Compatibilidade

| Gate | Compatível |
|---|---|
| RE.9A | Sim |
| RE.9B.1 | Sim — manifest intacto |
| RE.9B.2 | Sim — reduz caminhos implícitos |
| RE.9B.2R | Sim — executa R5/R6 |
| RE.9B.2R.1 | Sim — R1/R2 preservadas |
| RE.9B.2R.2 | Sim — R3/R4 preservadas |
| Baseline atual | Sim — sem commit/tag/deploy |

## Validações e buscas

- quatro inputs obrigatórios encontrados;
- igualdade por `TAG_SHA`, `EXPECTED_SHA`, manifest e checkout encontrada;
- baseline/rollback versionados encontrados;
- upload de artifact encontrado;
- deploy/health/meta condicionados a `dry_run=false`;
- defaults antigos de branch/SHA removidos dos scripts;
- zero alterações em `src/`;
- manifest canônico preservado;
- zero diagnósticos de editor.

Limitação: o shell local permaneceu indisponível. Não foram executados Node,
parser YAML, Git diff ou dry-run GitHub. Nenhuma integração externa ocorreu.

## Impacto

| Dimensão | Alterada? | Justificativa |
|---|---|---|
| Comportamento funcional | Não | Aplicação e domínio intactos |
| Runtime atual | Não | Sem deploy |
| Deployment | Sim | R5/R6 endurecem o futuro pipeline |
| Workflow | Sim | Inputs, baseline, rollback e dry-run |
| Staging | Não | Nenhuma operação Fly executada |
| Produção | Não | Nenhuma operação ou arquivo produtivo |
| Banco | Não | Nenhuma consulta executada neste gate |

## Respostas obrigatórias

1. R5 concluída: **sim**.
2. R6 concluída: **sim**.
3. Arquivo fora do escopo: **não**.
4. Arquivos: **4 modificados + 3 criados = 7 tocados**.
5. Alteração em `src/`: **não**.
6. Alteração funcional: **não**.
7. Runtime atual alterado: **não**.
8. Workflow alterado: **sim, somente R5/R6**.
9. Manifest alterado: **não**.
10. Produção alterada: **não**.
11. Staging alterado: **não**.
12. Banco alterado: **não**.
13. Deploy realizado: **não**.
14. Commit criado: **não**.
15. Push realizado: **não**.
16. Tag criada/movida: **não**.
17. Regressões: **nenhuma na validação estática**.
18. Contrato mais determinístico: **sim**.
19. Risco residual reduzido: **sim**.
20. Restam apenas R7–R9: **sim**.
21. R7–R9 autorizadas: **somente engenharia, sem deploy**.
22. Evidências: **diff, buscas, lints, relatório, snapshot e validator**.

## Veredito

**PASS**
