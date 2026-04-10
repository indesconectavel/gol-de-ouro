# CIRURGIA — BLOCO F — F2-B — PLACEHOLDERS NO SUCESSO (V1)

**Data:** 2026-04-09  
**Modo:** cirurgia controlada, frontend apenas.

---

## 1. Arquivos alterados

| Ficheiro |
|----------|
| `goldeouro-player/src/pages/Profile.jsx` |
| `goldeouro-player/src/components/AdvancedStats.jsx` |

Não foram alterados: backend, `Dashboard.jsx`, `Withdraw.jsx`, `Leaderboard.jsx`, jogos, contratos HTTP.

---

## 2. Trechos modificados (resumo)

### `Profile.jsx`

- Constante `NOT_INFORMED = '—'` para campos ausentes na API.
- Ramo de **sucesso** do perfil: nome e email sem `usuario@email.com`, sem `Usuário` genérico nem data `2024-01-01`; `joinDate` só a partir de `created_at` ou `—`.
- Saldo: `balance` como número apenas se `Number.isFinite`; caso contrário `null` e exibição `—` (não assume R$ 0,00 inventado).
- `editForm`: strings vazias quando não há nome/email na API (inputs de edição).
- Após `PUT` perfil: normalização de nome/email com `NOT_INFORMED` quando aplicável.
- Conquistas: removido array mock de fallback; lista = `achievements` do hook ou `[]`; mensagem quando vazio.
- Cartão “Saldo atual”: `R$ …` só com saldo finito; senão `—`.

### `AdvancedStats.jsx`

- Removidos dados simulados (gráficos por dia/semana, tendências 2024, zonas, comparações fixas).
- Substituído por painel com texto explícito de indisponibilidade de gráficos/comparações e métricas derivadas só de `user` (perfil) e `userStats` (hook / gamificação).

---

## 3. Comportamento final

| Situação | Comportamento |
|----------|----------------|
| API devolve nome, email, data, saldo | Exibição dos valores reais. |
| API omite email e/ou nome | `—` na UI; formulário de edição com campos vazios até o utilizador preencher. |
| API omite `created_at` | “Membro desde —”. |
| Saldo inválido ou ausente | “Saldo atual” mostra `—`, não R$ 0,00 forçado. |
| Aba Estatísticas (`/profile`) | Mensagem honesta + resumo numérico sem dados de demonstração. |
| Aba Conquistas sem lista | Mensagem “Nenhuma meta de conquista disponível para exibir.” |

---

## 4. Build

- Executado: `.\node_modules\.bin\vite.cmd build` no diretório `goldeouro-player`.
- **Resultado:** concluído com sucesso (bundle gerado em `dist/`, PWA/SW gerados).

---

## 5. Impacto

- **Backend / banco / financeiro:** nenhum — apenas apresentação e mapeamento de campos já devolvidos pelo cliente.
- **Contratos HTTP:** inalterados (mesmos `GET`/`PUT` e corpos).
- **Confiança V1:** deixa de sugerir identidade, datas ou saldo inventados no ramo de sucesso; estatísticas avançadas deixam de mostrar séries fictícias como reais.

---

## 6. Classificação final

**APROVADA**

Critérios F2-B cumpridos com build validado neste ambiente, escopo limitado aos ficheiros autorizados e sem regressão óbvia nas rotas tocadas.

---

## 7. Testes / verificações

- Grep: ausência de `usuario@email.com`, `2024-01-01` e `'Usuário'` como placeholder em `Profile.jsx`.
- Linter (IDE): sem diagnósticos nos ficheiros alterados.
- Build de produção do player: **OK** (vite 5.4.x).
