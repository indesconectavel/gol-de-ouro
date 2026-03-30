# Relatório executivo completo — GoldeOuro V1 (produção)

**Data de consolidação:** 2026-03-28  
**Tipo:** síntese para decisão (produto, operações, engenharia).  
**Base:** auditorias READ-ONLY já produzidas no repositório; sem nova execução de testes neste documento.

**Ficheiro canónico (nome curto):** `docs/relatorios/RELATORIO-EXECUTIVO-COMPLETO.md`  
**Atalho datado:** `docs/relatorios/RELATORIO-EXECUTIVO-COMPLETO-2026-03-28.md` (redireciona para este documento).

---

## 1. Propósito e leitores

Este relatório consolida o estado **verificável** do ecossistema **Player (Vercel)** + **Backend API (Fly.io)** no que diz respeito a **deploy**, **fluxo financeiro (PIX / saldo / saque)** e **critérios de GO/NO-GO** para operações com dinheiro real.

**Público-alvo:** liderança técnica e operacional que precisa de uma visão única: o que está alinhado, o que está em risco e o que falta fechar antes de liberar PIX real de ponta a ponta.

---

## 2. Visão em uma página

| Dimensão | Estado resumido | Veredito operacional |
|----------|-----------------|----------------------|
| **Player em produção (domínios públicos)** | `www`, `app` e redirect do apex servem o **mesmo** par de artefactos certificados (`index-BkwLfIcL.js`, `index-yFQt_YUB.css`); bundle aponta para **`goldeouro-backend-v2.fly.dev`**. | **GO técnico** para “build correcto no ar” (face à auditoria pós-promoção). |
| **Smoke autenticado (login, game, PIX UI)** | **Não** executado na auditoria pós-promoção documentada. | **NO-GO** para “PIX real” até checklist humano completo e registado. |
| **Backend financeiro (código `server-fly.js`)** | PIX com *claim* `pending`→`approved` + crédito com lock otimista em `saldo`; webhook e reconciliação partilham a mesma função de crédito. | **NÃO** considerado “seguro para PIX real” em sentido **holístico** (ver §5). |
| **Rastreio documental Vercel** | Production atual usa deployment id **diferente** do exemplo antigo nos papéis; **fingerprints** de artefactos batem com o pacote certificado. | Actualizar runbooks para **artefactos + inspect actual**; não depender só de id antigo. |

---

## 3. Arquitectura de referência (produção)

| Componente | Evidência no repositório / auditorias |
|------------|----------------------------------------|
| **API** | `Dockerfile`: `CMD ["node", "server-fly.js"]`; `fly.toml`: app `goldeouro-backend-v2`, `NODE_ENV=production`. |
| **Player** | Vercel, project `goldeouro-admins-projects/goldeouro-player`; domínios `goldeouro.lol`, `www`, `app`. |
| **Ligação cliente→API** | String `https://goldeouro-backend-v2.fly.dev` presente no bundle servido em `app` (auditoria pós-promoção). |

---

## 4. Frontend e deploy (Player)

### 4.1 O que foi demonstrado

- **Alinhamento entre hostnames:** após redirect, apex / `www` / `app` convergem para os **mesmos** assets e cabeçalhos coerentes (`ETag`, `Content-Length` iguais entre `www` e `app` na amostra).
- **HUD /game:** CSS público contém regra `body[data-page=game] … brand-logo-small … 200px`, alinhada ao estado certificado (não à assinatura antiga 150px-only).
- **CSP:** inclui Posthog e GTM, coerente com `vercel.json` actual do projecto.
- **Deployment id:** na sessão pós-promoção, Production resolveu para **`dpl_9VbFmLgX8UMpUfefsp5qHRb5GqiU`** (distinto do exemplo **`dpl_5nY2…`** nos documentos anteriores), com **mesmos** hashes de ficheiro no nome dos assets.

### 4.2 Lacuna explícita

- **Teste autenticado** (login, dashboard, `/game` interactivo, fluxo de pagamento) **não** consta como executado na auditoria pós-promoção; por política interna (**incerteza → bloqueio financeiro**), mantém-se **NO-GO para PIX real** só com essa evidência.

