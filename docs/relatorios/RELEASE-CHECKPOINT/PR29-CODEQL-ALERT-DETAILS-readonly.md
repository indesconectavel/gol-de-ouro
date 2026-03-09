# Detalhes do alerta CodeQL (high) — PR #29 — READ-ONLY

**Data:** 2026-02-06  
**Modo:** Apenas leitura (gh api); nenhum arquivo editado, nenhum commit/push.  
**Fonte:** GitHub API (check-runs + annotations).

---

## 1) Identificadores

| Campo | Valor |
|-------|--------|
| **owner** | indesconectavel |
| **repo** | gol-de-ouro |
| **PR** | 29 |
| **head SHA** | 56189c16f3f2f6098ed70af3f5dcb929f742a8b7 |
| **check_run_id** | 62712563651 |
| **name** | CodeQL |

---

## 2) Output do check-run

| Campo | Valor |
|-------|--------|
| **output.title** | 1 new alert including 1 high severity security vulnerability |
| **output.summary** | (ver trecho abaixo) |
| **output.annotations_count** | 1 |
| **annotations_url** | https://api.github.com/repos/indesconectavel/gol-de-ouro/check-runs/62712563651/annotations |

### output.summary (trecho)

```text
### New alerts in code changed by this pull request

Security Alerts:
 * 1 high

See annotations below for details.

[View all branch alerts](/indesconectavel/gol-de-ouro/security/code-scanning?query=pr%3A29+tool%3ACodeQL+is%3Aopen).
```

---

## 3) Annotations (alertas)

Total de annotations retornadas pela API: **1**.

| Arquivo | Linhas | Nível | Título | Mensagem |
|---------|--------|--------|--------|----------|
| **server-fly.js** | 208–215 | failure | Insecure configuration of Helmet security middleware | Helmet security middleware, configured with security setting [contentSecurityPolicy](1) set to 'false', which disables enforcing that feature. |

### Detalhes por annotation (até 20)

| # | path | start_line | end_line | annotation_level | title | message | raw_details |
|---|------|------------|----------|------------------|-------|---------|-------------|
| 1 | server-fly.js | 208 | 215 | failure | Insecure configuration of Helmet security middleware | Helmet security middleware, configured with security setting [contentSecurityPolicy](1) set to 'false', which disables enforcing that feature. | null |

---

## 4) Conclusão: ponto do código que precisa de correção

- **Arquivo:** `server-fly.js`  
- **Trecho:** linhas **208 a 215** (configuração do Helmet).  
- **Problema:** A opção **contentSecurityPolicy** do Helmet está definida como **`false`**, o que desativa a aplicação de Content-Security-Policy e é sinalizada pelo CodeQL como configuração insegura.  
- **Ação sugerida (somente referência):** Revisar a configuração do Helmet nesse trecho: habilitar contentSecurityPolicy com um objeto de política adequado em vez de `false`, ou documentar/justificar a exceção se for intencional (e, se a política do repo permitir, tratar o alerta no Code scanning).

---

## 5) Confirmação READ-ONLY

Nenhum arquivo foi alterado. Nenhum commit nem push foi realizado. Apenas consultas à API (`gh api`) e geração deste relatório.

**Arquivos de evidência (já existentes ou gerados pela consulta):**
- `docs/relatorios/RELEASE-CHECKPOINT/PR29-checkruns.json`
- `docs/relatorios/RELEASE-CHECKPOINT/PR29-codeql-checkrun.json`
- `docs/relatorios/RELEASE-CHECKPOINT/PR29-codeql-annotations.json`

---

*Relatório gerado em 2026-02-06.*
