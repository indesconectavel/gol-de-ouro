# CORREÇÃO CIRÚRGICA — FLY CLI

**Data:** 2026-03-28.  
**Âmbito:** apenas `C:\Users\indes\.fly\bin\` (utilizador da sessão).  
**PATH:** não alterado.  
**Pasta `%USERPROFILE%\.fly\`:** não removida.

---

## 1. Resumo executivo

Foi restaurado o binário **`flyctl.exe`** copiando o conteúdo de **`flyctl.exe.old`** (107 088 384 bytes) para o destino esperado pelo symlink **`fly.exe` → `flyctl.exe`**. O ficheiro **`flyctl.exe.old` foi mantido** (não renomeado, para preservar cópia de segurança explícita no disco).

Após a cópia, **`fly version`**, **`fly help`**, **`fly auth whoami`** e **`fly logs -a goldeouro-backend-v2`** executaram com sucesso, confirmando recuperação do CLI e da API Fly.

**Não** foi usado `flyctl.zip` (fallback desnecessário). **Não** foi alterado `wintun.dll` / `wintun.dll.old` nesta intervenção.

---

## 2. Ação aplicada (renomeação ou extração)

| Passo | Detalhe |
|--------|---------|
| Integridade `flyctl.exe.old` | Tamanho **107 088 384** bytes — consistente com executável completo; mesmo tamanho do `flyctl.exe` gerado. |
| `flyctl.zip` | Não inspecionado nem extraído; reservado como fallback futuro se necessário. |
| Ação principal | **`Copy-Item`** `flyctl.exe.old` → `flyctl.exe` com `-Force` (PowerShell), em `C:\Users\indes\.fly\bin\`. |
| Motivo da cópia vs renomear | O enunciado pedia renomear; foi usada **cópia** para cumprir **“NÃO remover arquivos antigos ainda”** mantendo `flyctl.exe.old` intacto como backup byte-a-byte. |

---

## 3. Estado antes vs depois

| Item | Antes | Depois |
|------|--------|--------|
| `fly.exe` | Symlink para `flyctl.exe` (alvo inexistente) | Igual (symlink válido) |
| `flyctl.exe` | **Ausente** | Presente, **107 088 384** bytes, `LastWriteTime` 2026-03-03 (herdado do `.old`) |
| `flyctl.exe.old` | Presente (~107 MB) | **Inalterado** (mantido) |
| `flyctl.zip` | Presente | Não tocado |
| `wintun.dll.old` | Presente | Não tocado |

---

## 4. Validação dos comandos

| Comando | Resultado |
|---------|-----------|
| `fly version` | `fly.exe v0.4.17 windows/amd64` — Commit `a614657e...`, BuildDate `2026-03-03T22:54:37Z` |
| `fly help` | Saída normal do uso do `flyctl` (lista de comandos) |
| `fly auth whoami` | `indesconectavel@gmail.com` (sessão já autenticada) |
| `fly logs -a goldeouro-backend-v2` | Stream de logs da app em produção (linhas com prefixo data/região); prova de conectividade à API Fly |

**Nota:** Os logs amostrados reflectem o estado atual do backend em produção (ex.: mensagens `[RECON]`); não fazem parte da correção do CLI.

---

## 5. Riscos

- **Versão fixada em 0.4.17** até nova actualização oficial; o cliente pode voltar a tentar auto-update — convém monitorizar se a pasta `bin` volta a ficar inconsistente.
- **Cópia a partir de `.old`** assume que o `.old` não estava corrompido; o tamanho e o comportamento pós-teste sugerem integridade boa.
- **`wintun.dll`** não foi reposto; se comandos que usem túnel WireGuard falharem no futuro, avaliar copiar `wintun.dll.old` → `wintun.dll` na mesma pasta (fora do âmbito desta missão).

---

## 6. Reversibilidade

- Para **reverter** o efeito da correção (p.ex. teste): remover só `C:\Users\indes\.fly\bin\flyctl.exe` (o symlink `fly.exe` voltaria a apontar para alvo inexistente — estado quebrado anterior).
- **Reversão útil:** manter `flyctl.exe.old`; qualquer reinstalação oficial pode substituir `flyctl.exe` sem perder o backup `.old` até decidir apagá-lo manualmente.

---

## 7. Veredito

**CORREÇÃO CONCLUÍDA**

O Fly CLI voltou a executar e a comunicar com a conta e com a app `goldeouro-backend-v2`, com intervenção mínima restrita a `%USERPROFILE%\.fly\bin\`, sem PATH nem reinstalação global.