### 4.3 Documentos de detalhe

- `docs/relatorios/AUDITORIA-POS-PROMOCAO-PLAYER-PIX-READY-2026-03-28.md`
- `docs/relatorios/AUDITORIA-FORENSE-DEPLOY-CORRETO-CURRENT-PLAYER-2026-03-27.md` (contexto *antes* da promoção; útil para histórico de regressão)

---

## 5. Backend financeiro (API)

### 5.1 PIX (entrada de dinheiro)

**Fluxo resumido:** criação de cobrança no Mercado Pago → persistência em `pagamentos_pix` (`pending`) → webhook (ou job de reconciliação) confirma `approved` na API MP → função única `creditarPixAprovadoUnicoMpPaymentId`:

1. Localiza pagamento por `external_id` / `payment_id` (id MP).
2. *Claim* atómico: só um processo passa de `pending` para `approved`.
3. Incrementa `usuarios.saldo` com **lock otimista** (`.eq('saldo', saldoAnt)`).
4. Se já `approved`, devolve `already_processed` (sem segundo crédito).

**Forças:** reduz **duplo crédito** pelo mesmo pagamento quando existe **uma linha** por `payment.id` e o fluxo completa as duas escritas.

### 5.2 Riscos financeiros prioritários (backend)

| Prioridade | Risco | Impacto |
|------------|-------|---------|
| **Crítico** | **Janela não atómica:** `pagamentos_pix` passa a `approved` **antes** de persistir o crédito em `saldo`. Falha intermédia pode gerar **aprovado local sem saldo** e **bloquear** novo crédito automático (`already_processed`). | Perda de crédito percebida pelo utilizador; suporte / correcção manual. |
| **Alto** | Falha do `insert` em `pagamentos_pix` com resposta ainda positiva ao cliente (QR válido no MP). | Pagamento no MP **sem** linha local → webhook não correlaciona. |
| **Alto** | Crédito zero (`amount`/`valor` ≤ 0) com linha marcada `approved` sem movimento de saldo. | Inconsistência de dados. |
| **Crítico (saque)** | Após débito, falha no `insert` de `saques` e **falha do rollback** de saldo. | Saldo debitado **sem** registo de saque. |
| **Médio** | Rollbacks do endpoint de **chute** e crédito de **login** (saldo inicial) **sem** lock otimista no valor actual do saldo. | Corridas com PIX/jogo podem distorcer saldo. |
| **Médio** | Várias máquinas Fly: reconciliação usa flag **em memória** só por processo. | Mais chamadas MP; *claim* em BD continua a serializar crédito. |
| **Residual** | Duplicidade teórica se **não** existir `UNIQUE` em `external_id` em produção (schema verificado no SQL do repo, não em runtime na auditoria financeira). | Ambiguidade em `.maybeSingle()` / múltiplas linhas. |

### 5.3 Saque (saída)

- **Ordem correcta:** débito com lock otimista **antes** do `insert` em `saques`; tentativa de rollback se o insert falhar.
- **Ausências no artefacto auditado:** idempotência HTTP (`X-Idempotency-Key` / `correlation_id` no insert) e **worker de payout** no mesmo `package.json` / processo — liquidação após `pendente` pode ser externa ou outro serviço **não** coberto por este relatório.

### 5.4 Trilha contábil

- O ficheiro de produção **`server-fly.js`** analisado **não** escreve em `ledger_financeiro`. A trilha no código inspecionado assenta em **`pagamentos_pix`**, **`usuarios.saldo`** e **`chutes`** (jogo).

### 5.5 Veredito da auditoria financeira (código)

Conforme `docs/relatorios/AUDITORIA-FINANCEIRO-PRODUCAO-2026-03-28.md`:

- **SEGURO PARA PIX REAL (holístico): NÃO** — devido a janela claim/saldo, dependência de schema, falhas parciais de saque e outros pontos acima.
- **Duplo crédito pelo mesmo `payment_id`:** **mitigado** no caminho feliz; **não** eliminado em todos os cenários sem confirmação de constraints e atomicidade ao nível da base de dados.

