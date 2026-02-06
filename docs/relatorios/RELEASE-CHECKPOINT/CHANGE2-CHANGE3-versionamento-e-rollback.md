# CHANGE #2 e CHANGE #3 — Versionamento e rollback

**Data:** 2026-02-06  
**Branch usado:** `feat/payments-ui-pix-presets-top-copy`  
**Timestamp das tags:** `2026-02-06_0041`

---

## 1. Tags criadas

| Tag | Descrição |
|-----|-----------|
| **PRE_CHANGE2_CHANGE3_2026-02-06_0041** | Estado do repositório **antes** dos commits de CHANGE #2 e CHANGE #3 (ponto de rollback). |
| **CHANGE2_DONE_2026-02-06_0041** | Após o commit do CHANGE #2 (mensagem amigável ao jogar sem saldo). |
| **CHANGE3_DONE_2026-02-06_0041** | Após o commit do CHANGE #3 (destaque no botão Recarregar). |

Todas as tags foram enviadas para `origin`.

---

## 2. Hashes dos commits

| Change | Hash (curto) | Hash (completo) |
|--------|--------------|-----------------|
| **CHANGE #2** | `0361d48` | `0361d48c020735f850b22f7daba75a46beb45e61` |
| **CHANGE #3** | `7f73abd` | `7f73abd939804fbe97f1f935496eb38e94d13eb2` |

---

## 3. Arquivos incluídos em cada commit

### Commit CHANGE #2 (mensagem amigável ao jogar sem saldo)

- `.gitignore` — inclusão de regras para não versionar artefatos de auditoria (`prod-index.html`, `prod-assets-index.js`).
- `goldeouro-player/src/services/gameService.js` — tratamento de erro no `catch` de `processShot`: priorizar `error.response?.data?.message`, substituir "Saldo insuficiente" por "Você está sem saldo. Adicione saldo para jogar.".
- `docs/relatorios/RELEASE-CHECKPOINT/CHANGE-2-implementacao-frontend.md`
- `docs/relatorios/RELEASE-CHECKPOINT/CHANGE-2-precheck-saldo-para-jogar-READONLY.md`
- `docs/relatorios/RELEASE-CHECKPOINT/CHANGE-2-verificacao-producao-readonly.md`

### Commit CHANGE #3 (destaque no botão Recarregar)

- `goldeouro-player/src/pages/GameShoot.jsx` — estado `highlightRecharge`, timer, detecção da mensagem de saldo insuficiente, destaque visual temporário no botão "Recarregar", cleanup do timer.
- `docs/relatorios/RELEASE-CHECKPOINT/CHANGE-3-highlight-recarregar-frontend.md`

---

## 4. Confirmação: artefatos de auditoria NÃO commitados

- **prod-index.html** — **não** foi adicionado a nenhum commit (incluído em `.gitignore`).
- **prod-assets-index.js** — **não** foi adicionado a nenhum commit (incluído em `.gitignore`).

---

## 5. Resultado do `npm run build` (goldeouro-player)

- **Status:** **Sucesso**
- Comando: `npm run build` (Vite) no diretório `goldeouro-player`.
- Saída: `✓ built in 7.01s`; arquivos gerados em `dist/` (incluindo `dist/assets/index-*.js` e `index-*.css`).

---

## 6. Rollback (obrigatório)

### Opção A — Voltar tudo para antes dos changes (tag PRE)

Use quando quiser deixar o branch **exatamente** como estava antes dos dois commits (incluindo remoção dos commits do histórico local).

```powershell
git fetch --all --tags
git reset --hard PRE_CHANGE2_CHANGE3_2026-02-06_0041
```

- **Atenção:** Se os commits já tiverem sido enviados (`git push`), **evite** `git push --force` em branch compartilhado. Prefira a **Opção B** (revert).

### Opção B — Reverter com segurança (sem force)

Use quando os commits já estiverem no `origin` e quiser reverter **mantendo histórico** (reverts como novos commits).

```powershell
git fetch --all --tags
git revert 7f73abd   # Reverte CHANGE #3 (último commit primeiro)
git revert 0361d48   # Reverte CHANGE #2
git push
```

Ordem: primeiro o commit mais recente (CHANGE #3), depois o CHANGE #2.

---

## 7. Observação importante

- **Commits e tags não atualizam produção sozinhos.** Para a mensagem amigável e o destaque no botão Recarregar aparecerem no navegador, o **deploy** precisa ser executado a partir deste branch/commit (pipeline existente, ex.: Vercel ou outro CI/CD).

---

*Relatório gerado após versionamento de CHANGE #2 e CHANGE #3. Nenhum deploy automático foi executado.*
