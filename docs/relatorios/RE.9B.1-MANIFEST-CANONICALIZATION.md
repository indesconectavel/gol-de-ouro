# RE.9B.1 — Manifest Canonicalization

## Estado inicial

- Branch de engenharia: `re/9b-staging-deployment-contract`
- Base local: `8cb00e9a576b6a5b2c784615cc5a55b26492c112`
- RC histórica: `pe2m-shadow-staging-ready`
- Produção e staging: não acessados
- Deploy, commit, push e tag: não executados

O estado inicial continha duas estruturas com metadata de release equivalente. O
workflow consumia `docs/payment-engine/staging/release-manifest.json`, enquanto
o verificador da RC consumia o mirror em `staging-final`. Os dois arquivos
divergiam em `release.frozen`, estrutura e autoridade.

## Manifests encontrados

| Caminho | Função inicial | Consumido? | Estado inicial |
|---|---|---|---|
| `docs/payment-engine/staging/release-manifest.json` | Manifest operacional de deploy | Workflow, freeze helper e pipeline validator | `frozen=false`, SHA placeholder |
| `docs/payment-engine/staging-final/release-manifest.json` | Mirror de certificação | RC verifier | `frozen=true`, SHA placeholder |
| `docs/payment-engine/staging-final/release-manifest-audit.json` | Evidência histórica de auditoria | Não | Snapshot, sem autoridade operacional |

Não foram encontrados outros `manifest.json` ou arquivos de release metadata
com autoridade sobre o deploy.

## Workflow consumidor

`.github/workflows/backend-deploy-staging.yml` lê exclusivamente:

`docs/payment-engine/staging/release-manifest.json`

As leituras são feitas por `jq` para `release.tag`, `release.sha` e
`release.frozen`. Não existe arquivo intermediário, composite action ou reusable
workflow para resolver o manifest.

Consumidores auxiliares após a canonização:

- `scripts/pe2b-staging-pipeline-validate.mjs`
- `scripts/pe2m2a-release-freeze.mjs`
- `scripts/verify-release-candidate.mjs`

Todos apontam somente para o manifest canônico.

## Comparação completa

| Campo | Operacional antes | Mirror antes | Canônico depois |
|---|---|---|---|
| Autoridade | Implícita | Ambígua | Explícita: canônica e operacional |
| `release.frozen` | `false` | `true` | `true` |
| Tag | `pe2m-shadow-staging-ready` | Igual | Igual |
| SHA/commit | Placeholder | Placeholder | `8cb00e9a576b6a5b2c784615cc5a55b26492c112` |
| Branch | `pe/pe2b-staging-deploy` | Igual | `pe/rc-pe2m-shadow` |
| App | Em `deploy.fly_app` | Duplicado | `target.app` + compatibilidade em `deploy` |
| Environment | Implícito | Implícito | `target.environment=staging` |
| Contract version | Ausente | Ausente | `RE.9B.1` |
| Artifact identity | Placeholder | Placeholder | Git commit original |
| Estrutura | Operacional extensa | Mirror parcial | Operacional normalizada |

## Drift encontrado

O drift era material:

1. `release.frozen` possuía valores opostos.
2. ambos continham placeholders de SHA;
3. ambos duplicavam tag, branch, app e metadata;
4. workflow e verifier consultavam arquivos diferentes;
5. o freeze helper escrevia os dois arquivos.

## Justificativa arquitetural

Foi escolhido `docs/payment-engine/staging/release-manifest.json` porque:

- já era a fonte efetivamente consumida pelo workflow;
- já era consumido pelo pipeline validator;
- o antigo mirror declarava esse caminho como canônico;
- representa conjuntamente release e alvo de deploy;
- minimiza mudança de integração e elimina autoridade concorrente.

O SHA registrado neste tijolo identifica a RC histórica publicada. O contrato
de igualdade dinâmica entre tag, checkout, manifest e input será implementado
no RE.9B.2, sem mover a tag original.

