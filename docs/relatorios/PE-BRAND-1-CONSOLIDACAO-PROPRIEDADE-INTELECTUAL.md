# PE.BRAND.1 — Consolidação da Identidade e Proteção da Propriedade Intelectual

**Projeto:** Indesconectável Payment Engine™ V1  
**Produto de referência:** Gol de Ouro™ V1 (cliente âncora)  
**Data:** 2026-07-01  
**Modo:** READ-ONLY ABSOLUTO  
**Baseline:** `payment-engine-v1-certified` (`eab1d74`) · `payment-engine-p2.2` (`d188ca6`) · HEAD `7997603`  
**Documentos base:** `docs/payment-engine/01–12`, `06-Posicionamento`, PE.VALOR-1/2, PE.PATRIMÔNIO.1–3, PE.BACKUP.1, DR-02–DR-11, `BASELINE-PROTECTION-POLICY.md`

---

## Veredito executivo

# PASS COM RESSALVAS

A **Indesconectável Payment Engine™** possui **identidade institucional consolidada** na documentação patrimonial, **autoria técnica rastreável** e **substância suficiente** para ser tratada como ativo tecnológico proprietário do ecossistema **Indesconectável™**. A proteção jurídica formal (marca INPI, copyright unificado, licença comercial, cessão documentada) permanece **incompleta** e constitui ressalva institucional — não invalida o patrimônio técnico.

---

# ETAPA 1 — Identidade do Ativo

## Nome oficial auditado

**Indesconectável Payment Engine™** (abrev.: **IPE™**, **Payment Engine™**)

## Consistência por canal

| Canal | Nome usado | Consistente? |
|-------|------------|:------------:|
| `CHANGELOG_PAYMENT_ENGINE.md` | Indesconectável Payment Engine™ | ✅ |
| `docs/payment-engine/01–12` | Indesconectável Payment Engine™ | ✅ |
| `docs/payment-engine/06-Posicionamento.md` | Identidade formal + família Indesconectável™ | ✅ |
| `docs/payment-engine/08-Version-Manifest.md` | Indesconectável Payment Engine™ | ✅ |
| Relatórios PE.*, P1.*, P2.* | Indesconectável Payment Engine™ | ✅ |
| Release GitHub | "Indesconectavel" (sem acento) | ⚠️ ASCII |
| `README.md` raiz | Gol de Ouro — Fred Silva | ❌ legado |
| `package.json` | goldeouro-backend / Gol de Ouro Team | ❌ legado |
| DR-06 (2026-06-23) | Foco Gol de Ouro™ | ⚠️ pré-productização |

## Respostas

| Pergunta | Resposta |
|----------|----------|
| Existe padronização? | **SIM** no núcleo patrimonial (`docs/payment-engine/`, PE.*, CHANGELOG_PE, governança) |
| Variações conflitantes? | **SIM, pontuais** — README/package raiz ainda refletem Gol de Ouro; releases sem acento |
| Identidade consolidada? | **SIM** para fins institucionais e comerciais da Engine; **NÃO** no monorepo inteiro |

---

# ETAPA 2 — Autoria

## Evidências levantadas

| Papel | Evidência |
|-------|-----------|
| **Desenvolvimento** | Commits PE (`eab1d74..HEAD`): **Fred S. Silva** `<indesconectavel@gmail.com>` |
| **Documentação** | 12 docs canônicos, 69+ relatórios P1.x, PE.PATRIMÔNIO, PE.VALOR — mesmo autor Git |
| **Arquitetura** | P2.0A productização, P2.2 desacoplamento, Architecture Signature 10 — documentados |
| **Certificação** | P1.9 PASS, runner `p19-certification.cjs`, evidências Fly v536 |
| **Manutenção** | Branch `chore/f2-4e-2-mp-log`, política `BASELINE-PROTECTION-POLICY.md` |

## Ambiguidades

