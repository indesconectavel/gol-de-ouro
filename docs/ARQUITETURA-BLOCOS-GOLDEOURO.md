# Arquitetura em Blocos — Gol de Ouro

**Projeto:** Gol de Ouro  
**Documento:** Fonte oficial da estrutura modular do projeto  
**Última atualização:** 2026-03-09  

---

## 1. Introdução

O projeto **Gol de Ouro** é organizado em **blocos auditáveis**, com os seguintes objetivos:

- **Organizar auditorias** — Cada bloco tem escopo definido, permitindo inspeção técnica focada e relatórios padronizados.
- **Evitar regressões** — O estado de cada bloco (status) fica registrado; mudanças de código podem ser confrontadas com o que já foi validado.
- **Validar a V1 de forma modular** — A versão 1 do produto é considerada validada quando os blocos críticos atingem os status definidos neste documento.

Nenhum bloco substitui a necessidade de testes e revisão de código; eles estruturam o processo de auditoria e o critério de “V1 pronta para operação”.

---

## 2. Status possíveis

Cada bloco pode estar em um dos status oficiais abaixo:

| Status | Significado |
|--------|-------------|
| 🔵 **EM ANÁLISE** | Auditoria em andamento; conclusão pendente. |
| 🟡 **VALIDADO COM RESSALVAS** | Funciona e foi aprovado tecnicamente, com riscos ou limitações conhecidos e documentados. |
| 🟢 **VALIDADO** | Aprovado tecnicamente; escopo do bloco atendido dentro do esperado para V1. |
| 🟣 **ENCERRADO PREMIUM** | Totalmente auditado, documentado e congelado; referência oficial para o bloco. |
| ⚪ **NÃO AUDITADO** | Ainda não passou por auditoria formal. |

---

## 3. Lista oficial de blocos

### 📦 BLOCO A — Financeiro

- **Escopo:** depósitos PIX, saques PIX, webhooks, worker de payout, ledger financeiro.
- **Status atual:** 🟢 **VALIDADO**

---

### 📦 BLOCO B — Sistema de apostas

- **Escopo:** modelo matemático, valor da aposta, estrutura de lote, premiação.
- **Status atual:** 🟢 **VALIDADO**

---

### 📦 BLOCO C — Autenticação

- **Escopo:** login, registro, JWT, proteção de rotas, sessão.
- **Status atual:** 🟢 **VALIDADO**

---

### 📦 BLOCO D — Sistema de saldo

- **Escopo:** controle de saldo, débito no chute, crédito no prêmio, concorrência de saldo.
- **Status atual:** 🟡 **VALIDADO COM RESSALVAS**

---

### 📦 BLOCO E — Gameplay

- **Escopo:** engine do jogo, contador de chutes, lógica de gol, registro de chutes, premiação.
- **Status atual:** 🟣 **ENCERRADO PREMIUM**

---

### 📦 BLOCO F — Interface

- **Escopo:** telas do jogo, fluxo de navegação, UX do chute, feedback visual (inclui app shell do player e, em documentação à parte, `/game`).
- **Status atual:** 🟢 **FECHADO / VALIDADO** *(refinamento app shell documentado em 2026-03-26; ver `docs/relatorios/BLOCO-F-ENCERRAMENTO-OFICIAL-2026-03-26.md`)*

---

### 📦 BLOCO G — Antifraude

- **Escopo:** exploração de API, multi-conta, retry duplicado, exposição de endpoints.
- **Status atual:** 🟡 **VALIDADO COM RISCOS MODERADOS**

---

### 📦 BLOCO H — Economia e retenção

- **Escopo:** engajamento, expectativa, retenção de jogadores, percepção de vitória.
- **Status atual:** 🔵 **EM ANÁLISE**

---

### 📦 BLOCO I — Escalabilidade

- **Escopo:** multi-instância, consistência distribuída, contador global, filas.
- **Status atual:** ⚪ **NÃO AUDITADO**

---

### 📦 BLOCO J — Observabilidade

- **Escopo:** logs, métricas, monitoramento, alertas.
- **Status atual:** ⚪ **NÃO AUDITADO**

---

### 📦 BLOCO K — Painel administrativo

- **Escopo:** controle de usuários, relatórios, exportação de dados, gestão operacional.
- **Status atual:** ⚪ **NÃO AUDITADO**

---

## 4. Ordem oficial de auditoria do projeto

A sequência recomendada para auditoria dos blocos é:

1. **A** — Financeiro  
2. **B** — Sistema de apostas  
3. **C** — Autenticação  
4. **D** — Sistema de saldo  
5. **E** — Gameplay  
6. **F** — Interface  
7. **G** — Antifraude  
8. **H** — Economia  
9. **I** — Escalabilidade  
10. **J** — Observabilidade  
11. **K** — Painel admin  

---

## 5. Critério para considerar a V1 validada

A **V1** do Gol de Ouro é considerada **validada** quando forem atendidas as condições abaixo:

| Bloco | Condição |
|-------|----------|
| A | Validado |
| B | Validado |
| C | Validado |
| D | Validado com ressalvas |
| E | Encerrado premium |
| F | Validado |
| G | Validado |
| H | Validado |

Os blocos **I**, **J** e **K** (Escalabilidade, Observabilidade, Painel admin) não são obrigatórios para o critério “V1 validada” definido acima; podem ser auditados em ciclo posterior.

---

## 6. Padrão de relatórios de auditoria

Os relatórios de auditoria por bloco devem seguir o padrão de nomenclatura e localização:

**Local:** `docs/relatorios/`  

**Formato do nome:**  
`AUDITORIA-BLOCO-<LETRA>-<NOME-DO-BLOCO>-<YYYY-MM-DD>.md`

**Exemplos:**

- `AUDITORIA-BLOCO-F-INTERFACE-2026-03-09.md`
- `AUDITORIA-BLOCO-G-ANTIFRAUDE-READONLY-2026-03-09.md`
- `AUDITORIA-CONCORRENCIA-CHUTES-E-SALDO-READONLY-2026-03-09.md` (auditoria temática pode usar nome descritivo, mantendo data e pasta)

Para auditorias **read-only** ou com escopo específico, pode-se incluir sufixos como `-READONLY` ou o nome do tema, desde que a data (YYYY-MM-DD) seja mantida.

---

*Este documento é a referência oficial da arquitetura em blocos do projeto Gol de Ouro. Alterações de status ou inclusão de blocos devem ser refletidas aqui.*
