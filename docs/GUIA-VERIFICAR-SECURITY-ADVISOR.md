# 🔍 GUIA: VERIFICAR SECURITY ADVISOR

## 📋 PASSO A PASSO

### **1. Acessar Security Advisor**

1. Abrir Supabase Dashboard
2. Selecionar projeto: `goldeouro-production`
3. No menu lateral, clicar em **"Security Advisor"** (ícone de escudo)
4. Ou acessar diretamente: `https://supabase.com/dashboard/project/[PROJECT_ID]/advisors/security`

---

### **2. Verificar Warnings**

Na página do Security Advisor, verificar:

#### **A. Errors (Vermelho)**
- Deve estar em **0 errors**
- Se houver erros, documentar

#### **B. Warnings (Laranja)**
- Verificar quantidade de warnings
- Esperado: **0-1 warnings** (apenas Postgres Version, se houver)
- Warnings esperados para desaparecer:
  - ✅ Function Search Path Mutable (`update_global_metrics`, `update_user_stats`)
  - ✅ RLS Enabled No Policy (`AuditLog`)

#### **C. Info (Azul)**
- Verificar sugestões informativas
- Geralmente não críticas

---

### **3. Documentar Resultado**

Criar documento com:
- Data/Hora da verificação
- Quantidade de Errors
- Quantidade de Warnings
- Lista de warnings restantes (se houver)
- Status: ✅ Resolvido ou ⚠️ Pendente

---

## ✅ RESULTADO ESPERADO

**Após execução dos scripts:**

- ✅ **Errors:** 0
- ✅ **Warnings:** 0-1 (apenas Postgres Version, se houver)
- ✅ **Info:** Variável (não crítico)

**Warnings que devem desaparecer:**
- ✅ Function Search Path Mutable → **RESOLVIDO** (funções não existem)
- ✅ RLS Enabled No Policy → **RESOLVIDO** (tabela não existe)

---

## 📝 TEMPLATE DE DOCUMENTAÇÃO

```markdown
# Verificação Security Advisor - [DATA]

**Data/Hora:** [DATA/HORA]
**Projeto:** goldeouro-production

## Resultados:

- **Errors:** [NÚMERO]
- **Warnings:** [NÚMERO]
- **Info:** [NÚMERO]

## Warnings Restantes:

[Listar warnings, se houver]

## Status:

✅ Resolvido / ⚠️ Pendente
```

---

**Ação:** Executar manualmente no Supabase Dashboard

