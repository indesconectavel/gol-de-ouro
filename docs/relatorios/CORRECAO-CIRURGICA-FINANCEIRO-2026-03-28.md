# CORREÇÃO CIRÚRGICA — FINANCEIRO

**Data:** 2026-03-28  
**Base:** auditoria de bloqueios financeiros, saneamento PT/EN concluído, patch de normalização (`utils/financialNormalization.js`).

---

## 1. Resumo executivo

Foram tratados três pontos:

1. **PIX — janela `approved` sem crédito:** introduzida a RPC PostgreSQL **`creditar_pix_aprovado_mp`**, que atualiza **`usuarios.saldo`** e só então marca **`pagamentos_pix.status = 'approved'`** na **mesma transação**, com compensação se o segundo `UPDATE` na linha PIX falhar. O **`server-fly.js`** chama a RPC por defeito (`FINANCE_ATOMIC_RPC` ≠ `false`) e mantém o fluxo JS antigo apenas como **fallback** se a função não existir ou a resposta for inválida.

2. **PIX — sucesso com QR sem linha local:** **`POST /api/payments/pix/criar`** exige Supabase disponível; se o `insert` em `pagamentos_pix` falhar após o MP criar a cobrança, a API responde **500** (não 200) e regista `mercado_pago_payment_id` no JSON para suporte. Se o DB estiver indisponível **antes** da persistência, responde **503** sem devolver sucesso falso.

3. **Saque — débito sem linha:** introduzida a RPC **`solicitar_saque_pix_atomico`**, que faz **`INSERT` em `saques`** (dual PT/EN na SQL) e **`UPDATE` de saldo** no mesmo bloco; se o lock otimista do saldo falhar, **apaga** a linha de saque recém-inserida e devolve `saldo_race`. O handler HTTP tenta a RPC primeiro e conserva o fluxo **débito → insert → rollback** como fallback.

---

## 2. Arquivos alterados

| Ficheiro | Alteração |
|----------|-----------|
| **`database/rpc-financeiro-atomico-2026-03-28.sql`** | **Novo** — funções `creditar_pix_aprovado_mp` e `solicitar_saque_pix_atomico` + `GRANT` a `service_role`. |
| **`server-fly.js`** | RPC + fallback no crédito PIX; saque atómico + fallback; criação PIX com falha de insert → erro explícito; obrigatoriedade de DB para concluir criação. |
| **`.env.example`** | Documentação de `FINANCE_ATOMIC_RPC` (opcional). |

*Não foi alterado:* gameplay, auth admin, frontend, `paymentController` além do que já existia (insert já falhava com 500).

---

## 3. Correções no PIX

### Janela crítica

- **Com RPC aplicada:** não existe commit intermédio com `approved` e saldo antigo: ou a transação conclui **saldo aumentado + approved**, ou (em caso de falha no `UPDATE` final da linha PIX) o saldo é **revertido** dentro da mesma função e devolve-se `claim_lost`.
- **Fallback JS:** mantém o comportamento anterior (claim `approved` antes do saldo), usado só quando a RPC não está presente ou há erro não recuperável na chamada RPC.

### Webhook / reconcile

- Continuam a chamar **`creditarPixAprovadoUnicoMpPaymentId`**; o interior passa a preferir RPC. Motivos (`already_processed`, `claim_lost`, etc.) preservam a mesma semântica para logs.

### Criação do PIX

- Persistência obrigatória para resposta de sucesso; falha de insert → **500** + `data.mercado_pago_payment_id` (contrato alargado **só** em caso de erro, para rastreio).

### Evitar `approved` sem saldo (efeito prático)

- Com **SQL aplicado** em produção: novos créditos não passam pela janela antiga.
- **Exceção:** `zero_credit` (valor ≤ 0) continua a poder marcar `approved` sem movimento de saldo, alinhado ao legado (caso raro).

---

## 4. Correções no saque

### Consistência

- **RPC:** ordem **lock `usuarios` → verificação de saldo → INSERT `saques` → UPDATE saldo**; se o `UPDATE` não afetar linha (`saldo` mudou), **DELETE** do saque criado no mesmo pedido e retorno `saldo_race`.

### Débito sem linha

- Deixa de ser possível no caminho RPC bem-sucedido: ou existe linha e saldo debitado, ou nenhuma das duas alterações fica órfã no mesmo request.

### Rollback / reparo

- **Fallback JS:** mantém rollback de saldo após falha de insert; se o rollback falhar, o log crítico continua (risco remanescente só neste caminho).

### Transação / RPC / correlation_id

- Transação **no Postgres** via funções `SECURITY DEFINER`. **`correlation_id`** não foi adicionado neste patch (não obrigatório para a atomicidade pedida).

---

## 5. Ajustes de schema / SQL / dependências

- **Ficheiro:** `database/rpc-financeiro-atomico-2026-03-28.sql`
- **Ação operacional:** executar no **SQL Editor** do Supabase (produção/staging) antes de contar com o comportamento atómico.
- **Variável:** `FINANCE_ATOMIC_RPC=false` desativa tentativa de RPC (útil em ambientes sem migração).
- **Sem** rename/drop de colunas; **sem** novo estado `status` em `pagamentos_pix`.

---

## 6. Riscos eliminados

- Janela **committed** entre `approved` e crédito de saldo **nos fluxos que usam a RPC**.
- **Resposta 200/201** de criação PIX com QR quando o registo local essencial falhou (com DB ligado).
- **Débito confirmado sem insert** de saque no fluxo RPC (saldo race remove a linha criada).

---

## 7. Riscos remanescentes

- **Cobrança órfã no Mercado Pago** se o MP criar o pagamento e o insert local falhar (agora **sem** sucesso ao cliente; pode exigir reconciliação manual no MP).
- **Linhas antigas** já `approved` sem saldo (pré-RPC): **não** são reparadas automaticamente; exige script/consulta de suporte.
- **Fallback JS** de PIX mantém o risco teórico antigo se a RPC **não** for implantada.
- **`paymentController`** (rotas alternativas): se usado noutro deploy, pode não invocar estas RPCs — alinhar noutro passo se esse entrypoint for produtivo.

---

## 8. Checklist de validação

1. Aplicar **`database/rpc-financeiro-atomico-2026-03-28.sql`** no projeto Supabase correto.  
2. Confirmar nas definições da API que as funções aparecem para **`service_role`**.  
3. Deploy do backend; `FINANCE_ATOMIC_RPC` omitido ou `true`.  
4. **PIX:** criar depósito de teste; verificar linha `pending` → após pagamento (ou sandbox) `approved` e **saldo** coerente na mesma verificação transacional.  
5. **PIX negativo:** simular falha de insert (ex. política RLS de teste) e confirmar **500** sem `success: true`.  
6. **Saque:** pedido com saldo suficiente → uma linha em `saques` e saldo reduzido; segundo pedido concorrente extremo → 409 ou comportamento coerente.  
7. **Regressão:** webhook e timer de reconcile continuam a processar sem erros novos nos logs.

---

## 9. Veredito

**CORREÇÃO CONCLUÍDA**

O código no repositório implementa o desenho acordado (RPC + fallbacks + criação PIX segura). A ativação **plena** do modo atómico em produção depende do **passo único** de aplicar o SQL no Supabase; até lá, o sistema permanece funcional via **fallback JS** com os riscos legados **documentados** na secção 7.

---

*Fim do relatório.*
