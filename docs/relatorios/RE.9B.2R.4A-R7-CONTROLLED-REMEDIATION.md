# RE.9B.2R.4A — Controlled Remediation Execution (R7)

## Veredito

**PASS — R7 concluída sem alteração da identidade do release.**

Somente a reprodutibilidade do artefato e da toolchain de staging foi
endurecida. R8 e R9 não foram iniciadas.

## Pré-condições

| Item | Evidência | Estado |
|---|---|---|
| RE.9B.2R | Plano oficial presente e aprovado | PASS |
| RE.9B.2R.1 | Relatório/snapshot presentes | PASS |
| RE.9B.2R.2 | Relatório/snapshot presentes | PASS |
| RE.9B.2R.3 | Relatório/snapshot presentes | PASS |
| Manifest canônico | Tag e SHA permanecem `pe2m-shadow-staging-ready` / `8cb00e9a576b6a5b2c784615cc5a55b26492c112` | PASS |
| Baseline | Release identity histórica preservada | PASS |
| Produção | `/health` OK, banco conectado, runtime production | PASS READ-ONLY |
| Staging | `/health` OK, banco conectado, runtime não produtivo; `/meta` acessível | PASS READ-ONLY |
| Deploy pendente | Nenhum deploy iniciado por este gate; fila privada não acessível pelo ambiente local | NÃO CRIADO PELO GATE |
| Regressões abertas | Nenhuma regressão estática previamente reportada | PASS |

As consultas públicas de health/meta foram somente leitura. Nenhum endpoint
mutável, Fly API, banco ou secret foi acessado.

## R7 executada

### Toolchain imutável

- `actions/checkout` fixada em
  `34e114876b0b11c390a56381ad16ebd13914f8d5`;
- `actions/setup-node` fixada em
  `49933ea5288caeca8642d1e84afbd3f7d6820020`;
- `actions/upload-artifact` fixada em
  `ea165f8d65b6e75b540449e92b4886f43607fa02`;
- `superfly/flyctl-actions/setup-flyctl` fixada em
  `ed8efb33836e8b2096c7fd3ba1c8afe303ebbff1`;
- binário `flyctl` fixado na versão `0.4.71`;
- Node do CI fixado em `20.20.2`;
- runner trocado de `ubuntu-latest` para `ubuntu-24.04`;
- A2R continua read-only e agora usa checkout imutável.

Os SHAs foram resolvidos nas APIs oficiais do GitHub em 2026-07-17. A versão
do flyctl foi confirmada na release oficial mais recente do mesmo dia.

### Build reproduzível

Antes:

```text
FROM node:20-alpine
RUN npm install --only=production
```

Depois:

```text
FROM node:20.20.2-alpine3.22@sha256:8f47899606d000b0704e992f927fe7335adcd0d6c98851600072fb6e14a13e60
RUN npm ci --omit=dev
```

O digest é o índice OCI oficial multi-arquitetura publicado no Docker Hub.
O lockfile passa a ser obrigatório e nenhuma resolução permissiva por
`npm install` permanece no Dockerfile.

### Provenance OCI

O workflow passa a:

1. capturar `flyctl image show --json` no preflight;
2. validar o digest atual no formato `sha256:<64 hex>`;
3. capturar e validar o digest pós-deploy;
4. registrar tag, SHA Git, digest OCI e imagem base em
   `evidence/re9b-deployment/deployed-artifact.json`;
5. publicar a evidência pelo artifact já previsto em R5.

O manifest não foi usado como destino desse registro porque sua alteração é
explicitamente proibida neste gate. A evidência operacional é produzida
somente quando um deployment futuro e autorizado ocorrer.

## Arquivos alterados

| Arquivo | Alteração R7 |
|---|---|
| `Dockerfile` | Base Node fixada por versão/digest; `npm ci --omit=dev` |
| `.github/workflows/backend-deploy-staging.yml` | Actions, Node, flyctl e runner fixados; captura do digest OCI |
| `.github/workflows/a2r-staging-asaas-sandbox.yml` | Runner e checkout fixados, sem capacidade de deploy |
| `scripts/validate-staging-deployment-contract.mjs` | Gates estáticos para pins, base OCI, npm ci e evidence digest |
| `docs/relatorios/RE.9B.2R.4A-R7-CONTROLLED-REMEDIATION.md` | Relatório deste gate |
| `docs/relatorios/snapshots/re9b2r4a-r7-controlled-remediation.json` | Snapshot auditável |

Total: **4 arquivos existentes modificados + 2 artefatos criados = 6 arquivos
tocados**.

## Auditoria pós-remediação

### Integridade

