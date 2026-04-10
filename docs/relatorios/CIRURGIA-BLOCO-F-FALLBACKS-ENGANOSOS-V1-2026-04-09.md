# CIRURGIA — BLOCO F — FALLBACKS ENGANOSOS V1

## 1. Resumo executivo

Removidos fallbacks de identidade e saldo fictícios nos blocos `catch` (e resposta `success: false`) de **Dashboard** e **Perfil**, substituindo-os por estado de erro explícito, `user`/`balance` ausentes quando não há dados válidos e ação **Tentar novamente** onde aplicável. O escopo limitou-se a dois ficheiros do `goldeouro-player`; não houve alterações de backend, contratos HTTP ou rotas financeiras.

## 2. Arquivos alterados

| Ficheiro |
|----------|
| `goldeouro-player/src/pages/Dashboard.jsx` |
| `goldeouro-player/src/pages/Profile.jsx` |

## 3. Correção aplicada

- **Dashboard:** removido `setUser` com email/nome inventados e `id` fixo; removido saldo implícito “falso” em erro — `balance` passa a `null` quando o perfil não carrega; introduzido `profileLoadError`; tratamento de `profileResponse.data.success === false`; cartão de saldo com mensagem de erro + link **Tentar novamente**; durante `loading`, texto “Carregando…” no valor do saldo (em vez de assumir valor).
- **Profile:** `user` inicial `null`; removido fallback `free10signer` no `catch`; `profileLoadError` e ramo `success === false`; conteúdo principal (cartão, abas) só renderiza com `user` válido; estados **Carregando…** e erro com **Tentar novamente**; `handleCancel` protegido quando `user` é `null`.

## 4. Comportamento final

| Cenário | Comportamento |
|--------|----------------|
| **Sucesso** | Perfil e saldo vêm da API; saudação com `user?.nome` ou parte do email; lista PIX/histórico conforme antes (PIX em erro continua com lista vazia, sem identidade falsa). |
| **Erro de carregamento de perfil** | Mensagem honesta; sem nome/email/saldo inventados; **Tentar novamente** chama o mesmo loader. |
| **Sem dados / falha** | `user` ausente no Dashboard: saudação cai em “Jogador”; saldo não mostra valor numérico até haver perfil válido ou mostra bloco de erro se `profileLoadError` estiver definido. No Perfil, só loading ou painel de erro até sucesso. |

## 5. Impacto da mudança

- **Backend:** nenhum.
- **Banco de dados:** nenhum.
- **Impacto financeiro real:** nenhum (apenas estado React e texto na UI).
- **Confiança:** o utilizador deixa de ver identidade ou saldo “encenados” após falha de rede/API.

## 6. Testes executados

- **Grep:** `free10signer` ausente em `Dashboard.jsx` e `Profile.jsx` (confirmado).
- **Linter (IDE):** sem diagnósticos reportados nos dois ficheiros.
- **`npm run build`:** neste ambiente, `vite` não estava disponível no PATH sem `node_modules` completo; tentativa com `npx vite` puxou versão externa e o build não foi concluído de forma fiável aqui. **`npm install`** foi iniciado mas com avisos de tarball/correção de rede — **build de produção não validado nesta máquina**.
- **Testes manuais na app:** não executados (dependência de instalação/build local).

## 7. Riscos eliminados

- Exibição de email/nome `free10signer` após erro.
- Sensação de “conta válida” com saldo R$ 0,00 após falha total de perfil no Dashboard (substituído por erro explícito ou carregamento).

## 8. Riscos remanescentes

- Em **sucesso** com campos API ausentes, mantêm-se fallbacks genéricos já existentes no ramo de sucesso (ex.: email de placeholder no Perfil) — fora do `catch`, não alterado para manter escopo mínimo.
- **Leaderboard** e outros mocks documentados noutros ficheiros não foram tocados nesta fase.
- Build não reproduzido com sucesso neste ambiente; recomenda-se `npm ci` ou `npm install` saudável e `npm run build` local antes de deploy.

## 9. Diagnóstico final

**Classificação: APROVADA COM RESSALVAS**

Objetivo do BLOCO F (remover fallbacks enganosos nos dois ficheiros autorizados, com erro honesto e retry) **cumprido**. Ressalva principal: **validação de build automatizada não concluída** neste ambiente; validação estática e linter local indicam coerência.
