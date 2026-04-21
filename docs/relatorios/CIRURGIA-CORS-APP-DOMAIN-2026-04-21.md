# CIRURGIA — CORS — APP DOMAIN

## 1. Resumo executivo

Foi aplicada correcao minima no `server-fly.js` para liberar CORS ao dominio oficial `https://app.goldeouro.lol`, mantendo allowlist explicita e restrita. A cirurgia tambem padronizou a leitura canonica da variavel `CORS_ORIGIN`, com compatibilidade temporaria para `CORS_ORIGINS`, sem abrir CORS amplo e sem alterar logica de negocio.

## 2. Confirmacao da base

- Branch de trabalho: `hotfix/d1-saque-2026-04-21`
- Commit de base controlada (checkpoint): `ca80031` (`chore(cors): checkpoint pre-cirurgia liberacao app domain`)
- Arquivo untracked fora do escopo identificado e mantido fora da mudanca:
  - `docs/relatorios/STATUS-PR-D1-SAQUE-2026-04-21.md`
- Escopo da cirurgia mantido apenas em CORS.

## 3. Arquivos alterados

- `server-fly.js`

## 4. Correcoes aplicadas

### allowlist

- Incluido `https://app.goldeouro.lol` na lista explicita de origens oficiais do fallback.
- Mantidas origens ja autorizadas:
  - `https://goldeouro.lol`
  - `https://www.goldeouro.lol`
  - `https://admin.goldeouro.lol`

### leitura de variavel

- Leitura canonica mantida em `CORS_ORIGIN`.
- Compatibilidade temporaria adicionada para `CORS_ORIGINS`:
  - ordem de precedencia: `CORS_ORIGIN` -> `CORS_ORIGINS` -> fallback oficial.

### fallback seguro

- Fallback continua explicito e restrito a dominios oficiais.
- Nao foi introduzido `*`, regex ampla ou abertura geral.

## 5. O que foi preservado

- `credentials`, `methods` e `allowedHeaders` do middleware CORS foram preservados.
- Comportamento CORS para origens oficiais ja permitidas foi mantido.
- Nenhuma alteracao em auth, saque, pagamentos, ledger, schema, frontend ou outras politicas de seguranca.

## 6. Riscos eliminados

- Eliminado o risco principal de bloqueio por ausencia de `Access-Control-Allow-Origin` para `https://app.goldeouro.lol` na allowlist efetiva.
- Reduzido risco de drift de nomenclatura de variavel (`CORS_ORIGIN` vs `CORS_ORIGINS`) no parser de origem.

## 7. Riscos remanescentes

- Validacao final depende de Execucao Controlada de Runtime (deploy + preflight real no ambiente).
- Se o runtime de producao usar configuracao externa divergente da esperada, pode haver comportamento diferente ate confirmacao em producao.

## 8. Testes minimos realizados

- Inspecao controlada do codigo apos alteracao:
  - parser contem `CORS_ORIGIN` com compatibilidade `CORS_ORIGINS`;
  - allowlist inclui `https://app.goldeouro.lol`;
  - origens antigas seguem presentes.
- Verificacao de seguranca por inspecao:
  - sem `*` na configuracao CORS alterada;
  - sem abertura ampla.
- Verificacao de escopo:
  - alteracao apenas em `server-fly.js` (arquivo alvo principal).

## 9. Classificacao da cirurgia

**CONCLUÍDA COM RESSALVAS**

## 10. Conclusao objetiva

A correcao de CORS esta pronta para **Execucao Controlada de Runtime**.  
Ressalva: ainda e obrigatoria a confirmacao em runtime (preflight/headers reais apos deploy) para encerrar validacao funcional em producao.

