# PE.BRAND.2 — Formalização Proprietária e Blindagem Institucional

**Projeto:** Indesconectável Payment Engine™ V1  
**Data:** 2026-07-01  
**Modo:** EXECUÇÃO CONTROLADA DOCUMENTAL  
**Pré-requisito:** PE.BRAND.1 (auditoria IP)  
**Baseline código:** `d188ca6` (inalterada — sem modificação de `.js` certificados)

---

## Veredito

# PASS

A formalização proprietária da Payment Engine™ foi institucionalizada com licença dedicada, política dual-license, declaração autoral, diretrizes de marca, README institucional e avisos de copyright — sem alterar a baseline certificada de código.

---

## Entregas

### Licença e escopo

| Artefato | Path |
|----------|------|
| Licença proprietária | `LICENSE-PAYMENT-ENGINE.md` |
| Escopo de paths | `docs/governance/PROPRIETARY-SCOPE.md` |
| Política dual-license | `docs/governance/COPYRIGHT-AND-LICENSE-POLICY.md` |

### Titularidade e marca

| Artefato | Path |
|----------|------|
| Declaração cessão (institucional) | `docs/governance/DECLARACAO-CESAO-AUTORAL-INSTITUCIONAL.md` |
| Diretrizes de marca | `docs/governance/BRAND-AND-TRADEMARK-GUIDELINES.md` |

### Identidade e documentação

| Artefato | Path |
|----------|------|
| README institucional (raiz) | `README-PAYMENT-ENGINE.md` |
| README canônico docs | `docs/payment-engine/README.md` |
| NOTICE copyright docs | `docs/payment-engine/NOTICE.md` |
| CHANGELOG com copyright | `CHANGELOG_PAYMENT_ENGINE.md` |

### Referência em código (sem alterar `.js`)

| Artefato | Path |
|----------|------|
| COPYRIGHT core | `src/finance/COPYRIGHT` |
| COPYRIGHT fachada | `src/payment-engine/COPYRIGHT` |

### Índices atualizados

| Artefato | Alteração |
|----------|-----------|
| `docs/governance/README.md` | Links PE.BRAND.2 |
| `docs/governance/BASELINE-PROTECTION-POLICY.md` | Ref. IP |
| `docs/data-room/INDICE-DUE-DILIGENCE.md` | Governança + patrimônio |

---

## O que foi resolvido (PE.BRAND.1)

| Gap BRAND.1 | Status BRAND.2 |
|-------------|:--------------:|
| Sem LICENSE proprietária | ✅ `LICENSE-PAYMENT-ENGINE.md` |
| MIT ambíguo no monorepo | ✅ Política dual-license documentada |
| Autoria sem declaração formal | ✅ Declaração institucional |
| README só Gol de Ouro | ✅ `README-PAYMENT-ENGINE.md` |
| Sem brand guidelines | ✅ `BRAND-AND-TRADEMARK-GUIDELINES.md` |
| Copyright ausente em docs | ✅ NOTICE + CHANGELOG |
| Copyright ausente em código | ✅ Arquivos COPYRIGHT (referência) |

---

## O que permanece pendente (PE.BRAND.3+)

| Item | Fase sugerida |
|------|---------------|
| Registro INPI Indesconectável™ | PE.BRAND.3 |
| Registro INPI Payment Engine™ | PE.BRAND.3 |
| Contrato cessão cartorial | Jurídico externo |
| Atualizar `package.json` license | PE.BRAND.3 ou split repo |
| Cabeçalhos copyright em cada `.js` | Gate PE.V1.x (evita diff massivo na baseline) |
| LICENSE comercial tipo para clientes | PE.BRAND.4 |
| Logotipo dedicado | PE.BRAND.3+ |

---

## Validação de baseline

| Verificação | Resultado |
|-------------|:---------:|
| Arquivos `.js` em `src/finance/` alterados? | ❌ Não |
| Lógica da Engine modificada? | ❌ Não |
| Tags/commits alterados? | ❌ Não |
| Apenas docs + COPYRIGHT referência | ✅ Sim |

---

## Matriz pós-BRAND.2

| Item | Antes (BRAND.1) | Depois (BRAND.2) |
|------|-----------------|------------------|
| Licenciamento | Viável com ressalvas | **Formalizado** |
| Titularidade documental | Institucional | **Declarada** |
| Identidade README | Parcial | **Entrada dedicada** |
| Registro marca | Pendente | Pendente |
| Due diligence IP | Boa | **Alta** |

---

## Próximo tijolo

### PE.BRAND.3 — Registro de Marca (INPI)

Preparar classes 42/9/36, busca de anterioridade, pedido Indesconectável™ e Indesconectável Payment Engine™ — **fora do repositório**, com assessoria jurídica.

---

## Critérios de sucesso

| Critério | Status |
|----------|:------:|
| Licença proprietária publicada | ✅ |
| Escopo paths definido | ✅ |
| Declaração autoral institucional | ✅ |
| Brand guidelines | ✅ |
| README institucional PE | ✅ |
| Baseline código preservada | ✅ |
| Índice DD atualizado | ✅ |

---

*Execução concluída em 2026-07-01 — PE.BRAND.2*
