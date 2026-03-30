-- BLOCO L - Consentimento juridico auditavel
-- Data: 2026-03-30
-- Objetivo: adicionar campos de consentimento sem quebrar usuarios legados

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN,
  ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS accepted_terms_ip TEXT,
  ADD COLUMN IF NOT EXISTS accepted_terms_version TEXT,
  ADD COLUMN IF NOT EXISTS is_adult_confirmed BOOLEAN;

COMMENT ON COLUMN public.usuarios.accepted_terms IS 'Usuario aceitou termos e politica no cadastro';
COMMENT ON COLUMN public.usuarios.accepted_terms_at IS 'Timestamp de aceite de termos/politica';
COMMENT ON COLUMN public.usuarios.accepted_terms_ip IS 'IP capturado no momento do aceite';
COMMENT ON COLUMN public.usuarios.accepted_terms_version IS 'Versao do termo aceita no cadastro';
COMMENT ON COLUMN public.usuarios.is_adult_confirmed IS 'Usuario declarou ser maior de 18 anos';
