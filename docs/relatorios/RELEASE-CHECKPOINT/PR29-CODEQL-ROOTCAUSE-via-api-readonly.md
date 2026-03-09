# Causa raiz do CodeQL (PR #29) — via GitHub API (check-runs), READ-ONLY

**Data:** 2026-02-06  
**Modo:** Apenas leitura (gh api); nenhum arquivo editado.  
**Commit consultado:** 56189c16f3f2f6098ed70af3f5dcb929f742a8b7 (head do PR #29)

---

## 1) Passos executados

1. **SHA do head do PR:** `gh pr view 29 --json headRefOid` → `56189c16f3f2f6098ed70af3f5dcb929f742a8b7`
2. **Check-runs do commit:** `gh api .../repos/indesconectavel/gol-de-ouro/commits/<SHA>/check-runs` → salvo em `docs/relatorios/RELEASE-CHECKPOINT/PR29-checkruns.json`
3. **Extração:** do array `check_runs` foi localizado o run com `"name": "CodeQL"`.

---

## 2) CodeQL — dados extraídos do JSON

| Campo | Valor |
|-------|--------|
| **name** | CodeQL |
| **status** | completed |
| **conclusion** | **failure** |
| **details_url** | https://github.com/indesconectavel/gol-de-ouro/runs/62712563651 |
| **output.title** | 1 new alert including 1 high severity security vulnerability |
| **output.summary** | (texto abaixo) |
| **output.text** | null |
| **annotations_count** | 1 |
| **annotations_url** | https://api.github.com/repos/indesconectavel/gol-de-ouro/check-runs/62712563651/annotations |

### output.summary (transcrito)

```text
### New alerts in code changed by this pull request

Security Alerts:
 * 1 high

See annotations below for details.

[View all branch alerts](/indesconectavel/gol-de-ouro/security/code-scanning?query=pr%3A29+tool%3ACodeQL+is%3Aopen).
```

---

## 3) Diagnóstico

O CodeQL **não falhou** por erro de autobuild, configuração, monorepo ou permissão. A análise foi concluída e o check retornou **failure** porque **encontrou 1 novo alerta de segurança** no código alterado pelo PR: **1 vulnerabilidade de alta severidade**.

Ou seja:
- **Causa raiz:** **Alerta de code scanning** — CodeQL reportou 1 vulnerabilidade de alta gravidade no diff do PR.
- O repositório (ou a branch protection) está configurado para falhar o check quando há alertas abertos / novos findings de alta severidade.

---

## 4) Hipótese do motivo (baseada no output)

| Hipótese | Aplicável? |
|----------|------------|
| Monorepo / autobuild não construiu | **Não** — o summary fala em "New alerts" e "Security Alerts: 1 high", não em falha de build. |
| Config / linguagens / paths | **Não** — a análise rodou e produziu resultado (alertas). |
| Permissão | **Não** — o check completou e enviou output. |
| **Alerta de vulnerabilidade (finding)** | **Sim** — o título e o summary indicam 1 novo alerta de alta severidade no código alterado pelo PR; o check falha por política quando há tais alertas. |

**Conclusão:** O motivo do CodeQL em falha é **finding de segurança** (1 high), não falha técnica do pipeline. Para o check ficar verde é necessário: (1) corrigir ou mitigar a vulnerabilidade apontada pelo CodeQL no código do PR, ou (2) marcar o alerta como dismissed/accept risk no Security > Code scanning (conforme política do projeto).

---

## 5) Próximos passos sugeridos (somente referência)

1. Abrir **details_url** ou **Code scanning** do repositório filtrado por PR 29 e tool CodeQL:  
   https://github.com/indesconectavel/gol-de-ouro/security/code-scanning?query=pr%3A29+tool%3ACodeQL+is%3Aopen
2. Consultar a **annotation** (1) via `annotations_url` ou na UI do run para obter arquivo, linha e regra do alerta.
3. Corrigir o código ou tratar o alerta (dismiss/accept) conforme a política de segurança do repositório.

---

**Evidência bruta:** `docs/relatorios/RELEASE-CHECKPOINT/PR29-checkruns.json` (resposta da API de check-runs para o commit 56189c1).

*Relatório gerado em modo READ-ONLY; nenhuma alteração foi feita no repositório.*
