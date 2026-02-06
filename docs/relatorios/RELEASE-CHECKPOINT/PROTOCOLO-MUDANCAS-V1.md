# Protocolo de mudança 1-A-1 (v1 safe)

Cada alteração deve seguir este fluxo para manter rastreabilidade e rollback fácil.

---

## Para cada mudança

### 1) Criar branch curta

- Padrão: `feat/<slug>`
- Exemplo: `feat/login-redirect`, `feat/payments-ux`

### 2) Implementar APENAS 1 mudança

- Uma feature/correção por branch.
- Evitar commits “misc” ou “fix everything”.

### 3) Rodar checkups

- **Build frontend:** `cd goldeouro-player ; npm run build`
- **Navegar rotas:**  
  `/login` · `/register` · `/profile` · `/payments` · `/game`
- **Validar** o comportamento específico da mudança.

### 4) Gerar relatório da mudança

- **Caminho:** `docs/relatorios/RELEASE-CHECKPOINT/CHANGE-<slug>-<timestamp>.md`
- **Conteúdo mínimo:**
  - Objetivo da mudança
  - Arquivos alterados
  - Prints/trechos críticos (se aplicável)
  - Checklist de validação (pass/fail)
  - Instrução de rollback:  
    `git revert <commit>` ou `git reset --hard PRE_V1_STABLE_<timestamp>`

### 5) Commit com mensagem padronizada

- Formato: `feat: <slug> (v1 safe)`
- Exemplo: `feat: login-redirect (v1 safe)`

---

## Rollback

- **Reverter um commit:**  
  `git revert <hash>`
- **Voltar ao checkpoint:**  
  `git checkout PRE_V1_STABLE_<YYYY-MM-DD-HHmm>`  
  ou  
  `git checkout release/v1-stability-ui`

---

*Protocolo criado no checkpoint PRE-V1-STABLE (tag PRE_V1_STABLE_2026-02-05-2224).*
