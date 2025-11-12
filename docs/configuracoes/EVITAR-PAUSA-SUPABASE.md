# ⚠️ EVITAR PAUSA DO SUPABASE

**Data:** 28 de Outubro de 2025  
**Urgência:** 🔴 ALTA - Pausa iminente em ~2 dias  
**Status:** ⚠️ AÇÃO NECESSÁRIA

---

## 🎯 PROBLEMA

O projeto Supabase (`goldeouro-db`) será **pausado automaticamente** em aproximadamente **2 dias** devido a **7+ dias sem atividade**.

**URL do Projeto:** https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy

---

## ✅ SOLUÇÃO RÁPIDA

### Método 1: Via SQL Editor (Mais Rápido)

1. **Acesse:** https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/sql/new

2. **Cole a query:**
```sql
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM metricas_globais;
SELECT COUNT(*) FROM lotes;
SELECT COUNT(*) FROM chutes;
SELECT COUNT(*) FROM pagamentos;
```

3. **Clique em:** "Run" ou pressione `Ctrl+Enter`

4. **Resultado esperado:** 
   - Query executada com sucesso
   - Projeto marcado como ativo

### Método 2: Via API (Automático)

Executar esta query periodicamente (diariamente) para manter o projeto ativo:

```bash
# Substitua YOUR_SUPABASE_URL e YOUR_SERVICE_KEY
curl 'YOUR_SUPABASE_URL/rest/v1/usuarios?select=count' \
  -H "apikey: YOUR_SERVICE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

### Método 3: Via Código (Mais Confiável)

Adicionar endpoint de "keep-alive" no backend:

```javascript
// server-fly.js - Adicionar rota
app.get('/api/health/supabase', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ [SUPABASE] Erro:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar Supabase'
      });
    }
    
    console.log('✅ [SUPABASE] Query executada com sucesso');
    res.status(200).json({
      success: true,
      message: 'Supabase ativo'
    });
  } catch (error) {
    console.error('❌ [SUPABASE] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar Supabase'
    });
  }
});
```

---

## 🔄 PREVENÇÃO FUTURA

### Opção 1: Keep-Alive Automático (Recomendado)

Adicionar rota `/api/health/supabase` no backend e chamar periodicamente via GitHub Actions:

```yaml
# .github/workflows/supabase-keepalive.yml
name: Supabase Keep-Alive

on:
  schedule:
    - cron: '0 */6 * * *'  # A cada 6 horas
  workflow_dispatch:

jobs:
  keepalive:
    runs-on: ubuntu-latest
    steps:
      - name: Query Supabase
        run: |
          curl -s https://goldeouro-backend-v2.fly.dev/api/health/supabase
```

### Opção 2: Upgrade de Plano

Considerar upgrade para plano que não pausa automaticamente:

- **Free Plan:** Pausa após 7 dias de inatividade
- **Pro Plan:** Nunca pausa (R$ 29/mês)

---

## 🎯 AÇÃO IMEDIATA RECOMENDADA

**Execute AGORA:**

1. Acesse: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/sql/new
2. Cole e execute a query abaixo
3. Pronto! Projeto não será pausado

```sql
SELECT COUNT(*) FROM usuarios;
```

---

## 📊 WARNINGS DE PERFORMANCE

Além da pausa, há **22 warnings de performance** que devem ser corrigidos:

### Warnings Identificados

1. **Auth RLS Initialization Plan (22x)**
   - Problema: Queries lentas de autenticação
   - Solução: Criar função otimizada

2. **Unused Indexes (32x)**
   - Problema: Índices não utilizados
   - Solução: Remover índices não utilizados

3. **Unindexed Foreign Keys (49x)**
   - Problema: Chaves estrangeiras sem índice
   - Solução: Adicionar índices

### Query de Otimização

```sql
-- Criar função otimizada para RLS
CREATE OR REPLACE FUNCTION public.auth_user_id() 
RETURNS TEXT AS $$
  SELECT auth.uid()::TEXT;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Otimizar policies existentes
CREATE POLICY "users_own_data" ON public.usuarios
  FOR SELECT USING (id = public.auth_user_id());
```

---

## ⚠️ URGÊNCIA

**PRAZO:** ~2 dias para executar a query  
**CONSEQUÊNCIA:** Projeto pausado = Backend offline  
**AÇÃO:** Executar query AGORA

---

## ✅ CHECKLIST

- [ ] Acessar SQL Editor
- [ ] Executar query `SELECT COUNT(*) FROM usuarios;`
- [ ] Confirmar que funcionou
- [ ] Configurar keep-alive automático (opcional)
- [ ] Corrigir warnings de performance (opcional)

---

*Documento gerado para evitar pausa do Supabase - 28/10/2025*
