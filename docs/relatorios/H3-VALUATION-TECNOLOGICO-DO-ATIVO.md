# H3 — Valuation Tecnológico do Ativo™

**Projeto:** Gol de Ouro™ V1  
**Ativo Principal:** Indesconectável Payment Engine™  
**Gate:** H3  
**Data:** 2026-07-08  
**Modo:** VALUATION DOCUMENTAL — READ-ONLY ABSOLUTO  
**Base:** H0 · H1 · H2 · H2A · H2.5 · P1.9 · G2 · DR-01 · DR-09 · DR-10 · PE-VALOR-1 · PE-VALOR-2  
**Snapshot:** `docs/relatorios/snapshots/h3-technology-valuation.json`

---

## Declarações limitadoras (obrigatórias)

1. Este documento **não** constitui laudo pericial, oferta vinculante, valuation IFRS/CPA nem preço de listagem.  
2. **Não** há MRR/ARR/EBITDA auditáveis no repositório — ausência registrada.  
3. Faixas em BRL são **indicativas**, ancoradas em evidências de esforço, substituição e opcionalidade já documentadas (H4.1, PE.VALOR.1).  
4. Nenhuma mutação de código, docs pré-existentes, Git, deploy, Fly, Supabase, Vercel, secrets, workflows, banco ou runtime.  
5. Comprador **não garantido**. Mercado **não comprovado** por transações fechadas no repo.

---

## Veredito do gate

# **PASS COM RESSALVAS**

Valuation tecnológico **defensável e coerente** com as evidências H0–H2.5 / P1.9 / G2 / PE-VALOR, **condicionado** a: ausência de receita auditável; IPE ainda embutida; packaging comercial incompleto; A2R/Git pendentes; IP registral não comprovado.

---

# ETAPA 1 — Objeto de Valuation

| Objeto | Definição | Evidência |
|--------|-----------|-----------|
| **A — Gol de Ouro™ V1** | Produto completo em produção (player, admin, gameplay, backend, economia PIX) | V1.FINAL 88/100 · H0 · DR-01 |
| **B — Indesconectável Payment Engine™** | Núcleo financeiro reutilizável (factory, webhooks, recovery, gates, facade P2.2) | P1.9 PASS · F4.Z · PE-VALOR · H0/H1 |
| **C — Asset Package™** | Inventário empacotado A–D + Data Room sincronizado | H1 · H2.5 · DR-01–11 |
| **D — Capital intelectual** | Metodologias de gate/freeze/certificação, ADRs, know-how PIX, runbooks | H0 §8 · PE.PATRIMÔNIO · governança |

**Nota anti-dupla contagem:** B ⊂ A no monorepo atual. Valuation **separado** para B usa lente de extração/licença; valuation **conjunto** A+C+D não soma B integralmente outra vez.

---

# ETAPA 2 — Métodos de Valuation

## 2.1 Custo de reconstrução

| Base | Evidência | Faixa |
|------|-----------|-------|
| Horas GDO V1 (até H4.0) | H4.1: **~1.500–2.200 h** | — |
| Taxa implícita seniores fintech BR (proxy documental) | H4.1 / prática PE.VALOR | R$ 150–350/h fully loaded (proxy) |
| **Rebuild produto A (ordem de grandeza)** | 1.500×150 a 2.200×250 | **≈ R$ 225k – R$ 550k** (só engenharia direta) |
| Premium docs/certs/gov (camada C/D) | Corpus excepcional H0 nota docs 9.2; Data Room ~8.7 pós-H2.5 | **+R$ 100k – R$ 250k** evitados de DD/tempo |
| **IPE B — custo substituição** | PE.VALOR.1 explícito | **R$ 750k – R$ 1,2M** |
| Aprendizado / falhas evitadas (webhook, double-credit, recovery) | P1.9 GOLD · V1.1* | Alto (qualitativo) |

**Síntese reconstrução:** reconstruir **apenas o jogo+wallet básico** é mais barato que a faixa GDO; reconstruir **IPE nível P1.9** aproxima-se do teto PE.VALOR técnico. O pacote real (A com B embutido + C/D) situa-se **acima** do rebuild “MVP jogo” e **abaixo** da soma ingênua GDO+IPE.

## 2.2 Valor estratégico

| Fator | Impacto |
|-------|---------|
| Multi-PSP + Recovery sem webhook | Barreira de entrada alta vs integrações PSP diretas |
| Produção real + certificação | Reduz risco de due diligence técnica |
| Reutilização núcleo (~92% core P2.0A) | Opcionalidade multi-produto (PE.VALOR.2) |
| Ainda monólito / sem 2º cliente | Limita preço estratégico imediato |

## 2.3 Valor de mercado potencial

