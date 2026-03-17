# MATRIZ DE PRIORIDADE DE CORREÇÕES — GOL DE OURO (BLOCO I.3)

**Projeto:** Gol de Ouro  
**Data:** 2026-03-16  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração em código, banco ou arquitetura. Apenas decisão estratégica.

**Contexto:** Este documento consolida os resultados de:

- **BLOCO I — Escalabilidade** (arquitetura funcional apenas em baixa escala)  
- **BLOCO I.1 — Plano de Escalabilidade** (o que precisa mudar para escalar)  
- **BLOCO I.2 — Mapa de Quebra** (como o sistema quebra na prática)

Objetivo aqui: transformar todos os riscos identificados em **prioridades claras de correção**, sob a ótica de impacto financeiro, severidade, frequência, detectabilidade e dependência técnica.

---

## 1. Resumo executivo

### O que precisa ser corrigido primeiro

As **correções que mais evitam prejuízo imediato** e devem ser tratadas **antes de qualquer aumento relevante de tráfego** são:

1. **Retry sem idempotência no chute** (débito duplicado por clique duplo/timeout).  
2. **Janela entre UPDATE de saldo e INSERT em chutes** (sem transação).  
3. **Deriva do contador global que afeta o Gol de Ouro**.  
4. **Falhas silenciosas em saveGlobalCounter()** (contador atrás no banco).  
5. **Reversão de saldo não garantida em caso de erro** (rollback manual que pode falhar).

### O que é mais perigoso hoje

Do ponto de vista de **dinheiro em risco e confiança no jogo**, os pontos mais perigosos são:

- **DÉBITO DUPLICADO** (usuário paga duas vezes pelo mesmo chute).  
- **SALDO ≠ HISTÓRICO DE CHUTES** (crash entre UPDATE e INSERT).  
- **GOL DE OURO NO NÚMERO ERRADO OU PULADO** (contador derivando na prática).  
- Tudo isso com falhas frequentemente **invisíveis**, que não geram erro 500 para o usuário.

---

## 2. Matriz de prioridade geral

Critérios:

- **💰 Impacto financeiro:** quanto dinheiro está em risco.  
- **⚠️ Severidade:** quebra o sistema/confiança?  
- **🔁 Frequência:** quão fácil/recorrente é o cenário.  
- **🧠 Detectabilidade:** fácil ou difícil de perceber.  
- **⚙️ Dependência técnica:** bloqueia outras melhorias?

Classificação final:

- 🔴 **CRÍTICO IMEDIATO** — precisa ser endereçado antes de crescer.  
- 🟠 **ALTO** — logo após os críticos.  
- 🟡 **MÉDIO** — pode esperar, mas entra no roadmap.  
- 🟢 **BAIXO** — opcional/melhoria.

### 2.1 Tabela de problemas x prioridade

| Problema | Impacto 💰 | Severidade ⚠️ | Frequência 🔁 | Detectabilidade 🧠 | Dependência ⚙️ | Prioridade |
|----------|-----------|---------------|---------------|--------------------|----------------|-----------|
| Retry sem idempotência (débito duplicado) | Alta por usuário / alta em volume | Muito alta (quebra confiança) | Alta (rede instável, timeouts, duplo clique) | Média (usuário percebe, logs nem sempre) | Baixa | 🔴 CRÍTICO IMEDIATO |
| Janela entre UPDATE saldo e INSERT chutes (sem transação) | Alta (saldo x histórico) | Muito alta (contabilidade quebrada) | Média (deploy, crash, falha infra) | Baixa (pode passar despercebido) | Alta (base para outras correções) | 🔴 CRÍTICO IMEDIATO |
| Deriva do contador global (Gol de Ouro errado) | Média/alta (R$ 100 e reputação) | Muito alta (injustiça/regulatório) | Média sob concorrência | Baixa (falha silenciosa) | Média | 🔴 CRÍTICO IMEDIATO |
| saveGlobalCounter falhando silenciosamente | Média (Gol de Ouro atrasado) | Alta | Baixa/média | Muito baixa (apenas em logs) | Média | 🔴 CRÍTICO IMEDIATO |
| Reversão de saldo que pode falhar | Média/alta (saldo incorreto) | Muito alta | Baixa | Baixa (difícil de rastrear) | Média | 🔴 CRÍTICO IMEDIATO |
| Lotes só em memória (lotes órfãos no restart) | Média (consistência histórica) | Alta | Certa em qualquer restart com tráfego | Média (aparece em auditoria) | Alta (base para escala) | 🟠 ALTO |
| Contador global não atômico (para escala) | Alta em multi-instância | Alta | Alta em escala horizontal | Média | Alta | 🟠 ALTO |
| Idempotência só em memória (perdida em restart / não compartilhada) | Média | Alta em multi-instância | Média | Média | Alta | 🟠 ALTO |
| Conteção em metricas_globais (uma linha atualizada a cada chute) | Indireto (mais timeouts, mais retries) | Média | Cresce com a carga | Alta (métrica/latência) | Média | 🟡 MÉDIO |
| Quebras de UX (409 “Saldo alterado” em cenários não intuitivos) | Baixa/média | Média | Média | Alta (usuário vê mensagem estranha) | Baixa | 🟡 MÉDIO |
| Melhorias de logging e monitoramento | Indireto | Média | Alta utilidade contínua | Alta | Baixa | 🟢 BAIXO |

