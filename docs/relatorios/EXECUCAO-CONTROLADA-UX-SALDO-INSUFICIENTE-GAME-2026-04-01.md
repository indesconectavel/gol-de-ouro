# EXECUÇÃO CONTROLADA — UX SALDO INSUFICIENTE

**Data:** 2026-04-01  
**Base:** diagnóstico, pré-execução, preparação (`pre-ux-saldo-insuficiente-game-2026-04-01`) e relatório de cirurgia.

---

## 1. Arquivos alterados (escopo do `feat`)

| Ficheiro | Linhas (aprox.) |
|----------|-----------------|
| `goldeouro-player/src/pages/GameFinal.jsx` | +10 (bloco condicional + acessibilidade) |
| `goldeouro-player/src/pages/game-scene.css` | +26 (`.hud-content` relativo + `.hud-insufficient-balance-banner`) |

**Revisão:** `git diff --stat` antes do commit: **2 ficheiros, +36**. Sem alterações em backend, `handleShoot`, `canShoot`, `/gameshoot` ou outras rotas.

**Ficheiros não incluídos no commit `feat`:** relatórios em `docs/relatorios/` foram versionados **em commit separado** após o push do `feat`: `docs: relatorio EXECUCAO UX saldo insuficiente game 2026-04-01` (**SHA `485a53f`**). A tag **`post-ux-saldo-insuficiente-game-2026-04-01`** continua a apontar apenas para o commit do **`feat`** (`5762868`).

---

## 2. Commit final

| Campo | Valor |
|--------|--------|
| **Mensagem** | `feat: aviso visual de saldo insuficiente na tela game` |
| **SHA (completo)** | `5762868502aaf1394d007e0bf4bccbab671fc7ea` |
| **SHA (curto)** | `5762868` |

`git log -1 --stat`: apenas os dois ficheiros acima.

---

## 3. Tag criada

| Campo | Valor |
|--------|--------|
| **Nome** | `post-ux-saldo-insuficiente-game-2026-04-01` |
| **Tipo** | Anotada |
| **Commit (peeled)** | `5762868502aaf1394d007e0bf4bccbab671fc7ea` |

Validação local/remota: `refs/tags/post-ux-saldo-insuficiente-game-2026-04-01^{}` → **5762868** no `origin`.

---

## 4. Confirmação de push

| Ação | Estado |
|------|--------|
| `git push origin feature/bloco-e-gameplay-certified` | **OK** (`f02d63d..5762868`) |
| `git push origin post-ux-saldo-insuficiente-game-2026-04-01` | **OK** |

**Remoto:** `https://github.com/indesconectavel/gol-de-ouro.git` (saída da sessão).

---

## 5. Deploy realizado

| Campo | Valor |
|--------|--------|
| **Branch com o `feat`** | `feature/bloco-e-gameplay-certified` |
| **Commit** | `5762868` |
| **Tentativa `npx vercel deploy --prod` (pasta `goldeouro-player`)** | **Falhou** — erro de configuração do projeto Vercel: path esperado inexistente (`…\goldeouro-player\goldeouro-player`). Ajuste necessário em [Project Settings](https://vercel.com/goldeouro-admins-projects/goldeouro-player/settings) (root directory). |
| **Workflow GitHub Actions** | `.github/workflows/frontend-deploy.yml` dispara em `push` apenas para **`main`** e **`dev`** (paths `goldeouro-player/**`). **Push na `feature/bloco-e-gameplay-certified` não dispara** deploy automático para Vercel. |
| **URL de produção analisada** | `https://www.goldeouro.lol/` |
| **Status Production/Current** | **Não atualizado** nesta sessão para o commit `5762868` — ver secção 6. |

---

## 6. Prova em produção

### Método objetivo (bundle público)

- Pedido `GET` ao `index.html` de `https://www.goldeouro.lol/`, leitura do bundle referenciado (`/assets/index-brxfDf0E.js` no instante da verificação).
- Procura pela string exata: **`Você precisa adicionar créditos para jogar.`**
- **Resultado:** `phrase_in_bundle: **false**`

### Cenário A — saldo insuficiente

| Verificação | Estado |
|-------------|--------|
| Aviso visível em produção | **Não comprovado** — string ausente do bundle servido. |
| Zonas desativadas / Recarregar | Comportamento herdado do build anterior; **não revalidado** nesta sessão em browser com sessão real. |

### Cenário B — saldo suficiente

| Verificação | Estado |
|-------------|--------|
| Aviso oculto / jogo normal | **Não revalidado** em produção pós-deploy (deploy não aplicado ao domínio). |

### Cenário C — fase não-IDLE

| Verificação | Estado |
|-------------|--------|
| Aviso oculto durante animação | **Não revalidado** em produção (mesmo motivo). |

**Nota:** Cenários A/B/C exigem sessão autenticada e, idealmente, build em produção com o commit `5762868`. A evidência de bundle é **necessária mas não suficiente** para UX visual completa; neste caso, o bundle **já indica** que a versão pública analisada **ainda não inclui** a alteração.

---

## 7. Resultado final

**EXECUÇÃO VALIDADA COM RESSALVAS**

- **Validado:** revisão de diff, commit único com escopo correto, tag, push, alinhamento remoto do commit e da tag.
- **Ressalvas / bloqueio do objetivo “produção”:** **não há prova** de que `https://www.goldeouro.lol` sirva o commit **`5762868`**; o deploy automático via workflow **não corre** para a branch `feature/...`; o **Vercel CLI** falhou pela configuração de root.

Conforme a regra explícita do pedido (*sem prova real de produção → execução inválida no critério de runtime público*), a parte **“melhoria ativa em produção”** está **❌ não cumprida** nesta sessão.

---

## 8. Conclusão objetiva

- A melhoria está **no repositório remoto**, no commit **`5762868502aaf1394d007e0bf4bccbab671fc7ea`**, na branch **`feature/bloco-e-gameplay-certified`**, identificável pela tag **`post-ux-saldo-insuficiente-game-2026-04-01`**.
- **Não** está demonstrado que essa versão esteja **live** no domínio **`www.goldeouro.lol`** analisado (ausência da string no bundle JS).
- **Próximos passos para fechar o objetivo “produção”:** merge (ou deploy manual) para o ramo que o Vercel/GitHub Actions usam (**`main`** ou **`dev`**), ou corrigir **Root Directory** no Vercel e executar deploy do commit correto; depois repetir verificação do bundle e testes manuais A/B/C.

---

## Referência de comandos (sessão)

```text
git status -sb
git diff --stat
git add goldeouro-player/src/pages/GameFinal.jsx goldeouro-player/src/pages/game-scene.css
git commit -m "feat: aviso visual de saldo insuficiente na tela game"
git tag -a post-ux-saldo-insuficiente-game-2026-04-01 -m "..."
git push origin feature/bloco-e-gameplay-certified
git push origin post-ux-saldo-insuficiente-game-2026-04-01
```