| Canal | Maturidade |
|-------|------------|
| Aquisição do produto GDO | Possível (comprador entende SaaS/jogo+PIX) |
| Licenciamento IPE | Narrativa pronta (PE.VALOR.2); monetização **não** iniciada |
| White Label / SaaS | Roadmap D/E prematuro (H2A) |
| Segundo cliente | **Ausente** nas evidências |

## 2.4 Valor documental

| Item | Nota |
|------|------|
| Data Room pós-H2.5 | Índice ~**8,7** (H2.5) |
| Certs encadeadas | V1.FINAL · P1.9 · G2 · H0–H2.5 |
| DD readiness | SIM COM RESSALVAS (H1/H2/H2.5) |
| Contribuição ao preço | Material — comprador paga menos risco assimétrico |

## 2.5 Valor de opção (futuro)

B→C (pacote) → API/SDK → SaaS/WL (E). Valor de opção **real mas condicionado** a execução; não capitalizar integralmente no preço atual.

---

# ETAPA 3 — Fatores de Valorização

| Fator | Impacto (1–5) | Base |
|-------|:-------------:|------|
| Produção real | **5** | Domínios + Fly |
| PE certificada P1.9 + Recovery GOLD | **5** | P1.9 |
| Multi-PSP / factory | **4** | F4.Z · ADR-002 |
| Documentação corporativa | **5** | H0 docs 9.2 |
| Data Room ~8.7 + DR-01 | **4** | H2.5 |
| Asset Package constituído | **4** | H1 |
| Staging permanente G2 | **3** | G2 · H2A |
| Governança GOVERNED 88/100 | **4** | V1.FINAL |
| Know-how PIX / gates | **5** | Trilha P1 |
| Arquitetura reutilizável (núcleo) | **4** | A1.0 · H0 |

**Score valorização (média):** ≈ **4,3 / 5**

---

# ETAPA 4 — Fatores de Desconto

| Fator | Impacto desconto (1–5) | Base |
|-------|:---------------------:|------|
| IPE embutida no monólito | **5** | A1.0 · H0 · H2A |
| Produto standalone ausente | **4** | PE.VALOR.2 |
| A2R pendente | **3** | H2A |
| Staging SHA ≠ tip P2.2 | **2** | H2A |
| Stress / pen test ausentes | **4** | H0 |
| Dependência cloud/PSP contas | **4** | DR-09/10 |
| Transferibilidade credenciais | **4** | DR-09 |
| IP registral não comprovado | **3** | DR-06 · H1 |
| Git/merge/workflow residual | **3** | GIT.2 · H2A |
| Escala comercial não comprovada | **5** | Sem ARR |

**Score desconto (média):** ≈ **3,7 / 5** — descontos **materiais**, especialmente empacotamento + escala + transferibilidade.

---

# ETAPA 5 — Cenários de Valor

## Cenário 1 — Venda conservadora rápida

| Campo | Conteúdo |
|-------|----------|
| Descrição | Liquidez; comprador pouco sofisticado ou deadline |
| Comprador | Anjo / operador regional / agência |
| Vantagens | Fecha rápido; little diligence |
| Riscos | Deixa dinheiro na mesa; IP/contas mal transferidas |
| Faixa qualitativa | **Baixa / piso** |
| Defensabilidade | Média-baixa |
| **Faixa BRL (pacote A orientado)** | **R$ 180k – R$ 350k** |

## Cenário 2 — Venda técnica justa

| Campo | Conteúdo |
|-------|----------|
| Descrição | Comprador lê Data Room + P1.9 + H0/H1 |
| Comprador | Software house / fintech tech / strategic IT |
| Vantagens | Preço alinhado a rebuild + docs |
| Riscos | Negociação longa; preferência por earn-out |
| Faixa qualitativa | **Justa técnica** |
| Defensabilidade | **Alta** (melhor lastro evidenciário) |
| **Faixa BRL (A com B embutido + C)** | **R$ 400k – R$ 850k** |

## Cenário 3 — Licenciamento / parceria

| Campo | Conteúdo |
|-------|----------|
| Descrição | Mantém IP; cobra setup + royalty/retainer |
| Comprador | White label / plataforma jogos / fintech |
| Vantagens | Upside recorrente; prova 2º cliente |
| Riscos | Exige suporte; B ainda não empacotado |
| Faixa qualitativa | **Recorrência > ticket único** |
| Defensabilidade | Média (modelo pronto; execução não) |
| **Faixa BRL** | Setup **R$ 80k – R$ 250k** + recorrência **R$ 8k – R$ 40k/mês** *(ilustrativo; sem contratos no repo)* |

## Cenário 4 — Valuation estratégico (IPE como núcleo)