## Manifest escolhido

Manifest canônico único:

`docs/payment-engine/staging/release-manifest.json`

Autoridade:

- `authority.canonical=true`
- `authority.operational=true`
- `authority.scope=staging_deployment`

## Eliminação do drift

`docs/payment-engine/staging-final/release-manifest.json` foi convertido em um
ponteiro legado não operacional. Ele não duplica release, SHA, tag, frozen,
target ou metadata. Sua única função é preservar compatibilidade documental do
caminho e apontar para o canônico.

O freeze helper deixou de escrever o arquivo legado. O RC verifier passou a
consultar o canônico.

## Alterações realizadas

| Arquivo | Alteração | Relação com RE.9B.1 |
|---|---|---|
| `docs/payment-engine/staging/release-manifest.json` | Normalizado e pinado à RC histórica | Fonte canônica |
| `docs/payment-engine/staging-final/release-manifest.json` | Convertido em ponteiro legado | Remove autoridade concorrente |
| `scripts/verify-release-candidate.mjs` | Referência movida para o canônico | Elimina consumidor divergente |
| `scripts/pe2m2a-release-freeze.mjs` | Passa a escrever apenas o canônico | Impede recriação do drift |
| `docs/relatorios/RE.9B.1-MANIFEST-CANONICALIZATION.md` | Evidência narrativa | Governança |
| `docs/relatorios/snapshots/re9b1-manifest-canonicalization.json` | Snapshot estruturado | Rastreabilidade |

O workflow não precisou ser alterado: já apontava exclusivamente para o caminho
escolhido.

## Validação estática

- um manifest operacional;
- workflow com um único caminho de manifest;
- consumidores executáveis sem referência ao mirror;
- nenhum placeholder nos dois arquivos de release manifest;
- tag, SHA, frozen, branch, ambiente e app consistentes no canônico;
- mirror sem campos operacionais duplicados;
- nenhuma alteração no código da aplicação.

O shell local permaneceu indisponível por falha de inicialização do PowerShell.
Por isso, não foram executados parser externo, testes Node ou comandos Git. A
validação foi feita por leitura estruturada, busca de referências e
diagnósticos do editor.

## Riscos

- O contrato de comparação dinâmica entre tag, checkout, manifest e input ainda
  pertence ao RE.9B.2.
- A futura RC corrigida exigirá novo SHA e nova tag; a tag histórica não pode
  ser movida.
- Relatórios históricos continuam descrevendo o estado anterior, por desenho;
  não possuem autoridade operacional.

## Compatibilidade

O caminho consumido pelo workflow foi preservado. O caminho legado continua
existindo, mas declara explicitamente ausência de autoridade e aponta para a
fonte canônica.

## Limitações

Este tijolo não altera lógica de deploy, secrets, rollback, runtime, flags,
schedulers, workers, banco ou smoke tests.

## Matriz final

| Item | Antes | Depois | Status |
|---|---|---|---|
| Manifest operacional | `staging/release-manifest.json` não pinado | Mesmo caminho, canônico e pinado | PASS |
| Manifest documental | Mirror com metadata duplicada | Ponteiro legado sem autoridade | PASS |
| Workflow | Lia o operacional antigo | Lê somente o canônico | PASS |
| Drift | Presente | Autoridade operacional única | PASS |
| SHA | Placeholder | `8cb00e9a...` | PASS |
| Frozen | Divergente | `true` somente no canônico | PASS |
| Tag | Duplicada | Autoridade somente no canônico | PASS |
| Branch | Branch antiga | `pe/rc-pe2m-shadow` | PASS |

## Próximos passos

Executar RE.9B.2 para implementar pinning dinâmico, igualdade
tag/SHA/checkout/manifest, remoção de mutações de secrets e guards
anti-produção. Nenhum deploy é autorizado por este relatório.

## Veredito

PASS
