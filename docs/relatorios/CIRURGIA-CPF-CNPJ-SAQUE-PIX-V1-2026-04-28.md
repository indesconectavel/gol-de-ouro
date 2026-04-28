# CIRURGIA CPF/CNPJ SAQUE PIX V1 - 2026-04-28

## 1) Arquivos alterados
- `database/migrations/20260428_add_cpf_cnpj_usuarios.sql`
- `server-fly.js`
- `src/domain/payout/processPendingWithdrawals.js`
- `goldeouro-player/src/pages/Withdraw.jsx`

## 2) SQL criado
- Migration aditiva criada em `database/migrations/20260428_add_cpf_cnpj_usuarios.sql` com:
  - `ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT`
  - constraints de segurança:
    - somente dígitos (`usuarios_cpf_cnpj_digits_chk`)
    - comprimento 11 ou 14 (`usuarios_cpf_cnpj_len_chk`)
  - índice parcial `usuarios_cpf_cnpj_idx`
  - instrução documentada para preenchimento controlado do QA (`testev1@gmail.com`) após aplicar migration.

## 3) Regra backend aplicada
- Em `POST /api/withdraw/request` (`server-fly.js`):
  - para chave Pix `email`, `phone`/`telefone` e `random`/`aleatoria`, agora exige `usuarios.cpf_cnpj` válido (11 ou 14 dígitos).
  - se ausente/inválido, retorna:
    - `"Para solicitar saque com essa chave Pix, cadastre seu CPF ou CNPJ."`
  - esta validação ocorre antes do débito.
- Em `GET /api/user/profile`, o campo `cpf_cnpj` passa a ser retornado.
- Em `PUT /api/user/profile`, `cpf_cnpj` pode ser atualizado (somente 11 ou 14 dígitos), mantendo atualização parcial segura.

## 4) Ajuste frontend aplicado
- Em `goldeouro-player/src/pages/Withdraw.jsx`:
  - quando a chave é `email`, `phone` ou `random`, exibe campo obrigatório de `CPF/CNPJ`.
  - valida formato mínimo (11 ou 14 dígitos).
  - sincroniza documento via endpoint existente `PUT /api/user/profile` antes de solicitar o saque.
  - bloqueia submissão sem documento válido para esses tipos de chave.

## 5) Confirmação de que depósito não foi alterado
- Nenhum arquivo/rota de depósito foi alterado.
- Não houve alteração em webhook de depósito, reconciliação de depósito, nem em `claim_and_credit_approved_pix_deposit`.

## 6) Confirmação de não débito/ledger sem documento
- A nova guarda de documento no backend ocorre antes de:
  - débito de `usuarios.saldo`
  - `insert` em `saques`
  - `createLedgerEntry` (`saque`/`taxa`)
- Resultado: sem documento válido, a operação falha cedo com erro claro e sem impacto financeiro.

## 7) Risco financeiro final
- **BAIXO** após aplicação da migration + publicação do backend/frontend:
  - elimina criação de saques inviáveis por falta de documento do titular;
  - mantém regras já existentes de idempotência e ledger.

## 8) Plano de rollback
- Se necessário rollback:
  1. Reverter frontend para ocultar o campo (opcional).
  2. Reverter regra backend de obrigatoriedade (opcional).
  3. Manter coluna `usuarios.cpf_cnpj` sem uso (rollback não destrutivo recomendado).
- Evitar rollback destrutivo de schema em produção.

## 9) Pendência operacional controlada (saque atual)
- Conforme escopo, **não** foi feito reprocessamento manual do saque.
- Após aplicar migration no banco de produção, executar preenchimento QA:
  - `UPDATE public.usuarios SET cpf_cnpj = '<CPF_OU_CNPJ_APENAS_DIGITOS>', updated_at = NOW() WHERE email = 'testev1@gmail.com';`
- Em seguida, deixar o `payout_worker` processar normalmente.
