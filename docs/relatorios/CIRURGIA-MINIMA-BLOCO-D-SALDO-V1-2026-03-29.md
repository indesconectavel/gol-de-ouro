# CIRURGIA MÍNIMA — BLOCO D — SALDO V1

**Data:** 2026-03-29  
**Ficheiro alterado:** `server-fly.js` (único ficheiro de código modificado).  
**Premissa:** preservar comportamento funcional e contratos HTTP existentes.

---

## 1. Resumo executivo

Foram aplicadas **três melhorias localizadas** no BLOCO D: (1) **rollback do saldo no chute** passou a usar **lock otimista** no `WHERE` (`saldo` deve ainda ser o valor retornado após o update do chute), evitando sobrescrever um saldo mais novo em corrida extrema; (2) **log operacional estruturado** para o caso **PIX criado no Mercado Pago sem insert em `pagamentos_pix`** (tag `PIX_ORFAO_MP` / `[PIX-ORFAO-MP]`); (3) **log crítico endurecido** quando o **rollback do saque fallback** falha após erro no `insert` em `saques` (tag `SAQUE_ROLLBACK_CRITICO` / `[SAQUE-ROLLBACK-CRITICO]` com contexto JSON).

Não se alteraram RPCs SQL, `FINANCE_ATOMIC_RPC`, rotas do player/admin, engine de lotes, Gol de Ouro, nem o shape das respostas JSON (apenas mensagens de **log** no servidor).

---

## 2. Escopo realmente alterado

| Área | Ficheiro | Linhas (aprox.) |
|------|----------|------------------|
| Helper + rollback chute | `server-fly.js` | Após `VALID_DIRECTIONS`; ramos `validateAfterShot` e erro `insert` em `chutes` |
| Log PIX órfão | `server-fly.js` | Ramo `insertError` após criação MP |
| Log saque rollback crítico | `server-fly.js` | Ramo `saqueError` + falha de rollback no fallback JS |

---

## 3. Mudanças aplicadas

1. **`revertShootSaldoOptimistic(userId, saldoAntesChute, saldoAposChuteNoDb)`**  
   - `UPDATE usuarios SET saldo = saldoAntesChute WHERE id = … AND saldo = saldoAposChuteNoDb`  
   - Usa `updatedUser.saldo` como valor do `WHERE` (o mesmo retornado pelo update bem-sucedido do chute).  
   - Se nenhuma linha for atualizada: log `[SHOOT-ROLLBACK]` com playbook textual; **não** força revert com saldo stale.

2. **PIX:** em falha de persistência após MP OK: log único com prefixo **`[PIX-ORFAO-MP]`**, objeto JSON com `tag`, `mercado_pago_payment_id`, `usuario_id`, `amount_brl`, código/mensagem Supabase — facilita grep e reconciliação manual.

3. **Saque fallback:** se rollback após `saqueError` falhar: log **`[SAQUE-ROLLBACK-CRITICO]`** com JSON (`usuario_id`, valores de saldo esperados, erro do insert, erro do rollback, flag de linha de rollback).

---

## 4. O que foi deliberadamente preservado

- Ordem do fluxo: leitura de saldo → update com lock otimista → mutação de lote em memória → validação → insert `chutes`.  
- Valores de `novoSaldo`, prêmios, contador global, regras de gol e de lote.  
- Contrato das respostas `400` / `409` / `500` (mensagens ao cliente inalteradas onde já existiam).  
- RPCs `creditar_pix_aprovado_mp` e `solicitar_saque_pix_atomico` (sem alteração).  
- Webhook PIX: apenas o criador de cobrança ganhou log extra no ramo de falha local; webhook não foi reestruturado.

---

## 5. Rollback do chute

**Antes:** `update({ saldo: user.saldo }).eq('id', userId)` — podia substituir um saldo alterado por outra operação concorrente pelo valor antigo `user.saldo`.

**Depois:** revert só se `saldo` na BD ainda for exatamente `updatedUser.saldo`. Caso contrário, log de alerta e **não** há overwrite.

**Caminho feliz:** inalterado — o revert coincide com o estado imediatamente após o update do chute, pelo que o `WHERE` continua a ser satisfeito.

---

## 6. PIX sem linha local

Não foi introduzido reconcile automático nem nova tabela. Apenas **observabilidade**: o operador pode procurar `PIX_ORFAO_MP` ou `[PIX-ORFAO-MP]` nos logs e usar `mercado_pago_payment_id` + `usuario_id` + `amount_brl` para ação manual.

O caso em que o MP cria cobrança mas o Supabase está indisponível **antes** do insert já tinha log; mantido; o foco desta etapa é o **insert com erro** com BD ligado.

---

## 7. Saque fallback

Fluxo **não** reordenado (débito → insert → rollback em falha). Apenas o ramo de **falha do rollback** passou a registar contexto completo em JSON para suporte e auditoria forense.

---

## 8. Logs e guardas defensivos

- Tags estáveis: `PIX_ORFAO_MP`, `SAQUE_ROLLBACK_CRITICO`, prefixos de texto `[PIX-ORFAO-MP]`, `[SAQUE-ROLLBACK-CRITICO]`, `[SHOOT-ROLLBACK]`.  
- Comentário JSDoc no helper do chute referenciando BLOCO D e o objetivo do rollback conservador.

---

## 9. Riscos reduzidos

| Risco | Efeito da mudança |
|-------|-------------------|
| Sobrescrita de saldo mais novo no rollback do chute | Reduzido: revert condicional |
| Dificuldade de rastrear MP sem `pagamentos_pix` | Reduzido: log estruturado e pesquisável |
| Opacidade quando saque fica debitado sem linha e rollback falha | Reduzido: log crítico com playbook explícito |

---

## 10. Riscos remanescentes

- **Chute:** se o revert condicional não aplicar (corrida), o saldo pode continuar refletindo o chute enquanto o registo em `chutes` falhou — requer revisão manual (já sinalizado no log).  
- **PIX órfão:** continua a exigir intervenção manual; apenas ficou mais fácil detectar.  
- **Múltiplas instâncias / tipos numéricos:** edge cases de precisão ou tipos no PostgREST não foram alterados de propósito.  
- **RPC vs fallback:** fragilidade relativa do fallback JS mantém-se; não foi objeto desta cirurgia.

---

## 11. Sanidade final

- `server-fly.js` sem erros reportados pelo linter do IDE após as edições.  
- Nenhuma dependência nova; nenhuma alteração em SQL aplicada pelo código (ficheiros `.sql` intocados).

---

## 12. Diagnóstico final

As alterações são **mínimas**, **reversíveis** e alinhadas ao pedido: endurecem consistência do rollback do chute e a **rastreabilidade operacional** dos casos extremos de PIX e saque, sem reescrever fluxos nem contratos.

**Classificação final (obrigatória):** **BLOCO D ENDURECIDO COM SEGURANÇA**.

---

*Fim do relatório.*
