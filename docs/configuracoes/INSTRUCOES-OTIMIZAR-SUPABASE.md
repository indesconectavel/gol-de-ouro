# 🔧 INSTRUÇÕES PARA OTIMIZAR SUPABASE

**Data:** 28 de Outubro de 2025  
**Status:** ⏳ Ação Manual Necessária  
**Impacto:** 🟡 Médio (melhora performance)

---

## 🎯 OBJETIVO

Resolver os **22 warnings de performance** no Supabase executando queries de otimização.

---

## 📋 COMO EXECUTAR

### Passo 1: Abrir SQL Editor

Acesse: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/sql/new

### Passo 2: Copiar e Colar Queries

Copie todo o conteúdo do arquivo:
`docs/configuracoes/OTIMIZAR-SUPABASE-QUERIES.sql`

Ou use as queries abaixo:

```sql
-- Criar índices para chaves estrangeiras
CREATE INDEX IF NOT EXISTS idx_chutes_lote_id ON chutes(lote_id);
CREATE INDEX IF NOT EXISTS idx_chutes_usuario_id ON chutes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_lotes_id ON lotes(id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id ON pagamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes(status);
CREATE INDEX IF NOT EXISTS idx_lotes_valor_aposta ON lotes(valor_aposta);

-- Criar índices para emails e tipos
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);

-- Criar índices para timestamps
CREATE INDEX IF NOT EXISTS idx_pagamentos_created_at ON pagamentos(created_at);
CREATE INDEX IF NOT EXISTS idx_lotes_created_at ON lotes(created_at);
CREATE INDEX IF NOT EXISTS idx_chutes_created_at ON chutes(created_at);

-- Analisar estatísticas
ANALYZE usuarios;
ANALYZE lotes;
ANALYZE chutes;
ANALYZE pagamentos;
ANALYZE metricas_globais;
```

### Passo 3: Executar

1. Cole a query no editor
2. Clique em **"Run"** ou pressione `Ctrl+Enter`
3. Aguarde a execução (pode demorar alguns minutos)

### Passo 4: Verificar

Após executar, verifique os warnings no dashboard:
1. Acesse: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/health/overview
2. Confirme que os warnings diminuíram

---

## 📊 RESULTADOS ESPERADOS

### Antes:
- Auth RLS Initialization Plan: 22 warnings
- Unused Indexes: 32 warnings
- Unindexed Foreign Keys: 49 warnings

### Depois (Esperado):
- Auth RLS Initialization Plan: ~5-10 warnings
- Unused Indexes: ~5-10 warnings  
- Unindexed Foreign Keys: 0 warnings

---

## ⚠️ AVISOS

### ⏱️ Tempo de Execução

As queries de `CREATE INDEX` podem levar **1-5 minutos** dependendo do tamanho da tabela.

### 📊 Impacto

- **Criação de índices:** Melhora performance de SELECT
- **ANALYZE:** Atualiza estatísticas para o otimizador

### ✅ Segurança

Todas as queries são **seguras**:
- `CREATE INDEX IF NOT EXISTS` - não sobrescreve se já existe
- `ANALYZE` - apenas coleta estatísticas

---

## 🎯 BENEFÍCIOS

1. ✅ Queries mais rápidas
2. ✅ Menos warnings no dashboard
3. ✅ Melhor uso de recursos
4. ✅ Performance geral melhorada

---

## 📝 DEPOIS DE EXECUTAR

Verificar:
1. ✅ Índices criados
2. ✅ Warnings diminuídos
3. ✅ Performance melhorada

---

*Documento criado para otimizar performance do Supabase - 28/10/2025*