### 5.6 Documento de detalhe

- `docs/relatorios/AUDITORIA-FINANCEIRO-PRODUCAO-2026-03-28.md`

---

## 6. Matriz de riscos consolidada (residual)

| ID | Área | Risco | Severidade |
|----|------|-------|------------|
| E1 | Operações | PIX real sem smoke autenticado registado | **Alto** |
| E2 | Backend | Aprovado em `pagamentos_pix` sem crédito em `saldo` (falha entre escritas) | **Crítico** |
| E3 | Backend | Débito de saque sem linha em `saques` (rollback falhou) | **Crítico** |
| E4 | Backend | QR entregue sem linha `pagamentos_pix` | **Alto** |
| E5 | Backend / jogo | Rollbacks e saldo inicial sem lock otimista | **Médio** |
| E6 | Infra | Múltiplas instâncias API + reconciliação em memória | **Médio** |
| E7 | Processos | Runbooks com deployment id Vercel desactualizado | **Baixo/Médio** (erro humano) |

---

## 7. Decisões recomendadas (executivas)

1. **Manter NO-GO para teste PIX com dinheiro real** até: (a) conclusão documentada do checklist operacional com **sessão autenticada** em `https://app.goldeouro.lol` (ou domínio oficial); (b) alinhamento explícito da equipa com os riscos **E2–E4** e plano de monitorização ou correcção estrutural (transacções DB, ordem das escritas, ou job de reparação).
2. **Actualizar documentação operacional** para referenciar **fingerprints de artefactos** (`BkwLfIcL` / `yFQt_YUB`) e o **deployment id actual** obtido via `vercel inspect`, em vez de fixar apenas um id histórico.
3. **Confirmar em Supabase (produção)** existência de **`UNIQUE` em `pagamentos_pix.external_id`** (e coerência de `status` com o código: `pending` vs `pendente` por tabela).
4. **Separar claramente** “deploy correcto no ar” (GO técnico de artefactos) de “sistema financeiro certificado para dinheiro real” (NO-GO até fechar lacunas E1–E4).

---

## 8. Próximas acções sugeridas (checklist)

| # | Acção | Dono sugerido | Critério de fecho |
|---|--------|---------------|-------------------|
| 1 | Executar Etapa 3 (e se aplicável 4) do checklist de promoção — login, dashboard, `/game`, HUD | QA / Operações | Registo datado com resultado |
| 2 | Validar schema `pagamentos_pix` + amostra de pagamentos presos `approved` sem movimento de saldo | Backend / DBA | Query + política de reparação |
| 3 | Rever fluxo de saque (rollback, idempotência, worker/payout) face ao ambiente real Fly | Backend | Diagrama de sequência actualizado |
| 4 | Actualizar runbooks com deployment id e artefactos actuais | Operações / DevOps | PR ou doc revisto |

---

## 9. Índice de relatórios de suporte

| Documento | Conteúdo |
|-----------|-----------|
| `AUDITORIA-FINANCEIRO-PRODUCAO-2026-03-28.md` | Forense financeira completa (PIX, saque, saldo, recon, BD, veredito). |
| `AUDITORIA-POS-PROMOCAO-PLAYER-PIX-READY-2026-03-28.md` | Player pós-promoção, artefactos, NO-GO PIX, comandos de reprodução. |
| `AUDITORIA-FORENSE-DEPLOY-CORRETO-CURRENT-PLAYER-2026-03-27.md` | Comparação Production vs preview branch (contexto histórico). |

---

## 10. Declaração de limites

- Este relatório **não** substitui auditoria legal ou contabilística.
- **Não** foram executados neste ficheiro novos pedidos HTTP nem alterações de código; trata-se de **consolidação** de trabalhos já documentados no repositório.
- Qualquer **GO** futuro para PIX real deve citar **evidência nova** (smoke autenticado +, se aplicável, reavaliação dos riscos E2–E4 após mudanças de código ou de schema).

---

*Fim do relatório executivo completo.*
