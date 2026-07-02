# ASAAS.PIPELINE.5B — Ajustes UX Financeiros Finais antes do PIX OUT

**Projeto:** Gol de Ouro™ V1  
**Engine:** Indesconectável Payment Engine™  
**Versão:** ASAAS.PIPELINE.5B  
**Data:** 02/07/2026  
**Modo:** MELHORIA UX CONTROLADA (sem alteração de Payment Engine)

---

## Resumo Executivo

Etapa de refinamento final da jornada financeira do jogador e do operador, aplicada **exclusivamente na camada de interface**, preparando a V1 para homologação definitiva do PIX OUT.

| Fase | Requisito | Estado |
|------|-----------|--------|
| 1 — Formulário PIX saque | Remover CPF/CNPJ redundante; redirecionar ao perfil | ✅ Implementado |
| 2 — Polling cobrança | 15 segundos centralizado em constante | ✅ Implementado |
| 3 — Botão comercial | "Garantir X chutes" preservado | ✅ Implementado |
| 4 — Provider-agnostic | Sem referências visíveis a PSP | ✅ Implementado |
| 5 — Bloco PIX | QR no topo + scrollIntoView | ✅ Preservado (5A) |
| 6 — Admin saques | Badges e botões padronizados | ✅ Implementado |
| 7 — Responsividade | Botões admin com min-height mobile | ✅ Parcial |
| 8 — Build | Player + Admin | ✅ PASS |
| 9 — Deploy | Player + Admin em produção | ⚠️ **Bloqueado** — token Vercel inválido localmente |

### Veredito Final

**PASS COM RESSALVAS** — Código e builds aprovados; deploy em produção pendente de autenticação Vercel (`vercel login` ou push com CI `frontend-deploy.yml`).

---

## Arquivos Alterados

| Arquivo | Tipo | Alteração |
|---------|------|-----------|
| `goldeouro-player/src/pages/Withdraw.jsx` | Player | Remoção do campo CPF/CNPJ no fluxo de saque; banner + link para `/profile` |
| `goldeouro-player/src/pages/Pagamentos.jsx` | Player | Polling 15s; botão "Garantir X chutes"; texto neutro no fallback |
| `goldeouro-player/src/pages/Privacy.jsx` | Player | Remoção de "Mercado Pago" na política de privacidade |
| `goldeouro-admin/src/pages/SaqueUsuarios.jsx` | Admin | Badges provider-agnostic; confirmações sem PSP; botões touch-friendly |

**Não alterados (conforme regra):** Payment Engine, Wallet, Ledger, Webhooks, Providers, endpoints financeiros, gameplay.

---

## Melhorias Implementadas

### Fase 1 — Formulário de Chave PIX (`Withdraw.jsx`)

**Decisão sobre CPF/CNPJ:**

| Tipo de chave | Campo no formulário de saque? | Comportamento |
|---------------|--------------------------------|---------------|
| **CPF** | Não | A própria chave é o documento |
| **E-mail** | Não | Valida `usuarios.cpf_cnpj` já cadastrado no perfil |
| **Telefone** | Não | Idem |
| **Chave aleatória** | Não | Idem |

**Mudanças:**

- Removido estado `cpfCnpj` do formulário e o input "CPF ou CNPJ do Titular".
- Removida lógica de `PUT /api/profile` durante o submit do saque.
- Se o perfil estiver incompleto (e-mail/telefone/aleatória sem CPF/CNPJ válido):
  - Exibe banner: *"Para solicitar saques, complete seus dados cadastrais antes de continuar."*
  - Botão *"Ir para Meu Perfil"* → `/profile`
  - Submit bloqueado até o cadastro estar completo.
- Backend continua validando `usuarios.cpf_cnpj` em `server-fly.js` — sem alteração de contrato.

### Fase 2 — Polling da Cobrança (`Pagamentos.jsx`)

```javascript
const PAYMENT_STATUS_POLLING_INTERVAL_MS = 15000;
```

- Intervalo alterado de **8s → 15s**.
- Um único `setInterval` por cobrança ativa.
- `clearInterval` no cleanup do `useEffect` (desmontagem ou status `approved`).
- Encerramento automático quando pagamento confirmado.

### Fase 3 — Experiência Comercial (`Pagamentos.jsx`)

Botão principal restaurado ao posicionamento de jogo:

```text
Garantir 5 chutes
Garantir 10 chutes
Garantir 20 chutes
…
```

Fórmula: `Math.floor(valorRecarga / VALOR_POR_CHUTE)` com `VALOR_POR_CHUTE = 1` (economia V1).

**Não** utiliza: "Recarregar", "Adicionar saldo", "Depositar saldo".

### Fase 4 — Interface Provider-Agnostic

| Local | Antes | Depois |
|-------|-------|--------|
| `Pagamentos.jsx` fallback | "página segura do provedor" | "página segura de pagamento PIX" |
| `Privacy.jsx` | "Parceiros de pagamento (Mercado Pago)" | "Parceiros de pagamento autorizados" |
| `SaqueUsuarios.jsx` confirmação | "via Automático/Legado" | "enviará um PIX REAL ao jogador" |
| `SaqueUsuarios.jsx` banner | "pelo provider ativo" | "automaticamente" |
| Badges admin | "Pago automaticamente", "Legado", "Falha no envio" | "Pago", "Enviado", "Falha" (neutros) |

