# E2E Withdraw/Ledger — Automação

Script e npm script para rodar o E2E de saque/ledger em produção e gerar relatório, sem passos manuais repetitivos.

## Pré-requisitos

- Node 18+
- `flyctl` no PATH (opcional; se ausente, o relatório registra "flyctl missing" e continua)
- Credenciais: BEARER (JWT) e PIX_KEY para executar o saque real (sem elas o veredito será INCONCLUSIVO)

## Como setar envs no PowerShell

Antes de rodar o E2E, defina no **mesmo terminal**:

```powershell
$env:BEARER = "Bearer <SEU_JWT_AQUI>"
$env:PIX_KEY = "sua_chave_pix@email.com"
$env:PIX_KEY_TYPE = "email"
$env:WITHDRAW_AMOUNT = "10"
```

- **BEARER:** obrigatório; deve começar com `Bearer ` + token JWT (nunca cole o token em documentos).
- **PIX_KEY:** obrigatório para o saque ser chamado; use email/CPF/telefone válido (evite test@test.com).
- **PIX_KEY_TYPE:** opcional; valores: `email`, `cpf`, `phone`, `random`.
- **WITHDRAW_AMOUNT:** opcional; padrão 10 (valor mínimo).

## Como rodar

```bash
npm run test-withdraw-e2e
```

Ou diretamente:

```bash
node scripts/e2e-withdraw-ledger.js
```

O script executa: precheck frontend (/ e /game), health backend, fly status, assert de envs, chamada a `create-test-withdraw-live.js`, coleta de logs do Fly (app + payout_worker), filtro por termos relevantes (SAQUE, LEDGER, Erro ao registrar ledger, insert falhou, 22P02, uuid, rollback, etc.) e contagens que incluem "Erro ao registrar ledger" e "[LEDGER] insert falhou", e gera um relatório em `docs/relatorios/`. O script tenta **--since 15m** quando o flyctl suporta; em flyctl antigo faz fallback automático para **--no-tail**.

## Onde fica o relatório

Arquivo gerado:

```
docs/relatorios/E2E-WITHDRAW-LEDGER-AUTO-<YYYY-MM-DD>-<HHmmss>.md
```

Exemplo: `E2E-WITHDRAW-LEDGER-AUTO-2026-03-05-143022.md`

O próprio script imprime no console o caminho do relatório e o veredito (PASS/FAIL/INCONCLUSIVO).

## Como limpar envs (PowerShell)

Após o teste, remova as variáveis para não deixar credenciais no shell:

```powershell
Remove-Item Env:BEARER -ErrorAction SilentlyContinue
Remove-Item Env:PIX_KEY -ErrorAction SilentlyContinue
Remove-Item Env:PIX_KEY_TYPE -ErrorAction SilentlyContinue
Remove-Item Env:WITHDRAW_AMOUNT -ErrorAction SilentlyContinue
```

O script **não** remove as envs do processo pai; ele apenas imprime essa instrução ao final.

## Como interpretar PASS / FAIL / INCONCLUSIVO

| Veredito | Significado |
|----------|-------------|
| **PASS** | Saque retornou `saqueId` e `success: true`; logs não contêm 22P02 nem "invalid input syntax for type uuid". Fluxo ledger ok. |
| **FAIL** | Detectado 22P02/uuid inválido no ledger, ou "Erro ao registrar ledger" / "[LEDGER] insert falhou" nos logs, ou a API retornou `success: false` (incl. statusCode 500). Ver relatório e logs filtrados para causa. |
| **INCONCLUSIVO (sem credenciais)** | BEARER ou PIX_KEY não estavam definidos; o saque não foi chamado. Defina as envs e execute novamente. |
| **INCONCLUSIVO** | Resultado ambíguo (ex.: sem credenciais ou resposta não classificável). |

## Segurança

- O script **nunca** imprime BEARER/JWT nem PIX_KEY completa.
- No relatório e no console aparecem apenas BEARER=OK/MISSING e PIX_KEY=OK/MISSING (e PIX_KEY_TYPE / WITHDRAW_AMOUNT quando não sensíveis).
- Nenhum token é escrito em arquivos em `docs/`.

## Rastreabilidade

- Cada execução gera um **RunId** e **timestamp ISO** no relatório.
- O script é versionado no repositório (`scripts/e2e-withdraw-ledger.js`).
- O relatório é salvo com data e hora no nome do arquivo.