| Campo | Conteúdo |
|-------|----------|
| Descrição | Comprador valoriza orquestração PIX / M&A infra |
| Comprador | Fintech / PSP adjacent / corporate tech |
| Vantagens | Captura PE.VALOR estratégico |
| Riscos | Condicionado a extração B→C e narrativa 2º case |
| Faixa qualitativa | **Alto / condicionado** |
| Defensabilidade | Média (faixas PE.VALOR; mercado não fechado) |
| **Faixa BRL (ênfase B + opção)** | **R$ 900k – R$ 2,5M** *(somente se packaging/path claro; topo alinhado PE.VALOR com haircut)* |

---

# ETAPA 6 — Faixas de Valuation (síntese H3)

### Pacote negociável típico hoje: **A (GDO) contendo B + C + D**

| Faixa | BRL | Significado |
|-------|-----|-------------|
| **Valor mínimo defensável** | **R$ 250k – R$ 350k** | Piso ancorado H4.1 inferior + liquidez; ainda acima de “protótipo sem produção” |
| **Valor justo técnico** | **R$ 450k – R$ 800k** | Centro H4.1 atualizado pós-P1.9/H0–H2.5 (docs + Recovery elevam piso vs mai/2026) |
| **Valor estratégico** | **R$ 800k – R$ 1,5M** | Comprador vê IPE + produção + DD; ainda sem SaaS |
| **Valor máximo condicionado** | **R$ 1,5M – R$ 3,0M** | Exige path B→C, piloto externo ou tese M&A infra; **não** assertar como preço atual |

### Lente **B isolada** (IPE, se licensed/carved-out)

| Faixa | BRL | Fonte |
|-------|-----|-------|
| Mínimo econômico | **R$ 450k – R$ 650k** | PE.VALOR.1 |
| Técnico / provável | **R$ 750k – R$ 1,8M** | PE.VALOR.1 |
| Estratégico | **R$ 1,5M – R$ 3,5M** | PE.VALOR.1 — **condicionado** |

**Haircut H3 sobre tetos PE.VALOR:** aplicar **-15% a -35%** enquanto monólito + sem 2º cliente + A2R/Git residuais (alinha H0/H2A).

---

# ETAPA 7 — R$ 300.000

> R$ 300.000 é um valor defensável para este ativo no estado atual?

# **SIM COM RESSALVAS**

| Contexto | Veredito | Justificativa |
|----------|----------|---------------|
| **Venda rápida** | **SIM** | Dentro do Cenário 1; defensável como liquidez, não como “justo pleno” |
| **Venda técnica** | **SIM COM RESSALVAS** | No **chão** da banda justa (R$ 450–800k); vendedor deixa valor; comprador obtém barganha se DD limpa |
| **Venda estratégica** | **NÃO como preço justo** | Subavalia IPE+certs; só faz sentido fire-sale ou carve sem docs |
| **Licenciamento** | **SIM como setup** (parcela) | R$ 300k pode ser entrance fee alto de licença; não equivale a venda do pacote inteiro |

**Síntese:** R$ 300k **justifica-se** como **piso/liquidação** ou **entrada de licença**. **Não** deve ser apresentado como valuation estratégico do pacote completo pós-H2.5/P1.9.

---

# ETAPA 8 — Estrutura de Negociação

| Modelo | Vantagens | Riscos | Melhor uso | Evitar quando |
|--------|-----------|--------|------------|---------------|
| **Venda integral** | Simples; fecha | Perde upside IPE | Comprador quer produto+ops | Vendedor quer recorrência |
| **Venda parcial** | Flexível | Disputas de fronteira IP | Só front/jogo vs só IPE | Fronteira mal definida |
| **Licenciamento** | Mantém IP | Suporte contínuo | IPE B→C | Sem capacidade ops |
| **White Label** | Escala marca | Prematuro (E) | Após C + piloto | Agora (H2A) |
| **Parceria estratégica** | Prova 2º cliente | Ambiguidades | Co-build fintech | Só cash imediato |
| **Earn-out** | Alinha risco | Meta gaming | Há receita futura | Sem métricas |
| **Entrada + participação** | Upside + liquidity | Diluição/governança | Anjo tech | Controlo operacional frágil |
| **Retainer pós-venda** | Contagem de risco cutover | Dependência founder | Sempre em venda A | Comprador quer zero key-man |

---

# ETAPA 9 — Preparação para Mercado

### O ativo está pronto para ser ofertado?

# **SIM COM RESSALVAS** — oferta **técnica/estratégica soft** sim; **market package polido** ainda não.

### 5 ajustes que mais aumentam valor percebido (prioridade)