| Item | Risco |
|------|-------|
| `README.md`: "Desenvolvido por: Fred Silva" | Não menciona Indesconectável™ nem cessão |
| `package.json`: `"author": "Gol de Ouro Team"` | Conflito nominal com linha Indesconectável™ |
| Ausência de contratos de cessão no repo | Risco jurídico em transação — não técnico |
| DR-09 cita ambiguidade autoral | Documentado |

## Respostas

| Pergunta | Resposta |
|----------|----------|
| Autoria claramente documentada? | **PARCIAL** — Git + docs PE sim; artefatos raiz legados não |
| Risco de ambiguidade? | **MÉDIO** — resolvível com PE.BRAND.2 (copyright + cessão) |
| Conflito de autoria? | **NÃO técnico**; **SIM formal** entre Gol de Ouro Team vs Indesconectável™ |

---

# ETAPA 3 — Titularidade

## Parecer institucional

| Entidade | Relação com a Engine |
|----------|---------------------|
| **Gol de Ouro™** | **Cliente de referência / origem operacional** — primeira implantação em produção |
| **Indesconectável™** | **Titular institucional** — linha de produto, marca-mãe, patrimônio declarado |
| **Terceiros** | PSPs, cloud, OSS — fornecedores, não titulares do motor |
| **Compartilhada?** | **NÃO** como produto; **SIM** como monorepo histórico (jogo + engine) |

### Evidências de titularidade Indesconectável™

- `BASELINE-PROTECTION-POLICY.md` §8: *"A baseline V1 é patrimônio da Indesconectável™"*
- `06-Posicionamento.md`: família de produtos Indesconectável™
- P2.0A/P2.0B: separação conceitual Engine × Gol de Ouro
- PE.VALOR-1/2: posicionamento como infraestrutura B2B da Indesconectável™
- Tags `ipe-v1-certified`, `payment-engine-v1-certified`

### Contradições

- DR-06 conclui patrimônio sob ótica **Gol de Ouro™** (jun/2026, pré-P2.0A pleno)
- `package.json` MIT sem LICENSE — titular do copyright não formalizado
- Nenhum contrato no repositório contradiz explicitamente Indesconectável™ — **lacuna**, não conflito escrito

**Parecer:** A Engine **pertence institucionalmente à Indesconectável™** como produto; o **repositório** ainda mistura IP do Gol de Ouro™. Para transações, exigir instrumento jurídico de separação e cessão.

---

# ETAPA 4 — Originalidade

## Auditoria técnica

| Componente | Originalidade | Evidência |
|------------|:-------------:|-----------|
| Arquitetura dual-layer wallet+ledger | Alta (integração) | P1.9, RPCs, `ledger_financeiro` |
| FinanceProviderFactory + contratos | Média-alta | Padrão industry + guards proprietários |
| Recovery sem webhook | **Alta** | P1.8/P1.9 comprovado — diferencial |
| Webhook normalization multi-PSP | Alta | MP + Asaas PAYMENT/TRANSFER |
| Payment Facade (P2.2) | Alta | `src/payment-engine/` — 26 arquivos |
| Governança freeze/tags/manifests | Alta | P2.0B, PE.PATRIMÔNIO |
| Metodologia certificação F4/P1 | **Muito alta** | Corpus forense |
| Documentação 12 canônicos + data room | **Muito alta** | DR-02–11 |

## O que não é original isolado

- Factory/Adapter pattern — padrão de mercado
- Express, Node, Supabase client — OSS
- Protocolo PIX — infraestrutura BACEN
- APIs Mercado Pago, Asaas — terceiros

## Classificação global

# ORIGINALIDADE: ALTA (integrada)

A originalidade reside na **combinação certificada em produção**: recovery automático, idempotência estrutural, factory sem fallback silencioso, metodologia executável de homologação e documentação forense — não em um algoritmo patenteável isolado.

---

# ETAPA 5 — Componentes Proprietários

