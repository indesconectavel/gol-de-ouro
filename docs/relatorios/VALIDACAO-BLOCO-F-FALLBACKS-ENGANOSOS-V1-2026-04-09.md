# VALIDAÇÃO — BLOCO F — FALLBACKS ENGANOSOS V1

**Modo:** read-only (código não alterado nesta validação)  
**Data de referência:** 2026-04-09  
**Branch de trabalho observada:** `snapshot/v1-estavel-2026-04-09`

---

## 1. Resumo executivo

A cirurgia do BLOCO F está **refletida nos dois ficheiros autorizados** do `goldeouro-player`: os fallbacks com identidade `free10signer` nos ramos de **erro** foram removidos; há **estado de erro explícito** (`profileLoadError`) e **retry** coerente (`loadUserData` / `loadUserProfile`). Não há alterações de backend nem mudança de contratos HTTP nestes ficheiros — apenas leitura e tratamento de resposta no cliente. A validação de **build de produção** não foi reproduzida neste relatório (depende do ambiente local); recomenda-se confirmar `npm run build` antes de fechar a V1.

---

## 2. Escopo validado

| Verificação | Resultado |
|-------------|-----------|
| Ficheiros com alterações em relação a `HEAD` (Git) | Apenas `goldeouro-player/src/pages/Dashboard.jsx` e `goldeouro-player/src/pages/Profile.jsx` |
| Backend / SQL / rotas servidor | Nenhuma alteração atribuível ao BLOCO F neste diff |
| Outros componentes (Leaderboard, Withdraw, etc.) | Sem mudanças no âmbito deste diff |
| Documentação | Existe ficheiro não rastreado `docs/relatorios/CIRURGIA-BLOCO-F-FALLBACKS-ENGANOSOS-V1-2026-04-09.md` (relatório da cirurgia); não expande escopo técnico da app |

**Conclusão de escopo:** alinhado ao autorizado — **só os dois `.jsx`** no conjunto de alterações versionadas analisadas.

---

## 3. Correções confirmadas

### Dashboard (`Dashboard.jsx`)

- **Sem `free10signer`:** grep no ficheiro sem ocorrências.
- **Erro / `success === false`:** `setUser(null)`, `setBalance(null)`, `setProfileLoadError(...)` — não há objeto de utilizador inventado no `catch`.
- **Saldo em erro:** o cartão de saldo não mostra `R$ …` quando `profileLoadError` está ativo; mostra mensagem e **Tentar novamente** (`onClick={() => loadUserData()}`).
- **Carregamento:** enquanto `loading`, texto “Carregando…” no valor do saldo (evita afirmar saldo antes da resposta).
- **Retry:** limpa erro no início de `loadUserData` (`setProfileLoadError(null)`) e reutiliza o mesmo fluxo com `retryDataRequest` no perfil (inalterado em intenção).

### Profile (`Profile.jsx`)

- **Sem `free10signer`:** grep no ficheiro sem ocorrências.
- **Erro / `success === false`:** `setUser(null)` + `setProfileLoadError(...)` — sem identidade inventada no `catch`.
- **Renderização com `user` ausente:** conteúdo principal (cartão, abas) só dentro de `user ? ( <> … </> ) : null`; estados explícitos para **Carregando…** e painel de **erro + Tentar novamente** (`loadUserProfile()`).
- **`handleCancel`:** guarda `if (!user) return` antes de aceder a `user.name` / `user.email`.

---

## 4. Regressão

| Área | Avaliação |
|------|-----------|
| Contratos de API | Mesmos endpoints: `API_ENDPOINTS.PROFILE`, `API_ENDPOINTS.PIX_USER` (Dashboard); `API_ENDPOINTS.PROFILE` e `PUT '/api/user/profile'` (Profile) — **sem novos paths ou payloads** introduzidos pelo BLOCO F |
| Lógica financeira (servidor) | **Nenhuma** — alterações só em estado React e UI |
| Quebra óbvia de renderização | Perfil: ramos `loading` / `profileLoadError` / `user` cobrem `user` nulo; Dashboard: saudação com optional chaining (`user?.nome` …) |
| Dependência de dados fictícios de erro | Removida nos `catch`; ramo de **sucesso** no Profile ainda usa placeholders genéricos se a API não devolver email (`usuario@email.com`) — **comportamento pré-existente no ramo de sucesso**, fora do objetivo explícito de remover fallback **em erro** |

---

## 5. Cruzamento com BLOCO A

| Pergunta | Resposta objetiva |
|----------|-------------------|
| A cirurgia altera apenas percepção visual? | **Sim** no que toca a não mostrar identidade/saldo “encenados” após falha; o cliente continua apenas a **exibir** o que a API devolve em caso de sucesso. |
| Impacto real em saldo, histórico ou backend? | **Não.** Não há escrita no servidor nem alteração de regras de negócio nestes ficheiros. |
| É necessário reabrir BLOCO A? | **Não.** O BLOCO F não invalida nem toca na blindagem financeira do backend descrita no BLOCO A. |

---

## 6. Ressalvas

- **Build:** não foi executado nesta validação read-only; o relatório da cirurgia já registrou build não concluído noutro ambiente — **confirmar localmente** `npm run build` no `goldeouro-player`.
- **Fora do escopo BLOCO F:** placeholders no ramo de **sucesso** (ex.: email genérico quando `userData.email` falta); mocks de gamificação/achievements quando o hook não devolve dados; referências a `free10signer` noutros ficheiros do repo (ex. documentação/HTML de teste) **não fazem parte** dos dois ficheiros autorizados.
- **Estado limite teórico:** no Dashboard, o valor `R$ (balance ?? 0)` só aparece quando não há `loading` nem `profileLoadError`; em fluxos anómalos de API, o desenho atual assume que esse ramo corresponde a perfil carregado com sucesso.

---

## 7. Classificação final

**APROVADA COM RESSALVAS**

**Motivo:** implementação nos ficheiros autorizados está **coerente** com o objetivo (erro honesto, sem identidade fictícia em falha, retry presente, renderização segura). Ressalva principal: **validação de build** não confirmada neste processo.

---

## 8. Síntese para aceitação V1

O BLOCO F pode ser considerado **aceitável para a V1** do ponto de vista de **escopo, remoção de fallbacks enganosos em erro e ausência de impacto backend/financeiro**, desde que o **build** seja confirmado no pipeline ou máquina de integração antes do deploy.