| # | Ajuste | Por quê |
|---|--------|---------|
| 1 | **One-pager + teaser executivo** (a partir do DR-01) | Compacta 8,7 Data Room para decisão |
| 2 | **Demo / vídeo** fluxo PIX IN → jogo → OUT/Recovery | Torna P1.9 tangível |
| 3 | **Concluir A2R** (staging Asaas resolvível) | Remove finding H2A visível |
| 4 | **Pitch IPE separado do jogo** (PE.VALOR.2) | Permite Cenário 3/4 |
| 5 | **Página institucional / kit licença** | Fecha gap “3 tijolos” PE.VALOR.2 |

DR-01 já existe (H2.5) — não é mais o gap nº1; **comercialização** e **A2R** passam à frente.

---

# ETAPA 10 — Matriz de Compradores

| Perfil | Aderência (1–5) | Nota |
|--------|:---------------:|------|
| Empresa de software | **4** | Quer rebuild avoidance |
| Fintech | **5** | Encaixa IPE |
| Casa de apostas legalizada | **3** | Produto+PIX; compliance aparte |
| Plataforma de jogos | **4** | GDO âncora + white label futuro |
| Agência tech | **3** | Compra capacidade delivery |
| Investidor-anjo | **3** | Quer equity story; falta ARR |
| Operador regional | **3** | Cenário 1 |
| Comprador estratégico | **4** | Cenário 4 se packaging |
| Parceiro White Label | **3** | Prematuro E; bom para piloto |

---

# ETAPA 11 — Veredito Executivo

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Existe valor tecnológico real? | **SIM** |
| 2 | Existe valor patrimonial real? | **SIM** (H1 COM RESSALVAS) |
| 3 | Existe valor de mercado imediato? | **SIM COM RESSALVAS** — negociável; liquidez não comprovada |
| 4 | Existe valor estratégico futuro? | **SIM** (opção B→E) |
| 5 | IPE vale mais dentro ou fora do GDO? | **Fora, no médio prazo** (licença/multi-produto); **dentro, no curto prazo** (prova + receita ops). Hoje o prêmio está **no núcleo**, mas a prova está **no produto**. |
| 6 | Vender GDO junto ou separado da IPE? | **Preferível: pacote integral agora** OU **licença IPE + keep/sell produto**; carve cold-turkey **sem** contratos de fronteira = risco Alto |
| 7 | O ativo pode justificar R$ 300 mil? | **SIM COM RESSALVAS** (piso/rápido; não teto justo) |
| 8 | Vender agora ou empacotar antes? | **Oferta soft agora + empacotar em paralelo** (A2R, one-pager, demo). Venda estratégica “cheia” **após** mini-packaging |

---

## VEREDITO FINAL

# **PASS COM RESSALVAS**

Há evidência suficiente para um **valuation tecnológico estruturado**. Não há evidência para um **preço de mercado fechado** nem para o teto estratégico sem condições.

```
══════════════════════════════════════════════════
  H3 — VALUATION TECNOLÓGICO
──────────────────────────────────────────────────
  Pacote A+C+D (com B embutido)
    Mínimo defensável …… R$ 250k – 350k
    Justo técnico ……… R$ 450k – 800k
    Estratégico ……… R$ 800k – 1,5M
    Máx. condicionado … R$ 1,5M – 3,0M

  IPE isolada (B) ……… ver PE.VALOR.1 com haircut

  R$ 300k …………… SIM COM RESSALVAS (piso)

  Próximo …………… H4 Investment Memorandum
══════════════════════════════════════════════════
```

---

## Fontes consultadas (obrigatórias)

| Fonte | Status |
|-------|--------|
| H0 | ✅ |
| H1 | ✅ |
| H2 | ✅ |
| H2A | ✅ |
| H2.5 | ✅ |
| P1.9 | ✅ (via cadeia H0/PE.VALOR) |
| G2 | ✅ (via H2A) |
| DR-01 | ✅ |
| DR-09 | ✅ (+ adenda H2.5) |
| DR-10 | ✅ (+ adenda) |
| PE-VALOR-1 | ✅ |
| PE-VALOR-2 | ✅ |
| Auxiliar H4.1 (esforço/faixa mai/2026) | ✅ usado como âncora GDO |

**Ausências materiais para valuation financeiro clássico:** receita auditável, pipeline de compradores, múltiplos de transações comparáveis fechadas — **Sem evidência suficiente** (registrado; não inventado).

---

## Assinatura

| Campo | Valor |
|-------|-------|
| Gate | H3 — Valuation Tecnológico do Ativo™ |
| Data | 2026-07-08 |
| Mutações técnicas | **Nenhuma** |
| Artefatos | Este MD + `snapshots/h3-technology-valuation.json` |
| Próxima fase | **H4 — Investment Memorandum** |

---

*H3 — 2026-07-08 — Valuation documental ancorado em evidências; não é oferta nem laudo.*
