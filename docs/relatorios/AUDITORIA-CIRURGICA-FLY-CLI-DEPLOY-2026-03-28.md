# AUDITORIA CIRÚRGICA — FLY CLI / DEPLOY

**Data:** 2026-03-28.  
**Ambiente:** Windows, utilizador `C:\Users\indes`.  
**Modo:** diagnóstico **read-only** (comandos de inspeção apenas; sem alterações ao PATH, sem reinstalação, sem deploy).

---

## 1. Resumo executivo

O comando `fly` resolve para `C:\Users\indes\.fly\bin\fly.exe`, que **não é um PE válido autónomo**: é um **link simbólico** para `flyctl.exe` na mesma pasta. O ficheiro **`flyctl.exe` não existe** — apenas **`flyctl.exe.old`** (~107 MiB), típico de uma **atualização interrompida ou falhada** que renomeou o binário antigo e não instalou o novo.

O PowerShell ao invocar `fly.exe` reporta falha nativa equivalente a **ficheiro alvo inexistente / não executável** (“Não há aplicativos associados ao arquivo especificado para esta operação”), compatível com **symlink partindo para destino em falta**.

**Conclusão:** o problema **não** é primariamente PATH inconsistente nem múltiplas instalações em conflito no PATH auditado; é **instalação quebrada no diretório `.fly\bin`** (destino do symlink ausente).

---

## 2. Como o comando `fly` está sendo resolvido

| Verificação | Resultado observado |
|-------------|---------------------|
| `where.exe fly` | `C:\Users\indes\.fly\bin\fly.exe` |
| `Get-Command fly` | `CommandType: Application`, `Source: C:\Users\indes\.fly\bin\fly.exe`, `Version: 0.0.0.0` (metadados de versão vazios — típico de symlink, não de EXE com recurso de versão) |
| PATH (entrada relevante) | `C:\Users\indes\.fly\bin` presente no PATH do sistema (`Machine`) |
| PATH User | Nenhuma entrada adicional com `fly` além da verificação focada; a resolução vem de `C:\Users\indes\.fly\bin` |

**Shim:** `dir /AL` em `.fly\bin` mostra:

```text
<SYMLINK>      fly.exe [C:\Users\indes\.fly\bin\flyctl.exe]
```

`fsutil reparsepoint query` confirma **link simbólico** com destino `...\bin\flyctl.exe`.

**Destino físico:** `Test-Path C:\Users\indes\.fly\bin\flyctl.exe` → **False**. O executável apontado **não existe**.

---

## 3. Estrutura real da instalação local

**Pasta:** `C:\Users\indes\.fly\` (existe).

**Conteúdo relevante da raiz (amostra):** `bin\`, `agent-logs\`, `logs\`, `tmp\`, `config.yml`, `state.yml`, locks e sockets do agente — perfil de instalação oficial típica do Fly.

**`C:\Users\indes\.fly\bin\` (observado):**

| Nome | Tamanho (aprox.) | Notas |
|------|------------------|--------|
| `fly.exe` | 0 bytes (reparse) | Symlink → `flyctl.exe` |
| `flyctl.exe.old` | 107 088 384 bytes | Binário real preservado da instalação anterior |
| `flyctl.zip` | ~47 MiB | Possível artefacto de download/atualização |
| `wintun.dll.old` | 564 856 bytes | Driver antigo renomeado |

**Ausente e crítico:** `flyctl.exe` (e `wintun.dll` ativo, se o runtime atual o exigir).

---

## 4. Conflitos / corrupção encontrados

- **Conflito multi-PATH:** `where.exe flyctl` **não** encontrou outro `flyctl` no PATH — **sem evidência** de segunda instalação a competir com `\.fly\bin` nesta sessão.
- **Corrupção / estado inconsistente:** symlink `fly.exe` → `flyctl.exe` com **alvo em falta**; presença de `*.old` e `flyctl.zip` — forte indício de **atualização automática do Fly** (ou script de update) que **removeu/renomeou** o binário ativo e **não concluiu** a escrita do novo `flyctl.exe`.
- Mensagens como *“failed to update, and the current version is severely out of date”* encaixam no cliente **a tentar auto-atualizar** com árvore `bin` **inconsistente**.

**Gestores de pacotes:** `winget.exe` e `choco.exe` existem no sistema; **não foi concluída** nesta auditoria uma listagem `winget list` fiável (comando demorou/foi interrompido). A origem exata da instalação inicial (script oficial vs winget vs choco) fica **indeterminada** sem esse passo extra — **não altera** a causa mecânica (alvo do symlink ausente).

---

## 5. Causa raiz mais provável

**Atualização do Fly CLI incompleta ou falhada**, deixando:

1. `fly.exe` como symlink para `flyctl.exe`;
2. `flyctl.exe` **eliminado ou nunca recriado** após renomear o anterior para `flyctl.exe.old`.

O terminal não está a usar um “binário inexistente no PATH”: o PATH está correto para a instalação padrão; o **destino interno** do shim (`flyctl.exe`) é que está em falta.

---

## 6. Correção mínima recomendada

Ordem sugerida da **menor intervenção** para a **mais limpa** (escolher uma; não executada nesta auditoria):

1. **Mínima (restauro local):** copiar ou renomear `flyctl.exe.old` para `flyctl.exe` **após** confirmar que o ficheiro `.old` não está corrompido (tamanho ~107 MiB sugere EXE completo). Em seguida executar `fly version` ou `fly.exe version`. **Risco:** versão antiga; o próprio `fly` pode voltar a tentar atualizar — idealmente depois correr `fly version` / atualização oficial com sucesso.
2. **Recomendada (oficial):** reinstalar o Fly CLI pelo **instalador/script atual** em [https://fly.io/docs/hands-on/install-flyctl/](https://fly.io/docs/hands-on/install-flyctl/) (Windows), **por cima** da pasta existente, para repor `flyctl.exe` e dependências (`wintun.dll`, etc.) em estado suportado.
3. **PATH:** **não** é necessário “corrigir PATH” se a única entrada relevante já é `C:\Users\indes\.fly\bin` e aponta para a pasta correta; o problema é o **conteúdo** da pasta, não a ordem do PATH.

**Não** é necessário, com base nesta evidência, apagar toda a pasta `%USERPROFILE%\.fly\` como primeiro passo: isso remove config/credenciais e é **destrutivo**; só faria sentido se a reinstalação limpa falhar repetidamente.

---

## 7. Riscos da correção

| Ação | Risco |
|------|--------|
| Renomear `.old` → `flyctl.exe` | Versão desatualizada; possível novo ciclo de auto-update que volte a quebrar se o bug persistir. |
| Reinstalar por cima | Baixo se seguir documentação oficial; possível necessidade de reautenticar (`fly auth login`) conforme estado de `config.yml`. |
| Remover `.fly` inteiro | **Alto** — perda de config local, tokens em cache, histórico; só como último recurso. |

---

## 8. Veredito final

**PRONTO PARA CORREÇÃO CIRÚRGICA**

A causa está **identificada com precisão** no filesystem local; não é necessário mais investigação para explicar “No such file” / falha ao executar `fly`: **restaurar ou reinstalar `flyctl.exe`** (e dependências) na pasta `C:\Users\indes\.fly\bin\`.

**Opcional (mais investigação):** apenas se, após repor `flyctl.exe`, o erro persistir — aí validar `fly doctor`, antivírus a bloquear escrita em `.fly\bin`, ou disco/permissões.
