# ÍNDICE MESTRE — DOCUMENTAÇÃO GOL DE OURO V1

**Objetivo:** inventário oficial navegável da documentação do projeto.  
**Data:** 2026-03-29  
**Nota de escopo:** existem **centenas** de ficheiros `.md` só em `docs/relatorios/` (da ordem de **~576** ao tempo desta consolidação). Este índice prioriza **documentos âncora** e **padrões de nomenclatura**; para ficheiros históricos não listados linha a linha, use pesquisa no IDE (Ctrl+P) pelo prefixo ou data.

**Colunas:** Nome | Finalidade | Status | Importância | Observações  

**Legenda sugerida — Status:** Ativo (referência V1) | Histórico (contexto de trabalho) | Obsoleto relativo (supersedido por V1)  
**Legenda — Importância:** Crítica | Alta | Média | Baixa / arquivo  

---

## Documentos na raiz `docs/` (pacote oficial e contexto)

| Nome | Finalidade | Status | Importância | Observações |
|------|------------|--------|-------------|-------------|
| `PROJETO-GOLDEOURO-V1-OFICIAL.md` | Coração documental do produto V1 | Ativo | Crítica | 14 secções; alinhado ao relatório mestre |
| `DECLARACAO-AUTORIA-E-PROPRIEDADE-GOLDEOURO.md` | Registo formal de autoria/PI (documental) | Ativo | Alta | Titular legal: campo a preencher |
| `MEMORIA-ESTRATEGICA-GOLDEOURO-V1.md` | Decisões e o que não reabrir | Ativo | Crítica | Evita perda de inteligência |
| `DOSSIE-EXECUTIVO-GOLDEOURO-V1.md` | Versão para não técnicos | Ativo | Alta | Sócios / parceiros |
| `CONTEXTO-CRITICO-NAO-PERDER.md` | Continuidade sem regressão | Ativo | Crítica | Entrypoint, legado, leitura obrigatória |
| `MAPA-OFICIAL-VS-LEGADO-GOLDEOURO.md` | Evitar uso errado de ficheiros | Ativo | Crítica | Backend/player/admin |
| `LEIA-ANTES-DE-CONTINUAR-O-PROJETO.md` | Retomada do projeto | Ativo | Crítica | Primeiro doc humano |
| `docs/operacional/`, `docs/sql/`, outros `.md` em `docs/` | Matéria dispersa por tema | Misto | Média | Cruzar com relatório mestre |

---

## Relatórios mestres e consolidação V1 (`docs/relatorios/`)

| Nome | Finalidade | Status | Importância | Observações |
|------|------------|--------|-------------|-------------|
| `RELATORIO-MESTRE-V1-GOLDEOURO.md` | Síntese técnica A→J, limitações, riscos | Ativo | Crítica | Base das auditorias READ-ONLY |
| `INDICE-RELATORIOS-V1.md` | 10 links rápidos V1 | Ativo | Alta | Atalho de navegação |
| `INDICE-MESTRE-GOLDEOURO-V1.md` | Este ficheiro — inventário oficial | Ativo | Crítica | Ponto de entrada para arquivo |
| `CONSOLIDACAO-FINAL-DE-CONTEXTO-E-PROTECAO-GOLDEOURO-2026-03-29.md` | Relatório da consolidação documental | Ativo | Alta | Classificação final da proteção |
| `RELATORIO-MESTRE-V1-GOLDEOURO.md` (refs finais) | Bibliografia interna | Ativo | Alta | Ver secção de referências no próprio mestre |

---

## Auditorias por bloco (READ-ONLY e correlatos)

| Nome | Finalidade | Status | Importância | Observações |
|------|------------|--------|-------------|-------------|
| `AUDITORIA-READONLY-BLOCO-A-FINANCEIRO-V1-2026-03-29.md` | PIX, webhook, reconcile | Ativo | Crítica | Bloco A |
| `AUDITORIA-READONLY-BLOCO-B-ENGINE-V1-2026-03-29.md` | Lotes, contador, shoot | Ativo | Crítica | Bloco B |
| `AUDITORIA-READONLY-BLOCO-D-SALDO-V1-2026-03-29.md` | Saldo, lock, rollbacks | Ativo | Crítica | Bloco D |
| `AUDITORIA-READONLY-BLOCO-G-ANTIFRAUDE-2026-03-29.md` | Superfície, JWT, exposição | Ativo | Alta | Bloco G |
| `AUDITORIA-READONLY-BLOCO-I-ESCALABILIDADE-2026-03-16.md` | Escala, instância única | Ativo | Alta | Bloco I |
| `AUDITORIA-READONLY-BLOCO-J-PAINEL-DE-CONTROLE-2026-03-28.md` | Admin API vs SPA | Ativo | Alta | Bloco J |
| `AUDITORIA-MERCADOPAGO-REAL-V1.md` | MP real vs env | Ativo | Alta | Pré/deploy |
| `AUDITORIA-MERCADOPAGO-READY-2026-03-29.md` | Prontidão MP | Ativo | Alta | Complementar |
| **Padrão `AUDITORIA-*.md`** | Várias auditorias temáticas e datas | Misto | Média a Alta | Filtrar por data e palavra-chave |
| **Padrão `BLOCO-*-READONLY.md` / `VALIDACAO-*.md`** | Ciclos de trabalho por bloco | Histórico | Média | Detalhe antes da síntese V1 |

