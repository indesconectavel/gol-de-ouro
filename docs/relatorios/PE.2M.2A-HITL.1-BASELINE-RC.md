# PE.2M.2A-HITL.1 — Baseline e Escopo Final da Release Candidate™



## Veredito: **NO-GO**



| Campo | Valor |

|-------|-------|

| Gate | PE.2M.2A-HITL.1 |

| Modo | READ-ONLY ABSOLUTO |

| Data | 2026-07-14 |

| Mutação Git | **Nenhuma** |

| Deploy | **Nenhum** |

| Release Freeze autorizado | **NÃO** |

| Tag segura agora | **NÃO** |



### Por quê NO-GO



Qualquer **E** ou **D** na RC → NO-GO (regra do gate).  

Porcelain **live incompleto** (shell `LanguagePrimitives`) ⇒ residual **E** por política.  

Arquivos **D** conhecidos na árvore (`.env.example`, `.cursor/**`, docs H/P0…).  

Árvore **não comprovadamente limpa**.



---



## 1. Auditoria Git



| Item | Valor | Classificação |

|------|-------|---------------|

| Branch | `pe/pe2b-staging-deploy` (`.git/HEAD`) | VALIDADO |

| HEAD local tip | `a651de6563b09025adec91ceb84dfa7933088a48` | VALIDADO (ref) |

| HEAD remoto | — | **INDETERMINADO** |

| Working tree limpa | Não comprovada | **NÃO** |

| Modified / Untracked / Staged | — | **INDETERMINADO** live |

| Stash | — | **INDETERMINADO** |

| Tag `pe2m-shadow-staging-ready` | ausente em packed-refs | **NÃO** |

| Tag `pe2b-adapter-boundary-safe` | `73bca75…` | VALIDADO local |

| Divergência local/remoto | — | **INDETERMINADO** |



---



## 2. Classificação de escopo (resumo)



| Classe | Conteúdo típico | Entra na RC? |

|--------|-----------------|--------------|

| **A** | `src/payment-engine/**` PE.2E–L, scripts `pe2[e-m]*`, verifies | SIM |

| **B** | `backend-deploy-staging.yml`, `fly.staging.toml`, manifests, freeze script | SIM |

| **C** | Relatórios/snapshots PE.2*, `docs/payment-engine/staging*` | SIM |

| **D** | `.env.example`, `.cursor/**`, H*/P0/patrimonio, scripts legados | **NÃO** |

| **E** | Qualquer pendente não reclassificado ao vivo | **NÃO** |



Lista detalhada: `docs/payment-engine/staging-final/rc-file-classification.json`.



---



## 3. Script de freeze



`scripts/pe2m2a-release-freeze.mjs`



| Check | Resultado |

|-------|-----------|

| `git add` / `git add -A` / `git commit -a` | **Não** |

| Cria commit / tag / push | **Não** |

| Muda `main` / stash | **Não** |

| Dry-run | **Não** |

| Aborta árvore suja | **Sim** |

| Allowlist exacta do commit HITL | **Não** |

| Escrita FS | Atualiza 2 `release-manifest.json` |



**Seleção Git ampla pelo script?** **NÃO** → não causa NO-GO por `git add .`.  

**Seguro rodar agora?** **NÃO** (árvore contaminada / D/E).



Risco de pin: `payload_sha` e `release_commit` colapsados no mesmo HEAD pré-write — HITL deve usar **dois commits** (payload → pin).



---



## 4. Manifest / tag / workflow



- Tag esperada: `pe2m-shadow-staging-ready`

- SHA: `PENDING_HITL_FREEZE_COMMIT` (não hash fake)

- `frozen: false`

- Workflow: `RELEASE_REF` correto; **8 flags** `=false` explícitas

- Modelo correto: `payload_sha` ≠ auto-hash circular; `release_commit` = tip tagueado



---



## 5. Plano HITL (uma etapa mutável por vez — **não executar aqui**)



| Etapa | Mutável? | Ação |

|-------|----------|------|

| **A** | SIM | Preservar / isolar **D** e **E** |

| B | SIM | `git add` pathspec só A/B/C |

| C | NÃO | `git diff --cached` |

| D | SIM | Commit payload |

| E | NÃO | Validar |

| F | SIM | Freeze + commit pin |

| G | SIM | Tag anotada |

| H | SIM | Push + `ls-remote` |



**Primeira etapa recomendada: A.**



---



## Respostas obrigatórias



| Pergunta | Resposta |

|----------|----------|

| Produção alterada? | **NÃO** |

| Staging alterado? | **NÃO** |

| Git alterado? | **NÃO** |

| Working tree limpa? | **NÃO** (não comprovada) |

| Arquivos fora do escopo? | **SIM** (D conhecidos + E residual) |

| Script freeze seguro? | **Condicional** — sem add amplo; **não** seguro na árvore atual |

| Usa git add amplo? | **NÃO** |

| Commit pode ser isolado? | **SIM** (com pathspec; após Etapa A) |

| Manifest consistente? | **Estruturalmente sim** / pin pendente |

| Tag com segurança agora? | **NÃO** |

| Release Freeze autorizado? | **NÃO** |

| Primeira etapa HITL? | **Etapa A** |

| Veredito | **NO-GO** |



---



## HITL — coletar porcelain (somente leitura)



```bat

cd /d "E:\Chute de Ouro\goldeouro-backend"

git status --porcelain

git diff --name-only

git diff --cached --name-only

git stash list

git ls-remote origin pe/pe2b-staging-deploy

```



Após classificação sem **E**, reabrir gate ou executar **apenas Etapa A**.