### Fase 5 — Bloco PIX (preservado)

Ordem mantida após criar cobrança:

```text
QR Code
  ↓
Código Copia e Cola
  ↓
Status
  ↓
Informações complementares
```

- `renderPagamentoAtual()` posicionado após o header (antes do formulário).
- `scrollIntoView({ behavior: 'smooth', block: 'start' })` ao criar cobrança.
- Imagem `qr_code_base64` renderizada quando disponível.

### Fase 6 — Administrador (`SaqueUsuarios.jsx`)

| Elemento | Valor |
|----------|-------|
| Botão principal | **Aprovar e Enviar PIX** |
| Baixa manual | **Marcar como Pago Manualmente** (confirmação obrigatória) |
| Badges | Pendente · Enviado · Autorizado · Pago · Pago Manualmente · Falha · Cancelado |
| Banner | Ambiente · status operacional PIX OUT · runtime — **sem PSP** |

### Fase 7 — Responsividade

- Botões de ação admin com `min-h-[36px]` para melhor toque em mobile.
- QR Code com `max-w-full` e `w-56 h-56` — já presente desde 5A.
- Tabela de histórico com `overflow-x-auto` — ressalva mobile mantida.

---

## Evidências do Build

### Player (`goldeouro-player`)

```text
> npm run build
✓ built in 52.49s
exit code: 0
Bundle: dist/assets/index-9r2ds_AP.js (398.68 kB)
```

### Admin (`goldeouro-admin`)

```text
> npm run build
✓ built in 2m 14s
exit code: 0
Bundle: dist/assets/index-488e6752.js (251.34 kB)
```

### Lint

Sem erros reportados nos arquivos alterados.

---

## Evidências do Deploy

### Tentativa local

```text
npx vercel --prod --yes
Error: The specified token is not valid. Use `vercel login` to generate a new token.
```

**Player e Admin:** deploy **não executado** nesta sessão.

### Validação produção (pré-deploy)

| URL | Estado observado |
|-----|------------------|
| https://www.goldeouro.lol/pagamentos | Login gate — UX antiga ainda em produção |
| https://admin.goldeouro.lol/saque-usuarios | Não validado (requer auth admin) |

### Caminhos alternativos de deploy

1. **CLI:** `vercel login` → `npm run build` → `npx vercel --prod` em cada pasta.
2. **CI:** Push para branch monitorada por `.github/workflows/frontend-deploy.yml` (secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
3. **Dashboard Vercel:** Redeploy manual dos projetos `goldeouro-player` e `goldeouro-admin`.

### Checklist pós-deploy (operador)

- [ ] QR Code no topo em `/pagamentos`
- [ ] Polling 15s (Network tab: intervalo entre `PIX_STATUS`)
- [ ] Botão "Garantir X chutes"
- [ ] Formulário de saque sem campo CPF/CNPJ redundante
- [ ] Banner de perfil incompleto em `/withdraw` (e-mail/telefone/aleatória)
- [ ] Interface sem menção a Asaas/Mercado Pago
- [ ] Admin: badges neutros e botões "Aprovar e Enviar PIX" / "Marcar como Pago Manualmente"

---

## Riscos Residuais

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Deploy não refletido em produção | Média | Executar deploy via Vercel autenticado ou CI |
| Jogador com perfil incompleto bloqueado no saque | Baixa | Mensagem clara + link para `/profile` |
| Polling 15s pode parecer lento vs 8s | Baixa | Reduz carga na API; aceitável para UX financeira |
| Histórico admin "Legado" removido | Baixa | Saques antigos MP exibidos como "Pago" — operador pode consultar ledger |
| Teste real PIX OUT ainda pendente | Alta | Fora escopo 5B — requer operador humano (PIPELINE.5 Fase 4) |

---

## Critério de Encerramento

| Critério | Status |
|----------|--------|
| Formulário de saque simplificado | ✅ |
| Polling 15 segundos | ✅ |
| Botão "Garantir X chutes" | ✅ |
| QR Code destacado no topo | ✅ |
| Interface provider-agnostic | ✅ |
| Player e Admin deployados | ⚠️ Pendente |
| Relatório oficial emitido | ✅ |

---

## Veredito Final

**PASS COM RESSALVAS**

O refinamento UX está completo no código e validado por build local. A etapa só atinge **PASS** pleno após deploy dos frontends e smoke test nas URLs de produção.

---

## Próximos Passos Recomendados

1. Autenticar Vercel e publicar `goldeouro-player` + `goldeouro-admin`.
2. Smoke test em `/pagamentos` e `/saque-usuarios`.
3. Executar teste real PIX OUT (approve-and-send + webhook + ledger).
4. Promover veredito para **PASS** após validação em produção.

---

*Relatório emitido em 02/07/2026 — ASAAS.PIPELINE.5B — Gol de Ouro™ V1*
