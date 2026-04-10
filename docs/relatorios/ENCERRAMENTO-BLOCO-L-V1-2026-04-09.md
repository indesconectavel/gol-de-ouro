# ENCERRAMENTO — BLOCO L — V1

**Data:** 2026-04-09  
**Escopo:** jurídico / compliance (produto + evidência técnica no repositório)

---

## 1. Resumo executivo

- **BLOCO L** é classificado como **ACEITÁVEL PARA V1 SEM CIRURGIA**, segundo a régua deliberada: manter obrigatoriedade de aceite e maioridade na interface, documentos em `/terms` e `/privacy`, e **não** implementar nesta V1 a persistência auditável no backend.
- O bloco **não** está fechado como **compliance forte** (prova no sistema, versionamento técnico de termos, trilha de auditoria de consentimento).

---

## 2. O que a V1 já cumpre

- Aceite obrigatório no **frontend** (checkboxes; registo não conclui sem aceitar Termos e Política de Privacidade).
- Maioridade obrigatória no **frontend** (confirmação 18+ antes do envio).
- Páginas **`/terms`** e **`/privacy`** disponíveis e ligadas no fluxo de cadastro.
- Envio ao backend de **`acceptedTerms`** e **`isAdultConfirmed`** no corpo do pedido de registo (cliente).

---

## 3. O que a V1 não cumpre

- **Persistência auditável** do aceite e da maioridade no **backend** no caminho real de registro (`server-fly.js` persiste apenas dados de conta habituais em `usuarios`).
- **Versionamento técnico** dos termos no sistema (identificador de versão em BD/API).
- **Timestamp** e **IP** (e afins) **persistidos** como evidência de aceite.

---

## 4. Decisão oficial

- **Não** realizar cirurgia do BLOCO L na V1 relativamente à prova de consentimento no servidor.
- Registar formalmente os itens em falta como **backlog da V2** (ver secção 5).

---

## 5. Backlog V2

- Persistência de aceite (e, se aplicável, confirmação de maioridade) alinhada à política interna.
- Versão dos termos (e eventualmente da política de privacidade) referenciada no registo.
- Timestamp de aceite (gerado no servidor ou equivalente).
- IP e/ou user-agent (se aprovado em governança jurídica/produto).

---

## 6. Diagnóstico final

| Classificação | Significado |
|---------------|-------------|
| **ACEITÁVEL PARA V1** | Régua “interface + documentos + envio de sinais ao API”; sem obrigatoriedade de prova persistida nesta release. |
| **NÃO FECHADO COMO COMPLIANCE FORTE** | Continua lacuna estrutural para auditoria de consentimento **dentro** do sistema até implementação em V2 ou decisão futura. |

---

*Documento de encerramento do BLOCO L para a V1; diagnóstico técnico baseado no repositório e decisão de produto explícita acima.*
