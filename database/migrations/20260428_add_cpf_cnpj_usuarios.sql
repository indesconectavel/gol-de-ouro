-- V1 - Cirurgia CPF/CNPJ para saque Pix
-- Objetivo: permitir owner.identification no payout Pix para chaves email/telefone/aleatoria.
-- Escopo: aditivo, sem alterar lógica de depósito.

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;

COMMENT ON COLUMN public.usuarios.cpf_cnpj IS
  'Documento fiscal do titular para payout Pix (somente números: CPF 11 ou CNPJ 14).';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usuarios_cpf_cnpj_digits_chk'
      AND conrelid = 'public.usuarios'::regclass
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_cpf_cnpj_digits_chk
      CHECK (
        cpf_cnpj IS NULL
        OR cpf_cnpj ~ '^[0-9]+$'
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usuarios_cpf_cnpj_len_chk'
      AND conrelid = 'public.usuarios'::regclass
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_cpf_cnpj_len_chk
      CHECK (
        cpf_cnpj IS NULL
        OR length(cpf_cnpj) IN (11, 14)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS usuarios_cpf_cnpj_idx
  ON public.usuarios (cpf_cnpj)
  WHERE cpf_cnpj IS NOT NULL;

-- Preenchimento controlado solicitado (QA):
-- UPDATE public.usuarios
-- SET cpf_cnpj = '<CPF_OU_CNPJ_APENAS_DIGITOS>', updated_at = NOW()
-- WHERE email = 'testev1@gmail.com';