---

## Documentos operacionais

| Nome | Finalidade | Status | Importância | Observações |
|------|------------|--------|-------------|-------------|
| `RUNBOOK-OPERACIONAL-V1.md` | Incidentes e recuperação | Ativo | Crítica | Operação diária |
| `INVENTARIO-ENV-V1.md` | Variáveis de ambiente | Ativo | Crítica | Deploy e segurança |
| `MAPA-ENDPOINTS-V1.md` | Rotas reais do Fly entrypoint | Ativo | Crítica | Contrato implícito |
| `MATRIZ-RISCOS-V1.md` | Riscos numerados R1–R18 | Ativo | Crítica | GO/NO-GO |

---

## Documentos de deploy e GO/NO-GO

| Nome | Finalidade | Status | Importância | Observações |
|------|------------|--------|-------------|-------------|
| `CHECKLIST-GO-NO-GO-V1.md` | Bloqueadores de lançamento | Ativo | Crítica | Executar no dia |
| `CHECKLIST-FINAL-V1-GO-NO-GO-2026-03-29.md` | Checklist estendido datado | Ativo | Alta | Cruzar com o V1 curto |
| `STATUS-PRONTIDAO-DEPLOY-V1.md` | Estado face ao deploy | Ativo | Alta | Orçamento / Fly |
| `CHECKLIST-DEPLOY-FLY-MP-V1.md` | Passos Fly + MP | Ativo | Crítica | Técnico |
| `SMOKE-TEST-PRODUCAO-V1.md` | Validação pós-deploy | Ativo | Crítica | Assinar resultado |
| **Padrão `VALIDACAO-FINAL-FLY-*.md`** | Deploy CLI / Fly | Histórico | Média | Contexto março 2026 |

---

## Documentos de risco, decisão e roadmap

| Nome | Finalidade | Status | Importância | Observações |
|------|------------|--------|-------------|-------------|
| `MATRIZ-RISCOS-V1.md` | (repetido por clareza) Mapa risco×domínio | Ativo | Crítica | Ver secção de mapa |
| `PRE-OPERACAO-V1-CHECKLIST-E-DOCUMENTACAO.md` | Pré-operação | Ativo / Histórico | Média | Cruzar com GO/NO-GO |
| `ROADMAP-CHECKLIST-ARQUITETURA-JOGO-V1.md` (em `docs/` se existir) | Roadmap arquitetura | Misto | Média | Fora do escopo código aqui |
| **Padrão `DECISAO-OPERACIONAL-*.md`** | Decisões de promoção/deploy | Histórico | Média | Rastreabilidade |

---

## Documentos de proteção, autoria e arquivo

| Nome | Finalidade | Status | Importância | Observações |
|------|------------|--------|-------------|-------------|
| `docs/DECLARACAO-AUTORIA-E-PROPRIEDADE-GOLDEOURO.md` | PI e titular (a completar) | Ativo | Alta | Raiz `docs/` |
| `docs/CONTEXTO-CRITICO-NAO-PERDER.md` | Proteção contra regressão | Ativo | Crítica | |
| `READONLY-ABSOLUTO-PRE-CIRURGIA-BLOCO-J-2026-03-28.md` | Marco de modo READ-ONLY | Histórico | Baixa | Cultura de trabalho |
| **Padrão `BLINDAGEM-*.md`, `CIRURGIA-*.md`** | Registos de intervenções | Histórico | Baixa a Média | Não confundir com “estado atual” |

---

## Padrões de ficheiros em massa (não listados um a um)

| Padrão / grupo | Finalidade | Status | Importância | Observações |
|----------------|------------|--------|-------------|-------------|
| `BLOCO-A1-*`, `BLOCO-A2-*`, `BLOCO-A3-*` | Finanças / saque / PIX por fase | Histórico | Média | Suplemento ao A READ-ONLY V1 |
| `BLOCO-F-*`, `BLOCO-G-*`, `BLOCO-H*` | HUD, segurança, analytics | Histórico | Média | |
| `EXEC-HOJE-*` | Execuções diárias pontuais | Histórico | Baixa | Arquivo de sprint |
| `CORRECAO-CIRURGICA-*.md` | Registo pós-correção | Histórico | Média | Cruzar com código atual se necessário |
| `AUDITORIA-CIRURGICA-*.md` | Auditorias focadas | Histórico | Média | |
| `RELATORIO-EXECUTIVO-COMPLETO*.md` | Relatórios executivos datados | Histórico | Média | Versão viva: mestre V1 |
| `V1-STATUS-FINAL.md`, `PROGRESSO-POR-BLOCOS-*.md` | Snapshots de progresso | Histórico | Média | |

---

## Como usar este índice

1. **Primeira leitura:** `docs/LEIA-ANTES-DE-CONTINUAR-O-PROJETO.md` → `RELATORIO-MESTRE-V1-GOLDEOURO.md`.  
2. **Deploy:** `CHECKLIST-DEPLOY-FLY-MP-V1.md` + `SMOKE-TEST-PRODUCAO-V1.md`.  
3. **Arquivo profundo:** pesquisa por `AUDITORIA`, `BLOCO`, data `2026-03` no explorador do IDE.  

---

*Fim do índice mestre.*