- manifest canônico: preservado;
- release freeze: preservado;
- cadeia SHA → tag → manifest: inalterada;
- commit/tag/SHA: nenhum criado ou alterado;
- runtime atual: preservado;
- `src/`: zero alterações;
- Payment Engine: preservada;
- R1–R6: seus guards e comportamentos permanecem presentes;
- produção/staging: somente health/meta públicos consultados.

### Determinismo

**O determinismo aumentou objetivamente.**

Foram eliminadas as resoluções implícitas de:

- major tags de GitHub Actions;
- branch `master` da action do flyctl;
- versão `latest` do binário flyctl;
- versão móvel do Node no CI;
- alias móvel da imagem Node;
- resolução permissiva de dependências por `npm install`;
- ausência de registro do digest OCI implantado.

Dependências residuais:

- `ubuntu-24.04` é menos ambíguo que `ubuntu-latest`, mas a imagem hospedada
  ainda recebe atualizações;
- GitHub Actions, Docker Hub e Fly registry continuam serviços externos;
- o schema de `flyctl image show --json` será exercitado no dry-run autorizado;
- o digest final depende do builder Fly e só pode ser comprovado após build;
- R8 ainda é necessária para publicar uma nova identidade Git contendo R1–R7.

### Drift antes/depois

O drift é esperado e restrito ao contrato de build/deploy futuro:

- referências móveis foram substituídas por pins;
- a instalação Docker tornou-se lockfile-strict;
- evidência de digest OCI foi adicionada;
- nenhum arquivo funcional, runtime, manifest ou release identity sofreu drift.

Não foi identificado drift inesperado.

### Compatibilidade

- RE.9A: compatível; reduz dependências implícitas;
- RE.9B.1: compatível; manifest intacto;
- RE.9B.2: compatível; aumenta reprodutibilidade;
- RE.9B.2R: executa exclusivamente R7;
- RE.9B.2R.1: R1/R2 preservadas;
- RE.9B.2R.2: R3/R4 preservadas;
- RE.9B.2R.3: R5/R6 preservadas e evidence ampliada.

## Evidências

### Buscas

- pins `uses:` encontrados somente por SHA nos dois workflows de staging;
- `ubuntu-latest` removido dos dois workflows;
- `node:20-alpine` e `npm install` removidos do Dockerfile;
- `flyctl image show` presente em preflight e postflight;
- `deployed-artifact.json` presente no workflow e validator;
- nenhuma assinatura R7 encontrada em `src/`;
- manifest lido e mantido com a identidade histórica.

### Fontes dos pins

- GitHub API: `actions/checkout`, tag `v4`;
- GitHub API: `actions/setup-node`, tag `v4`;
- GitHub API: `actions/upload-artifact`, tag `v4`;
- GitHub API: branch protegida `superfly/flyctl-actions/master`;
- GitHub API: release `superfly/flyctl` v0.4.71;
- Docker Hub API: `library/node:20.20.2-alpine3.22`.

### Validators e lints

- validator R7 atualizado para rejeitar action refs móveis, Node não fixado,
  imagem sem digest, `npm install` e ausência de evidência OCI;
- lint do editor: **zero diagnósticos** nos quatro arquivos existentes
  alterados;
- execução dos quatro validators Node e parser YAML: **bloqueada pelo ambiente
  local**, que falha antes do comando com
  `System.Management.Automation.LanguagePrimitives` (exit `-65536`);
- inspeção estrutural e buscas dedicadas não identificaram regressão.

Nenhum dry-run, deploy ou mutação remota foi usado para contornar a falha do
shell.

## Respostas obrigatórias

1. R7 foi concluída? **Sim.**
2. Algum arquivo fora do escopo foi alterado? **Não.**
3. Quantos arquivos foram modificados? **6 tocados: 4 modificados e 2 criados.**
4. Alguma alteração atingiu `src/`? **Não.**
5. Houve alteração funcional? **Não.**
6. Houve alteração do runtime atual? **Não.**
7. Houve alteração do workflow? **Sim, exclusivamente para R7.**
8. Houve alteração do Manifest? **Não.**
9. Houve alteração de SHA? **Não.**
10. Houve criação de commit? **Não.**
11. Houve criação de tag? **Não.**
12. Produção foi alterada? **Não.**
13. Staging foi alterado? **Não.**
14. Deploy foi realizado? **Não.**
15. Regressões identificadas? **Não na auditoria estática; execução local bloqueada pelo shell.**
16. O contrato tornou-se mais determinístico? **Sim.**
17. R8 permanece pendente? **Sim.**
18. A etapa RE.9B.2R.4B está autorizada? **Não por este gate; exige autorização explícita.**
19. Quais evidências comprovam a conclusão? **Diff R7, pins oficiais, buscas, validator, lint, health/meta públicos, relatório e snapshot.**
20. Houve necessidade de ABORT? **Não.**

