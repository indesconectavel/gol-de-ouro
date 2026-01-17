RELATORIO-REMOVER-BANNER-VERSAO

Objetivo
- Remover o banner visual de versão (🚀 VERSÃO ATUALIZADA...) de páginas públicas/privadas do frontend, sem impacto funcional.

Escopo executado
- Somente remoção do componente `VersionBanner` nas páginas:
  - `goldeouro-player/src/pages/Login.jsx`
  - `goldeouro-player/src/pages/Dashboard.jsx`
  - `goldeouro-player/src/pages/Profile.jsx`
  - `goldeouro-player/src/pages/Pagamentos.jsx`
  - `goldeouro-player/src/pages/Register.jsx`

O que foi alterado
- Remoção do import `VersionBanner` nas páginas acima.
- Remoção do JSX `<VersionBanner showTime={true} />` nas páginas acima.

O que NÃO foi alterado
- Engine V19
- Rotas do jogo (`/game`)
- Backend, PIX, economia, webhooks
- Service Worker, cache, build pipeline
- Qualquer regra de negócio ou lógica de autenticação

Motivo técnico
- O banner é puramente visual e não controla fluxo de negócio.
- Remoção elimina ruído visual e evita reaparecimento por inconsistência de build/cache.

Commit(s)
- `7ac5f32` — chore(ui): remover banner de versão

Risco
- Baixíssimo (alteração apenas de UI estática).

Rollback
- Reverter o commit acima ou reintroduzir o `VersionBanner` nas páginas listadas.


