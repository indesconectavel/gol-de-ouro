# RE.9B.2R.4 — Controlled Remediation Execution (R7 + R8)

## Resultado

**ABORT — antes de qualquer alteração técnica.**

Nenhuma remediação R7 ou R8 foi aplicada.

## Pré-condições verificadas

| Pré-condição | Evidência | Estado |
|---|---|---|
| RE.9B.2R | Plano presente | PASS |
| RE.9B.2R.1 | Relatório/snapshot presentes | PASS |
| RE.9B.2R.2 | Relatório/snapshot presentes | PASS |
| RE.9B.2R.3 | Relatório/snapshot presentes | PASS |
| Manifest canônico | Presente e não alterado neste gate | PRESERVADO |
| Baseline local | Ref permanece `8cb00e9a576b6a5b2c784615cc5a55b26492c112` | PRESERVADA |
| Produção/staging/banco | Nenhuma operação executada | PRESERVADOS |
| Deploy pendente | Nenhum deploy iniciado por este gate; estado remoto não consultado | NÃO COMPROVADO REMOTAMENTE |
| Regressões abertas | Nenhuma regressão estática previamente reportada | PASS ESTÁTICO |

## Bloqueio contratual

O plano aprovado define R8 como:

```text
Commit engenharia → nova RC → nova tag revisionada
```

Também determina publicar as correções em nova RC/tag e manter a tag histórica
imutável.

O presente gate proíbe explicitamente modificar o manifest canônico.

Essas duas regras são incompatíveis com o contrato implementado em R6, que
exige:

```text
input expected_sha
= manifest release.sha
= manifest release.commit
= artifact.identity
= tag peeled
= checkout HEAD
```

Uma nova RC possui necessariamente novo commit e nova tag. Sem atualizar o
manifest, os campos continuariam em:

- tag `pe2m-shadow-staging-ready`;
- SHA `8cb00e9a576b6a5b2c784615cc5a55b26492c112`.

Logo, qualquer nova tag criada sobre as remediações falharia antes do build.
Criar commit/tag sem atualizar a fonte canônica produziria uma RC inválida.

## Circularidade de identidade

O schema atual exige que o SHA armazenado dentro do manifest seja igual ao SHA
do commit que contém esse mesmo manifest. Alterar o arquivo para inserir o SHA
modifica o commit e gera outro SHA.

Antes de R8 é necessária uma decisão arquitetural explícita:

1. utilizar `payload_sha` no manifest e resolver o release commit pela tag
   peeled; ou
2. armazenar a identidade final em atestação externa criada após o commit; ou
3. adotar outro modelo não autorreferencial aprovado pela governança.

Essa decisão exige alteração do manifest/contrato, proibida neste gate.

## Autorização de commit

O gate RE.9B original exige a frase:

`CONFIRMO RE.9B COMMIT`

Ela não foi fornecida nesta solicitação. Portanto, mesmo sem o bloqueio do
manifest, commit e tag não poderiam ser criados automaticamente.

## R7

R7 poderia tecnicamente alterar:

- `Dockerfile`;
- pins de GitHub Actions/flyctl;
- instalação npm;
- captura de digest OCI.

Entretanto, o critério deste gate exige R7 e R8 conjuntamente. Executar apenas
R7 produziria execução parcial e não autorizaria PASS. Para evitar estado
intermediário não certificado, R7 não foi iniciada.

## Alterações realizadas

Arquivos técnicos modificados: **zero**.

Arquivos de evidência criados:

- `docs/relatorios/RE.9B.2R.4-CONTROLLED-REMEDIATION.md`;
- `docs/relatorios/snapshots/re9b2r4-controlled-remediation.json`.

Nenhum arquivo em `src/`, workflow, Dockerfile, manifest, runtime ou pipeline foi
alterado.

## Impacto

| Dimensão | Alterada? |
|---|---|
| Comportamento funcional | Não |
| Runtime atual | Não |
| Deployment | Não |
| Workflow | Não |
| Manifest | Não |
| Staging | Não |
| Produção | Não |
| Banco | Não |
| Payment Engine | Não |
| PIX/Wallet/Ledger | Não |

## Drift

Nenhum drift foi introduzido. O working tree permanece com as remediações
anteriores, sem alterações R7/R8.

## Próximo passo necessário

Dividir a execução:

1. **RE.9B.2R.4A — Artifact Reproducibility (R7)**, sem commit/tag/deploy;
2. **RE.9B.2R.4B — Release Identity Model**, autorizando explicitamente a
   atualização do manifest para eliminar autorreferência;
3. revisão/dry-run;
4. autorização humana `CONFIRMO RE.9B COMMIT`;
5. commit da nova RC;
6. nova tag revisionada sem mover a tag histórica.

R9 não pode iniciar enquanto R7/R8 permanecerem incompletas.

## Respostas obrigatórias

1. R7 concluída: **não**.
2. R8 concluída: **não**.
3. Arquivo fora do escopo alterado: **não**.
4. Arquivos técnicos modificados: **0**; evidências criadas: **2**.
5. Alteração em `src/`: **não**.
6. Alteração funcional: **não**.
7. Runtime atual alterado: **não**.
8. Workflow alterado: **não**.
9. Manifest alterado: **não**.
10. Produção alterada: **não**.
11. Staging alterado: **não**.
12. Banco alterado: **não**.
13. Deploy realizado: **não**.
14. Commit criado: **não**.
15. Push realizado: **não**.
16. Tag criada/movida: **não**.
17. Regressões identificadas: **nenhuma; execução abortada antes das mudanças**.
18. Contrato mais determinístico neste gate: **não**.
19. Risco residual reduzido neste gate: **não**.
20. Resta apenas R9: **não; R7 e R8 continuam pendentes**.
21. R9 autorizada: **não**.
22. Evidências: **plano R8, restrição do manifest, cadeia de igualdade R6 e
    snapshot deste ABORT**.

## Veredito

**ABORT**
