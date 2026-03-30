# BLOCO A2 — Auditoria somente leitura: `POST /api/withdraw/request`

**Data:** 2026-03-27  
**Fonte:** `server-fly.js` (handler inline), `utils/pix-validator.js` (`validateWithdrawData`).

---

## 1. Resumo do comportamento atual

O endpoint **autentica o usuário**, **valida** corpo da requisição via `PixValidator.validateWithdrawData`, **lê** `usuarios.saldo` e **rejeita** se o valor solicitado for maior que o saldo. Em seguida **insere uma linha** na tabela `saques` com status `pendente`. **Não há** `update` em `usuarios.saldo`, **não há** reserva, **não há** lock otimista no saldo, **não há** idempotência de chave nem transação única que una leitura de saldo + insert + débito. O comentário no código indica que a transação contábil foi **delegada** a processador externo.

Variáveis `taxa` e `valorLiquido` são calculadas (~1451–1453) mas **não** são persistidas no `insert` analisado (apenas observação de fidelidade ao código).

---

## 2. Fluxo passo a passo do endpoint

**Arquivo:** `server-fly.js`  
**Registro:** `app.post('/api/withdraw/request', authenticateToken, async (req, res) => { ... })` (por volta das linhas **1401–1508**).

| Ordem | Operação |
|-------|----------|
| 1 | Middleware **`authenticateToken`** — exige JWT; `req.user.userId` disponível. |
| 2 | Extrai `valor`, `chave_pix`, `tipo_chave` de `req.body`. |
| 3 | Monta `withdrawData` e chama **`pixValidator.validateWithdrawData`** — pode retornar 400 se inválido. |
| 4 | Verifica `dbConnected` / `supabase` — se não, **503**. |
| 5 | **`select('saldo')`** em `usuarios` por `id` = `userId` — se erro ou vazio, **404**. |
| 6 | Compara **`parseFloat(usuario.saldo) < parseFloat(valor)`** — se verdadeiro, **400** “Saldo insuficiente”. |
| 7 | Calcula `taxa` e `valorLiquido` (não usados no insert neste trecho). |
| 8 | **`insert`** em **`saques`** com `usuario_id`, valores, chaves PIX normalizadas, **`status: 'pendente'`**, `created_at`. |
| 9 | Se `saqueError`, **500** “Erro ao criar saque”. |
|10 | **201** com JSON de sucesso e dados do saque (status na resposta como `'pending'`). |
| Exceção | `catch` genérico → **500**. |

**Função auxiliar relevante:** `PixValidator.prototype.validateWithdrawData` em **`utils/pix-validator.js`** (~478–524) — valida faixa de valor, chave PIX e “disponibilidade” da chave; **não** altera saldo.

---

## 3. Alteração real do saldo (sim ou não)

**Não.** No handler de `POST /api/withdraw/request` **não existe** chamada `supabase.from('usuarios').update(...)` nem débito de qualquer campo de saldo. O saldo é apenas **lido** para a comparação com `valor`.

---

## 4. Proteção contra concorrência

| Mecanismo | Presente no código? |
|-----------|----------------------|
| Lock otimista (ex.: `.eq('saldo', valorAtual)` no update) | **Não** — não há update de saldo. |
| Reserva / hold de valor | **Não**. |
| Transação de banco (BEGIN/COMMIT) envolvendo saldo + `saques` | **Não** no trecho analisado. |
| Idempotência (header ou chave única de pedido) | **Não**. |
| Serialização por usuário | **Não**. |

Duas requisições **paralelas** com o mesmo token podem ambas passar na checagem `saldo >= valor` (com o mesmo saldo lido antes de qualquer débito) e **inserir múltiplas linhas** em `saques`.

---

## 5. Riscos identificados

1. **Saldo não diminui** no pedido — o valor exibido como “disponível” no jogo continua o mesmo até algum processo externo (ou outro endpoint não analisado aqui) debitar.
2. **Corrida:** vários saques simultâneos podem gerar **soma de pedidos** acima do saldo **real** se todos forem aceitos com base só na leitura pontual.
3. **`valorLiquido`** não amarra o insert ao valor líquido após taxa no handler mostrado — risco de **ambiguidade operacional** (o que será pago vs o que foi pedido) depende de regras fora deste arquivo.
4. Dependência explícita de **“processador externo/contábil”** — se esse fluxo não existir ou não debitar saldo, o sistema fica **inconsistente** com a realidade financeira.

---

## 6. Classificação de risco

**CRÍTICO** para um produto em que o saldo em `usuarios` represente dinheiro disponível e o saque seja executado com base apenas neste endpoint: há **exposição direta** a pedidos múltiplos sobre o mesmo saldo e **ausência de débito/reserva** no momento da solicitação.

Se a operação real for **100% manual** (ex.: operador confere saldo em outra ferramenta antes de pagar) e a UI não prometer bloqueio imediato, o risco de **perda** recai sobre o processo — mas o **comportamento do código** permanece o descrito acima.

---

## Respostas objetivas às perguntas da missão

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | O saldo é debitado no momento do saque? | **Não.** |
| 2 | Existe algum tipo de reserva de saldo? | **Não** no handler analisado. |
| 3 | Existe lock otimista (ex.: `.eq('saldo', valorAtual)`)? | **Não** — não há update de saldo. |
| 4 | É possível múltiplos saques simultâneos com o mesmo saldo? | **Sim** — várias inserções em `saques` podem ocorrer sem reduzir saldo entre elas. |
| 5 | Em que momento o registro em `saques` é criado? | No **`insert`** após validações e leitura de saldo (~1456–1474); **após** a checagem `saldo >= valor`. |
| 6 | Existe rollback caso algo falhe? | **Não** há transação envolvendo saldo. Se o **`insert` falhar**, nada foi debitado (estado de saldo inalterado). Se o **`insert` for bem-sucedido**, não há operação anterior a reverter além do próprio insert (não há “meio caminho” de débito). |
| 7 | Existe idempotência? | **Não** evidenciada. |
| 8 | Existe proteção contra corrida? | **Não** no sentido de serializar ou debitar atomicamente o saldo. |

---

*Fim do relatório BLOCO A2.*
