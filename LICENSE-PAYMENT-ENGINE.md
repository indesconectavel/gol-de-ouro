# Licença Proprietária — Indesconectável Payment Engine™ V1

**Produto:** Indesconectável Payment Engine™ (IPE™)  
**Titular:** Indesconectável™  
**Versão da licença:** 1.0  
**Data de vigência:** 2026-07-01  
**Fase:** PE.BRAND.2

---

## 1. Partes e escopo

Esta licença aplica-se exclusivamente aos **Componentes da Payment Engine™** listados em `docs/governance/PROPRIETARY-SCOPE.md`, incluindo — sem limitação — código em `src/finance/`, `src/payment-engine/`, documentação canônica em `docs/payment-engine/`, scripts de certificação designados e artefatos patrimoniais PE publicados sob a marca Indesconectável Payment Engine™.

O restante do monorepo `goldeouro-backend` (Gol de Ouro™ — jogo, player, admin, legado) pode permanecer sob termos distintos documentados em `docs/governance/COPYRIGHT-AND-LICENSE-POLICY.md`.

---

## 2. Titularidade

© 2026 **Indesconectável™**. Todos os direitos reservados.

**Indesconectável™**, **Indesconectável Payment Engine™**, **Payment Engine™** e **IPE™** são marcas do ecossistema Indesconectável™. Uso sujeito a `docs/governance/BRAND-AND-TRADEMARK-GUIDELINES.md`.

O titular dos direitos patrimoniais sobre os Componentes da Payment Engine™ é a **Indesconectável™**, conforme declaração institucional em `docs/governance/DECLARACAO-CESAO-AUTORAL-INSTITUCIONAL.md`.

---

## 3. Concessão de direitos

Salvo acordo escrito em contrato comercial separado, **nenhum direito** é concedido para:

- copiar, modificar ou distribuir os Componentes da Payment Engine™;
- sublicenciar, revender ou oferecer como serviço a terceiros;
- remover avisos de copyright ou marca;
- fazer engenharia reversa para criar produto concorrente derivado dos Componentes.

### Uso interno autorizado (sem contrato adicional)

É permitido ao titular e às entidades do grupo Indesconectável™:

- executar os Componentes em ambientes controlados;
- manter backups patrimoniais (PE.BACKUP.1);
- realizar auditorias read-only e certificação (P1.9, scripts verify);
- evoluir a Engine mediante gates documentados (PE.V1.x+).

### Uso pelo cliente de referência

**Gol de Ouro™ V1** possui licença de **uso operacional** dos Componentes enquanto cliente âncora certificado, sem transferência de titularidade.

---

## 4. Licenciamento comercial

Licenças comerciais (embed, OEM, white-label, perpétua, SaaS) são concedidas **somente** mediante contrato escrito assinado pelo titular. Modelos de referência: PE.VALOR-2.

Contato institucional para licenciamento: documentar em contrato comercial — não constitui oferta vinculante neste arquivo.

---

## 5. Garantias e limitação

Os Componentes são fornecidos **"como estão"**, no estado certificado V1. O titular não garante adequação a finalidade específica além do escopo documentado em P1.9 e manifestos oficiais.

Em nenhuma hipótese o titular será responsável por danos indiretos decorrentes de uso não autorizado ou modificação fora dos gates de governança.

---

## 6. Baseline certificada

A versão **V1 CERTIFICADA** referencia:

| Marco | Tag / commit |
|-------|----------------|
| Documental | `payment-engine-v1-certified` → `eab1d74` |
| Código P2.2 | `payment-engine-p2.2` → `d188ca6` |

Alterações aos Componentes em produção devem respeitar `docs/governance/BASELINE-PROTECTION-POLICY.md`.

---

## 7. Disposições gerais

- Esta licença não substitui assessoria jurídica, registro de marca (INPI) ou contratos de cessão formalizados em cartório.
- Conflito com campo `"license": "MIT"` em `package.json` do monorepo: **esta licença prevalece** para os Componentes listados em PROPRIETARY-SCOPE.
- Foro e lei aplicável: definir em contrato comercial; documento institucional preparatório à due diligence.

---

*Indesconectável Payment Engine™ V1 CERTIFICADA — PE.BRAND.2*