| Componente | Classificação IP | Nível defensável |
|------------|------------------|:----------------:|
| Indesconectável Payment Engine™ (conjunto) | Produto software + know-how | Alto |
| Provider Factory | Implementação proprietária | Alto |
| Finance Contracts | Interface + semântica proprietária | Médio-alto |
| Payment Facade (`PaymentEngine.js`) | Software proprietário P2.2 | Alto |
| Recovery Engine | Diferencial comprovado | **Muito alto** |
| Webhook Engine | Orquestração proprietária | Alto |
| Governança (freeze, tags, policies) | Framework institucional | Médio-alto |
| Roadmap V1→V2.1 | Estratégia documentada | Médio |
| Data Room DR-02–11 | Pacote DD | Alto |
| Runbooks (20+) | Processo operacional | Médio |
| Certificação (`p19`, F4/P1) | Metodologia executável | **Muito alto** |
| Documentação 12 canônicos | Know-how | **Muito alto** |
| Arquitetura (Signature 10, ADR-002) | Design proprietário | Alto |
| Scripts verify/certification | Ferramental read-only | Médio |
| PE-VALOR-1/2 | Valoração e posicionamento | Médio (estratégico) |
| Relatórios P1.x / PE.* | Evidência forense | Alto |
| Manifestos / Policies | Institucional | Médio-alto |

---

# ETAPA 6 — Dependências

| Dependência | Tipo | Classificação |
|-------------|------|---------------|
| Express, axios, jwt, bcrypt | OSS MIT/BSD | Substituível |
| @supabase/supabase-js | SDK BaaS | Substituível (PostgreSQL portable) |
| Mercado Pago API | PSP | **Substituível** via factory |
| Asaas API | PSP | **Substituível** via factory |
| Celcoin (stub) | PSP prep | Opcional |
| Fly.io | PaaS hosting | Substituível (Docker existe) |
| Supabase | DB hosting | Substituível (SQL versionado) |
| GitHub | Git/CI | Substituível |
| Node.js runtime | Plataforma | Substituível |

## Resposta central

A Engine **utiliza** APIs e infraestrutura de terceiros; **não depende estruturalmente** de um único PSP ou cloud para existir como design. A **operação em produção** depende hoje de Asaas+MP+Fly+Supabase — dependência **operacional**, não de titularidade do código.

---

# ETAPA 7 — Naming

| Marca / nome | Uso | Status |
|--------------|-----|--------|
| **Indesconectável™** | Marca-mãe ecossistema | Documentado; INPI pendente |
| **Payment Engine™** | Nome curto produto | Documentado; genérico isolado |
| **Indesconectável Payment Engine™** | Nome completo oficial | Consolidado em docs PE |
| **IPE™** | Abreviação institucional | `ipe-v1-certified` tag |

### Conflitos / riscos

- "Payment Engine" isolado — **genérico**, baixa protegibilidade sem qualificador
- Variação ASCII "Indesconectavel" em releases — padronizar em materiais oficiais
- Gol de Ouro™ no README — risco de confusão produto vs cliente âncora
- ™ usado documentalmente — **não substitui** registro INPI

---

# ETAPA 8 — Documentação

| Finalidade | Sufficiência | Nota |
|------------|:------------:|------|
| Due diligence | **Excelente** | Data room, P1.x, índice DD, backup |
| Licenciamento | **Boa** | Gap: LICENSE comercial formal |
| Venda / M&A | **Boa-alta** | PE.VALOR + DR-09/10 |
| Implantação | **Boa** | Runbooks, verify scripts, arquitetura |
| Treinamento | **Média** | Falta material didático comercial |
| Auditoria | **Excelente** | Certificação P1.9, scripts read-only |
| Sucessão técnica | **Alta** | Manifest, freeze, backup PE.BACKUP.1 |

**Classificação documental:** **ALTA** — acima do mercado para startup/scale-up equivalente.

---

# ETAPA 9 — Valoração Intangível

Síntese de PE.VALOR-1 (não constitui laudo formal):

