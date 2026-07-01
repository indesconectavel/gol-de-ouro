# Política de Copyright e Licenciamento — Monorepo Gol de Ouro / Payment Engine™

**Fase:** PE.BRAND.2  
**Data:** 2026-07-01  
**Modo:** Documento institucional — não substitui assessoria jurídica

---

## 1. Contexto

O repositório `goldeouro-backend` é um **monorepo histórico** que contém:

1. **Gol de Ouro™** — aplicação de jogo e premiações (legado)
2. **Indesconectável Payment Engine™** — motor financeiro PIX certificado (produto Indesconectável™)

A partir de PE.BRAND.2, aplica-se política **dual-license** por escopo de paths.

---

## 2. Dual-license

| Escopo | Licença | Arquivo de referência |
|--------|---------|----------------------|
| **Componentes Payment Engine™** | **Proprietária** | `LICENSE-PAYMENT-ENGINE.md` |
| **Demais paths do monorepo** | Legado — campo `MIT` em `package.json` até revisão jurídica formal | `package.json` |

Em caso de conflito interpretativo sobre paths listados em `PROPRIETARY-SCOPE.md`, **prevalece a licença proprietária da Payment Engine™**.

---

## 3. Aviso de copyright padrão

### Documentação Payment Engine™

```text
© 2026 Indesconectável™. Todos os direitos reservados.
Indesconectável Payment Engine™ é marca do ecossistema Indesconectável™.
```

Arquivo central: `docs/payment-engine/NOTICE.md`

### Código Payment Engine™

Referência de cabeçalho (não inserido em cada arquivo da baseline V1 — ver §5):

```text
/**
 * Indesconectável Payment Engine™ V1
 * © 2026 Indesconectável™. Todos os direitos reservados.
 * LICENSE-PAYMENT-ENGINE.md
 */
```

Arquivos de referência:

- `src/finance/COPYRIGHT`
- `src/payment-engine/COPYRIGHT`

---

## 4. package.json

O campo `"license": "MIT"` na raiz reflete o **histórico do monorepo Gol de Ouro™**. Não concede direitos sobre os Componentes proprietários da Payment Engine™ listados em `PROPRIETARY-SCOPE.md`.

Revisão futura (PE.BRAND.3+): considerar `"license": "UNLICENSED"` na raiz ou split de repositório / workspace npm `@indesconectavel/payment-engine`.

---

## 5. Baseline V1 e alterações em código

A baseline certificada `d188ca6` permanece protegida por `BASELINE-PROTECTION-POLICY.md`.

PE.BRAND.2 **não altera** arquivos `.js` da baseline — apenas adiciona arquivos `COPYRIGHT` de referência nos diretórios `src/finance/` e `src/payment-engine/`. Cabeçalhos per-file em massa ficam para gate PE.V1.x ou novo commit baseline documental.

---

## 6. Terceiros e OSS

Dependências npm (Express, Supabase client, etc.) permanecem sob suas licenças OSS. Obrigação de manter `NOTICES` de terceiros — recomendado em PE.BRAND.3.

---

## 7. Checklist de conformidade

| Item | Status PE.BRAND.2 |
|------|:-----------------:|
| LICENSE proprietária PE | ✅ |
| Escopo PROPRIETARY-SCOPE | ✅ |
| Declaração cessão institucional | ✅ |
| Brand guidelines | ✅ |
| README institucional PE | ✅ |
| NOTICE documentação | ✅ |
| COPYRIGHT referência em src/ | ✅ |
| Registro INPI | ⏳ PE.BRAND.3 |
| Contrato cessão cartorial | ⏳ Jurídico externo |
| Atualizar package.json license | ⏳ Opcional |

---

*Política estabelecida em PE.BRAND.2 — 2026-07-01*