---

## 3. Top 5 correções críticas imediatas

Estas são as **cinco ações conceituais** que mais evitam prejuízo real **agora**, sem entrar em detalhes de implementação:

1. **Idempotência completa do chute (lado cliente + lado servidor)**  
   - Evita que o mesmo ato do usuário seja processado mais de uma vez.  
   - Ataca diretamente o cenário nº 1 do Mapa de Quebra: **débito duplicado por retry/clique duplo**.

2. **Fechamento atômico “saldo + chute”**  
   - Garante que a operação “debitar/creditar saldo + registrar chute” seja **indivisível** (ou tudo acontece, ou nada acontece).  
   - Elimina a janela entre UPDATE e INSERT que gera **saldo sem registro** ou registro sem saldo.

3. **Contador global confiável para Gol de Ouro**  
   - Garante que o contador usado para decidir Gol de Ouro seja sempre **correto e único** por chute real.  
   - Evita Gol de Ouro no número errado ou “pulado”, que é um dos maiores riscos reputacionais.

4. **Tratamento robusto de falha em saveGlobalCounter**  
   - Garante que falhas no salvamento da métrica global sejam **detectadas e tratadas**, não apenas logadas.  
   - Evita que o sistema continue operando com contador no banco atrasado.

5. **Robustez na reversão de saldo em caso de erro**  
   - Garante que, quando o sistema tentar “desfazer” uma operação de saldo por erro em chutes, essa reversão tenha **chance real de sucesso** ou seja claramente sinalizada para correção manual.  
   - Evita saldos “fantasma” difíceis de reconciliar.

---

## 4. Correções de alto impacto (curto prazo)

São importantes, mas podem vir logo após os cinco pontos acima.

1. **Persistência estruturada de lotes (evitar lotes órfãos em restart)**  
   - Traz o estado do lote para um lugar que sobreviva a restart.  
   - Facilita auditoria: fica claro quantos chutes existem em cada lote, inclusive lotes incompletos.

2. **Idempotência independente de processo (não só em memória)**  
   - Garante que a deduplicação funcione mesmo após restart ou em caminhos futuros de multi-instância.  
   - Reduz risco de duplicação em quaisquer cenários em que o backend seja reiniciado.

3. **Melhor visibilidade operacional (monitorar contadores, falhas e reversões)**  
   - Transformar falhas hoje “invisíveis” (saveGlobalCounter, reversão) em alarmes/indicadores claros para a operação.  
   - Não corrige o problema por si só, mas evita que ele cresça sem ser notado.

4. **Política operacional clara para deploy/restart**  
   - Mesmo sem mudar código, definir janelas de deploy e práticas que reduzam a chance de matar requests entre UPDATE e INSERT.  

---

## 5. Correções estruturais (médio prazo)

Ligadas à **escalabilidade e arquitetura**, baseadas no BLOCO I.1:

1. **Lotes e contador fora da memória do app**  
   - Fonte da verdade no banco ou em store compartilhado (Redis, etc.).  
   - Permite pensar em multi-instância no futuro sem quebrar a economia.

2. **Contador global atômico centralizado**  
   - “O número do chute” passa a ser emitido por uma única fonte atômica.  
   - Prepara o terreno para múltiplas instâncias e relatórios confiáveis de Gol de Ouro.

3. **Idempotência compartilhada entre instâncias**  
   - Necessária para qualquer forma de horizontalização.  
   - Garante que a chave de idempotência “valha” em qualquer instância do cluster.

