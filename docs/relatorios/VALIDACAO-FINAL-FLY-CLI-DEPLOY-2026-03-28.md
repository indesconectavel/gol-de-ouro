# VALIDAÇÃO FINAL — FLY CLI / DEPLOY

**Data:** 2026-03-28.  
**Modo:** read-only (nenhuma alteração a PATH, ficheiros ou deploy).  
**Máquina validada:** `C:\Users\indes` (sessão corrente).

---

## 1. Resumo executivo

O comando `fly` resolve para **um único** executável em `C:\Users\indes\.fly\bin\fly.exe` (symlink). O alvo **`flyctl.exe` existe**, com **107 088 384** bytes (ficheiro real, não reparse quebrado). Os comandos **`fly version`**, **`fly auth whoami`** e **`fly logs -a goldeouro-backend-v2`** executaram **sem erro** nesta validação.

**Resposta direta:** sim — **pode executar `fly deploy --remote-only` agora** do ponto de vista do CLI, autenticação e API, assumindo `fly.toml` / contexto do repositório corretos (fora do âmbito desta validação).

---

## 2. Resolução final do comando `fly`

| Verificação | Evidência |
|-------------|-----------|
| `where.exe fly` | `C:\Users\indes\.fly\bin\fly.exe` (**uma** linha — sem segundo candidato) |
| `Get-Command fly` | `Source: C:\Users\indes\.fly\bin\fly.exe`, `CommandType: Application`, `Version: 0.0.0.0` (normal para symlink sem recurso de versão no stub) |
| PATH (leitura) | Entrada com `fly`: **`C:\Users\indes\.fly\bin`** (apenas esta ocorrência nas variáveis User/Machine filtradas por `fly`) |
| Executável válido | `flyctl.exe` presente, tamanho **107 088 384**, atributos `Archive` (não symlink) |
| `where.exe flyctl` | `C:\Users\indes\.fly\bin\flyctl.exe` — **mesma pasta**, não é segunda instalação noutro caminho |

---

## 3. Estado da instalação

| Item | Estado |
|------|--------|
| `fly.exe` | Existe; **symlink** → `C:\Users\indes\.fly\bin\flyctl.exe` (`dir /AL`) |
| `flyctl.exe` | Existe; coerente com o symlink (alvo resolvível) |
| Referência quebrada | **Não** — o problema anterior (alvo inexistente) está **ausente** nesta verificação |
| Duplicação no PATH | **Não evidenciada** — `where fly` e `where flyctl` apontam só para `\.fly\bin\` |

---

## 4. Validação dos comandos críticos

| Comando | Resultado |
|---------|-----------|
| `fly version` | **OK** — `fly.exe v0.4.17 windows/amd64` (Commit `a614657e...`, BuildDate `2026-03-03T22:54:37Z`) |
| `fly auth whoami` | **OK** — `indesconectavel@gmail.com` |
| `fly logs -a goldeouro-backend-v2` | **OK** — stream de linhas de log da app (amostra capturada; sem falha de CLI) |

**Warnings relevantes ao Fly CLI:** nenhum nos outputs acima. O conteúdo dos logs (ex.: mensagens `[RECON]` da aplicação) é **estado do backend**, não falha da ferramenta.

---

## 5. Avaliação de riscos

**Classificação para deploy imediato com o estado medido:** **risco baixo**

| Tema | Avaliação |
|------|-----------|
| Binário incorreto / PATH errado | **Baixo** — resolução única e `flyctl.exe` material. |
| Regressão ao erro “symlink sem alvo” | **Moderado a longo prazo** — uma **futura** auto-atualização mal concluída pode voltar a deixar `bin` inconsistente; **não** há evidência de que isso ocorra no próximo comando. Não bloqueia o deploy **agora**. |
| Versão `v0.4.17` vs `deploy --remote-only` | **Baixo** — versão recente (build 2026-03-03); sem evidência nesta validação de incompatibilidade com deploy remoto. |

---

## 6. Prontidão para deploy

| Pergunta | Resposta |
|----------|----------|
| Ambiente apto para `fly deploy --remote-only`? | **Sim**, do ponto de vista **Fly CLI + auth + API** (validado indiretamente via `logs`). |
| Risco de usar binário incorreto? | **Não evidenciado** nesta sessão. |
| Risco imediato de repetir o erro anterior (alvo ausente)? | **Não** — `flyctl.exe` existe. |
| A versão atual impacta o deploy? | **Sem indício negativo** na validação; deploy depende também de Dockerfile/`fly.toml`/credenciais da app. |

---

## 7. Veredito operacional

**GO PARA DEPLOY DO BACKEND**

---

## 8. Justificativa do veredito

- **Evidência:** um único `fly` no PATH, symlink válido, `flyctl.exe` com tamanho de executável completo, três comandos críticos sem erro.
- **Não** foi executado deploy (conforme pedido); a aptidão refere-se exclusivamente ao **ambiente Fly CLI** e à **ligação à conta/app**.
- **Ressalva única:** monitorizar futuras atualizações automáticas do `flyctl` na pasta `bin`; isso não impede **GO** para o deploy **neste momento**.

**Pergunta única:** *Posso fazer o deploy agora com segurança?* — **Sim, em relação ao CLI e à autenticação Fly**; complete com revisão habitual de config da app e branch antes de correr `fly deploy --remote-only`.