| Fator | Avaliação |
|-------|-----------|
| Tempo investido | 10–16 meses equivalentes de engenharia fintech |
| Complexidade | Alta — PIX IN/OUT, recovery, multi-PSP, ledger |
| Certificações | P1.9 PASS — prova produção |
| Governança | Freeze, tags, backup, política baseline |
| Documentação | Excepcional para DD |
| Reutilização | 92% core (P2.0A) |
| Barreira de entrada | Alta — metodologia + homologação PSP |
| Risco reprodução | Médio-baixo no curto prazo |
| Vantagem competitiva | Recovery comprovado + corpus forense |

**Parecer:** Valor patrimonial **substancial** (faixa PE.VALOR-1: R$ 900k–1,8M provável). Intangível **defensável** em licenciamento e M&A com ressalvas jurídicas.

---

# ETAPA 10 — Registro de Marca (recomendação — sem protocolar)

| Marca | Prioridade | Classe sugerida | Momento |
|-------|:----------:|-----------------|---------|
| **Indesconectável™** | **P0** | 42 (software), 36 (fintech serviços) | Antes de licenciamento em escala |
| **Indesconectável Payment Engine™** | **P1** | 42, 9 | Após P0 ou em conjunto |
| **Payment Engine™** isolado | P3 | — | Baixa protegibilidade — genérico |
| Logotipo | P2 | 42 | Após identidade visual final |

**Riscos sem registro:** terceiros, confusão com "payment engine" genérico, limitação em contratos B2B.

---

# ETAPA 11 — Direitos Autorais

| Artefato | Autoria evidenciada? | Copyright formal? |
|----------|:--------------------:|:-----------------:|
| Código PE | ✅ Git | ⚠️ MIT declarado, sem LICENSE |
| Documentação PE | ✅ Autor nos commits | ⚠️ Sem notice padrão |
| Relatórios | ✅ Trilha Git | ⚠️ Sem cabeçalho copyright |
| Data Room | ✅ | ⚠️ Idem |

**Recomendação (PE.BRAND.2):** Inserir notice padrão:

```text
© 2026 Indesconectável™. Todos os direitos reservados.
Indesconectável Payment Engine™ é marca do ecossistema Indesconectável™.
```

Locais: `docs/payment-engine/*`, `CHANGELOG_PAYMENT_ENGINE.md`, cabeçalho `src/finance/`, `src/payment-engine/`, LICENSE proprietária ou dual-license.

---

# ETAPA 12 — Licenciamento

| Modelo | Adequação V1 | Nota |
|--------|:------------:|------|
| Uso interno / embed | **Alta** | Estado atual |
| Licença comercial perpétua | **Alta** | PE.VALOR-2 |
| OEM / white-label | **Média-alta** | Requer adapters + contrato |
| SaaS / API | **Média** | Roadmap V2.0 |
| SDK npm | **Média** | Roadmap V2.1 |

**Modelo recomendado:** **Licença comercial enterprise + implantação** (setup fee + manutenção), evoluindo para **SaaS API** em V2. **Bloqueador:** resolver conflito MIT em `package.json` antes de escala.

---

# ETAPA 13 — Posicionamento

## Nomenclatura de maior valor

**Payment Infrastructure** / **PIX Orchestration Platform** / **Resilient Payment Engine for Digital Platforms**

Não apresentar como: módulo do Gol de Ouro, gateway genérico, PSP, banco.

## Categoria oficial (PE.VALOR-2)

> *A camada entre seu produto e os PSPs — infraestrutura PIX que não para.*

---

# ETAPA 14 — Riscos

| Risco | Severidade | Mitigação sugerida |
|-------|:----------:|-------------------|
| Jurídico (cessão/titularidade) | Alta | Contrato cessão + LICENSE comercial |
| Autoral (MIT sem LICENSE) | Alta | PE.BRAND.2 — licença proprietária Engine |
| Marca (sem INPI) | Média-alta | PE.BRAND.3 — registro |
| Naming (README legado) | Média | README produto separado ou seção PE |
| Contratual (ausência) | Alta | NDA + MSA licenciamento |
| Licenciamento prematuro | Média | Resolver IP antes de escala |
| Dependência PSP operacional | Média | Já mitigado arquiteturalmente |
| Regulatório (PIX/fintech) | Média | Posicionar como orquestração, não instituição |