4. **Fluxo de chute transacional de ponta a ponta**  
   - Tudo que define o efeito econômico de um chute (saldo, chute, contador, lote) passa a ser parte da mesma unidade lógica de consistência.

---

## 6. Correções de baixo impacto

Itens que ajudam, mas não mudam o jogo sozinhos:

- **Redução de mensagens confusas (ex.: 409 “Saldo alterado”)** — melhora a UX e reduz tickets, mas não resolve a raiz econômica.  
- **Otimização de métricas e logs** — ajuda na operação e análise forense.  
- **Melhorias de performance em `metricas_globais`** — úteis em alta carga, mas secundárias em comparação aos riscos financeiros atuais.

Prioridade: 🟢 **BAIXO**. Devem ser encaixadas quando os riscos críticos já estiverem sob controle.

---

## 7. Ordem recomendada de execução

Sem entrar em detalhes de código, a sequência lógica de correção é:

1. **Proteger o usuário contra débito duplicado**  
   - Decisão de produto/engenharia: adotar idempotência “end-to-end” para o chute.

2. **Proteger a contabilidade contra estados parciais**  
   - Fechar a janela entre saldo e registro de chute (visão conceitual de transação).

3. **Proteger o Gol de Ouro contra contadores falsos**  
   - Garantir que cada chute real avance o contador global de forma confiável.

4. **Evitar falhas silenciosas em métricas e reversões**  
   - Tornar erros em saveGlobalCounter e rollback de saldo visíveis e tratáveis.

5. **Dar persistência real ao estado crítico (lotes, idempotência)**  
   - Preparar o terreno para escala futura, sem ainda necessariamente escalar.

6. **Só então considerar escala horizontal ou aumento agressivo de carga**

---

## 8. Dependências entre correções

- **Idempotência completa do chute** (1) **não depende** de mudanças estruturais; pode ser adotada mesmo em arquitetura atual.  
- **Fechamento atômico saldo + chute** (2) é base para qualquer evolução posterior de contador e lotes — idealmente vem antes de mexer em escala.  
- **Contador global confiável** (3) depende de ter uma visão clara de onde será a “fonte da verdade” (banco/store).  
- **Persistência de lotes e idempotência compartilhada** (5) são pré-requisitos para multi-instância, mas não para operação em instância única.  
- Melhorias de UX e otimizações de métricas **não são pré-requisito** para segurança financeira.

Resumo das dependências:

- **Primeiro:** proteger usuário e contabilidade (idempotência + atomicidade).  
- **Depois:** proteger regras de jogo (contador/Gol de Ouro).  
- **Por fim:** proteger arquitetura para escala (lotes/contador/idempotência compartilhados).

---

## 9. O que NÃO deve ser feito agora

Para evitar retrabalho e decisões erradas:

- **Não focar primeiro em otimizações de performance ou escala horizontal** (ex.: várias instâncias, load balancing), enquanto **débitos duplicados e transação parcial não estiverem resolvidos conceitualmente**. Escalar um sistema com esses riscos amplia o prejuízo.  
- **Não priorizar ajustes cosméticos de UX** (textos de erro, microtweaks) à frente de correções com impacto direto em saldo e Gol de Ouro.  
- **Não assumir que “uma instância única” é suficiente para segurança**, ignorando retry, crash e contador derivado: esses problemas existem mesmo com um único backend.

---

## 10. Conclusão estratégica

### Qual é o primeiro passo correto?

**Proteger o usuário e a contabilidade contra duplicidade e estado parcial.** Em termos práticos de decisão, isso significa priorizar:

- Idempotência de chute (para qualquer retry/clique duplo).  
- Atomicidade lógica entre saldo e registro de chute.

### Qual erro evitar?

O erro mais perigoso seria **tentar escalar (mais tráfego ou mais instâncias)** antes de resolver esses pontos. Isso multiplicaria os efeitos de débito duplicado, Gol de Ouro incorreto e inconsistências de saldo, dificultando correção posterior.

### Qual caminho mais seguro?

- **Curto prazo:** blindar o fluxo do chute contra duplicidade e contra inconsistência saldo vs chutes.  
- **Médio prazo:** consolidar contador, lotes e idempotência em uma fonte da verdade robusta.  
- **Longo prazo:** só então abrir espaço para escala horizontal e aumento agressivo de carga, com confiança de que cada chute, cada prêmio e cada Gol de Ouro estão economicamente corretos.

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração foi feita em código, banco, deploy ou arquitetura. Apenas priorização estratégica com base nos blocos I, I.1 e I.2.*

