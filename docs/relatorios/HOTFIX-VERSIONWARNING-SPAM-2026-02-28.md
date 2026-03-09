# Hotfix VersionWarning — eliminação do spam no console

**Data:** 2026-02-28  
**Branch:** `chore/hotfix-versionwarning-spam-safe`  
**Commit:** 9fe91f4  
**Arquivo alterado:** `goldeouro-player/src/components/VersionWarning.jsx` (único).

---

## Causa raiz

- O componente **VersionWarning** chamava, a cada 1s (em um `setInterval`), três métodos do **versionService** que **não existem**: `shouldShowWarning()`, `getWarningMessage()`, `getVersionInfo()`.
- No bundle minificado o export default do versionService vira `gn`; daí o erro no console: `Uncaught TypeError: gn.shouldShowWarning is not a function`.
- O **versionService.js** não foi e não deve ser alterado nesta PR; a correção foi feita apenas no componente.

---

## O que foi removido

- **setInterval(1000)** que rodava a cada segundo.
- Chamadas a **versionService.shouldShowWarning()**, **versionService.getWarningMessage()**, **versionService.getVersionInfo()**.
- Chamada a **versionService.startPeriodicCheck()** no mount (evita intervalo adicional de 5 min apenas para este componente).
- **console.error** no catch da verificação de compatibilidade (falha não quebra o app nem gera log repetitivo).

---

## O que foi mantido / alterado

- **Uma única verificação no mount** com **versionService.checkCompatibility()** (método que existe).
- Se `result.compatible === false` → exibe aviso com mensagem `result.warningMessage || 'Atualize para continuar.'` e dados de versão com fallback seguro (`result.current`, `'—'`).
- Em caso de erro na promise: não lança, não quebra o app, não faz console.error; apenas deixa o aviso fechado.
- **Cleanup** no useEffect com flag `cancelled` para evitar setState após unmount.
- **Layout/CSS** do componente mantido (mesmas classes e estrutura).

---

## Por que é seguro

- Alteração restrita a **um arquivo** e a **um componente** (VersionWarning).
- **Nenhuma** alteração em: versionService.js, withdrawService.js, api.js, environments.js, Withdraw.jsx, fluxo de saque PIX ou backend.
- Uso apenas de **checkCompatibility()**, método existente no versionService; sem novos métodos no serviço.
- Comportamento padrão do versionService (ex.: `compatible: true`) mantém o aviso fechado; em caso de falha na verificação o componente não exibe aviso e não gera erro no console.

---

## Confirmações

- **Produção (main / FyKKeg6zb) não foi tocada:** trabalho feito somente na branch `chore/hotfix-versionwarning-spam-safe`; sem merge em main e sem push em main.
- **Nenhum arquivo de saque foi alterado:** `git diff --name-only` = apenas `goldeouro-player/src/components/VersionWarning.jsx`. withdrawService.js, api.js, Withdraw.jsx e demais fluxos PIX intocados.
- **Build:** `npm run build` no player executou a transformação Vite (1790 módulos) e a geração do PWA com sucesso; falha posterior foi EPERM no Windows ao limpar `dist` (arquivo bloqueado), não relacionada a este hotfix.

---

## Critério de aceite

- Zero erro `"shouldShowWarning is not a function"` no console.
- Zero spam no console a partir do VersionWarning.
- Nenhuma alteração em saque PIX nem em backend.
- Nenhum merge em main nem deploy em produção (apenas branch isolada e, se desejado, deploy de Preview a partir dessa branch).