---

# ETAPA 15 — Roadmap de Proteção

| Fase | Escopo | Entregável |
|------|--------|------------|
| **PE.BRAND.2** | Copyright + licença | LICENSE proprietária Engine, notices, cessão autoral documentada, README institucional |
| **PE.BRAND.3** | Marca INPI | Pedido Indesconectável™ + Indesconectável Payment Engine™ |
| **PE.BRAND.4** | Comercialização IP | Contrato licença tipo, one page, FAQ jurídico, política de uso de marca |
| **PE.BRAND.5** (opcional) | Registro software | Análise INPI programa registro / vault hash |

---

# RESPOSTAS OBRIGATÓRIAS

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Identidade própria? | **SIM** — consolidada na documentação patrimonial |
| 2 | Ativo tecnológico independente? | **SIM** — conceitual e arquiteturalmente (P2.0A/P2.2) |
| 3 | Pertence à Indesconectável™? | **SIM** institucionalmente; formalizar juridicamente |
| 4 | Evidência de autoria? | **SIM** técnica (Git); **PARCIAL** legal |
| 5 | Originalidade técnica? | **SIM — ALTA** (integrada) |
| 6 | Originalidade documental? | **SIM — MUITO ALTA** |
| 7 | Valor patrimonial? | **SIM** — substancial (PE.VALOR-1) |
| 8 | Registrar marca? | **SIM — recomendado** (P0 Indesconectável™) |
| 9 | Registrar software futuramente? | **SIM — avaliar** após BRAND.2/3 |
| 10 | Já pode ser licenciada? | **SIM com ressalvas** — piloto/contrato; não escala sem LICENSE |
| 11 | Já pode ser vendida? | **SIM em M&A/asset deal** — com due diligence jurídica |
| 12 | Apresentar a investidores? | **SIM** — data room pronto |
| 13 | Apresentar a clientes? | **SIM** — narrativa PE.VALOR-2; materiais P0 pendentes |
| 14 | Maturidade institucional? | **ALTA** técnica/documental · **MÉDIA** jurídica/comercial |

---

# MATRIZ FINAL

| Item | Resultado |
|------|-----------|
| Identidade | **CONSOLIDADA** (docs PE) · ressalva README/package legado |
| Autoria | **DOCUMENTADA** (Git) · ressalva formal cessão |
| Titularidade | **Indesconectável™** (institucional) · instrumentar juridicamente |
| Originalidade | **ALTA** |
| Propriedade Intelectual | **PARCIAL FORTE** |
| Documentação | **ALTA** |
| Governança | **ALTA** |
| Licenciamento | **VIÁVEL COM RESSALVAS** |
| Comercialização | **PRONTA NARRATIVA** · materiais P0 pendentes |
| Registro de Marca | **RECOMENDADO — PENDENTE** |
| Registro de Software | **AVALIAR — PENDENTE** |
| Due Diligence | **PRONTA** |

---

# CERTIFICAÇÃO INSTITUCIONAL PE.BRAND.1

Com base em evidências documentais e arquiteturais auditadas em modo read-only, **certifica-se** que:

1. A **Indesconectável Payment Engine™ V1** possui identidade própria reconhecível no ecossistema **Indesconectável™**.
2. Sua autoria técnica é rastreável e sua titularidade institucional está estabelecida na governança patrimonial.
3. Existe originalidade suficiente (integrada) para caracterizá-la como propriedade intelectual de valor.
4. Pode ser apresentada como ativo tecnológico independente do Gol de Ouro™ (cliente âncora).
5. O roadmap PE.BRAND.2→4 define proteção jurídica e comercial complementar necessária.

**Veredito:** **PASS COM RESSALVAS**

---

*Auditoria read-only — nenhuma alteração executada em código, Git, documentação preexistente, INPI ou contratos.*

*Relatório gerado em PE.BRAND.1 — 2026-07-01.*
