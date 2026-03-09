# BLOCO D — SALDO / PERFIL / PAGAMENTOS

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO  
**Referências:** Baseline FyKKeg6zb | Produção atual ez1oc96t1 | Código local

---

## 1. Escopo auditado

| Tipo | Itens |
|------|--------|
| **Backend** | server-fly.js (GET /api/user/profile, PUT /api/user/profile, POST /api/payments/pix/criar, POST /api/payments/webhook, GET /api/payments/pix/usuario, reconcilePendingPayments; escritas em usuarios.saldo, pagamentos_pix, chutes, saques, ledger_financeiro) |
| **Frontend** | Dashboard.jsx, Profile.jsx, Pagamentos.jsx, Withdraw.jsx, gameService (loadUserData → profile), api.js (PROFILE, PIX_CREATE, PIX_USER) |
| **Documentação** | AUDITORIA-BLOCO-D-SISTEMA-DE-SALDO-READONLY-2026-03-07.md (inventário de escritas, depósito PIX, chute, saque, rollback, triggers) |

---

## 2. Fonte de verdade do bloco

- **Saldo:** usuarios.saldo no Supabase; único endpoint de leitura para o jogador: GET /api/user/profile.
- **Perfil:** GET /api/user/profile retorna id, email, username, saldo, tipo, total_apostas, total_ganhos.
- **Pagamentos/Depósito:** POST /api/payments/pix/criar + webhook + reconciliação; crédito em usuarios.saldo via claim atômico em pagamentos_pix.
- **Frontend:** Todas as telas que exibem saldo (Dashboard, GameShoot, Withdraw, Profile) usam GET /api/user/profile (API_ENDPOINTS.PROFILE). **Exceção:** Navigation (sidebar) exibe valor fixo "R$ 150,00" (AUDITORIA-BLOCO-F-INTERFACE-2026-03-08).

---

## 3. Evidências concretas

| Evidência | Local |
|-----------|--------|
| Perfil e saldo backend | server-fly.js ~943: GET /api/user/profile, authenticateToken; SELECT usuarios |
| Depósito PIX | server-fly.js ~1474 (pix/criar), ~1955 (webhook); claim atômico + UPDATE usuarios.saldo |
| Histórico PIX usuário | server-fly.js ~1631: GET /api/payments/pix/usuario |
| Fonte única de saldo no frontend | Dashboard, GameShoot (gameService), Withdraw, Profile: apiClient.get(PROFILE) → data.saldo |
| Saldo fixo na sidebar | Navigation.jsx: valor fixo "R$ 150,00" (BLOCO F) |
| Inventário escritas | AUDITORIA-BLOCO-D-SISTEMA-DE-SALDO-READONLY-2026-03-07, seção 9 |
| Trigger chutes/saldo | schema-supabase-final.sql (update_user_stats); CONFIRMACAO-TRIGGER-CHUTES-SALDO-READONLY-2026-03-07 |

---

## 4. Alinhamento com baseline validada

**Resposta:** **parcial**

- Baseline FyKKeg6zb documenta rotas /, /game, /dashboard e bundle index-qIGutT6K.js. Não há registro explícito de qual endpoint de perfil/saldo era chamado na baseline nem se o saldo na sidebar já era fixo. O **backend** de perfil e PIX é o mesmo (goldeouro-backend-v2.fly.dev), logo alinhado. **Frontend:** produção atual (ez1oc96t1) e local usam a mesma cadeia (PROFILE para saldo); se a baseline usava o mesmo bundle que hoje usa PROFILE, então alinhado; não confirmado por documentação.

---

## 5. Alinhamento com produção atual

**Resposta:** **sim**

- Produção atual é build do código local. Saldo exibido em dashboard, game, profile e withdraw vem do mesmo endpoint /api/user/profile. Única divergência de exibição: sidebar com saldo fixo (problema de UI, não de fonte de dados).

---

## 6. Diferenças encontradas

| Tipo | Descrição |
|------|------------|
| **Visual** | Sidebar (Navigation) mostra "R$ 150,00" fixo; demais telas mostram saldo real. Inconsistência de exibição (BLOCO F). |
| **Funcional** | Depósito aprovado não gera registro em ledger_financeiro no server-fly (apenas usuarios.saldo + pagamentos_pix). Documentado em BLOCO A/D. |
| **Ambiente** | Trigger que debita saldo em chute perdido (miss) pode não existir em produção se schema for SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0; CONFIRMACAO-TRIGGER confirma trigger em prod. |
| **Legado** | Nenhum bloco “não deployado” relevante para saldo/perfil/pagamentos identificado. |

---

## 7. Risco operacional

**Classificação:** **médio**

- Risco principal: saldo fixo na sidebar induz usuário a achar que o saldo está errado. Risco de dados: dependência do trigger para débito em miss; se trigger não existir, saldo não debita em chute perdido (documentado em BLOCO D).

---

## 8. Pode usar o local como referência para este bloco?

**Resposta:** **sim, com ressalvas**

- Para **fonte de dados** (perfil, saldo, PIX, histórico): sim — local e produção atual usam os mesmos endpoints e mesma lógica. Ressalva: **sidebar** não reflete saldo real; em testes, não considerar o valor da sidebar como referência. Para **reconciliação contábil completa**, depósito e chute não geram ledger no código (apenas saque); documentado.

---

## 9. Exceções que precisam ser registradas

1. **Saldo na sidebar:** Valor fixo "R$ 150,00" em Navigation.jsx; registrar como exceção visual e não usar para homologação de saldo.
2. **Ledger sem depósito/chute:** Depósito e chute não inserem em ledger_financeiro no server-fly; reconciliação contábil exige pagamentos_pix + chutes + usuarios.
3. **Trigger em produção:** Confirmar que o trigger de chutes (débito em miss) está aplicado no schema de produção (CONFIRMACAO-TRIGGER-CHUTES-SALDO-READONLY-2026-03-07).

---

## 10. Classificação final do bloco

**BLOCO ALINHADO COM RESSALVAS**

- Alinhado com **produção atual** (sim) na fonte de dados e fluxo. Alinhado com **baseline** (parcial — backend sim; frontend não confirmado). Pode usar local como referência com ressalva obrigatória do saldo na sidebar e do modelo de ledger (sem depósito/chute).

---

*Auditoria READ-ONLY. Nenhum arquivo ou deploy foi alterado.*
