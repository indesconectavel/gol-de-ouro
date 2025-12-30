# 🎯 RECOMENDAÇÃO DE VERSÃO - POSTGRESQL PARA BACKUP SUPABASE
## Versão Recomendada para pg_dump

**Data:** 19/12/2025  
**Contexto:** Backup do Supabase (goldeouro-production)  
**Objetivo:** Instalar pg_dump compatível e estável

---

## ✅ RECOMENDAÇÃO OFICIAL

### **Versão Recomendada: PostgreSQL 16.11**

**Justificativa:**

1. ✅ **Versão LTS (Long Term Support):** Suporte de longo prazo garantido
2. ✅ **Estabilidade:** Versão estável e testada em produção
3. ✅ **Compatibilidade:** Totalmente compatível com Supabase (que usa PostgreSQL 15/16)
4. ✅ **pg_dump atualizado:** Versão mais recente do pg_dump com melhor performance
5. ✅ **Suporte:** Versão amplamente suportada pela comunidade

---

## 📊 COMPARAÇÃO DE VERSÕES DISPONÍVEIS

| Versão | Tipo | Recomendação | Motivo |
|--------|------|--------------|--------|
| **18.1** | ⚠️ Mais recente | ⚠️ Não recomendado | Muito nova, pode ter bugs |
| **17.7** | ⚠️ Recente | ⚠️ Não recomendado | Menos testada em produção |
| **16.11** | ✅ LTS | ✅ **RECOMENDADO** | Estável, LTS, compatível |
| **15.15** | ✅ LTS | ✅ Alternativa | Estável, LTS, compatível |
| **14.20** | ⚠️ Antiga | ❌ Não recomendado | Versão antiga |
| **13.23** | ❌ Muito antiga | ❌ Não recomendado | Versão muito antiga |

---

## 🎯 DECISÃO FINAL

### **Instalar: PostgreSQL 16.11 (Windows x86-64)**

**Por quê:**
- ✅ Versão LTS mais recente disponível
- ✅ Totalmente compatível com Supabase
- ✅ Estável e testada em produção
- ✅ Suporte de longo prazo garantido
- ✅ pg_dump mais eficiente

---

## 📋 INSTRUÇÕES DE INSTALAÇÃO

### **Passo 1: Download**

1. **Na página do EDB:**
   - Localizar linha: **PostgreSQL 16.11**
   - Coluna: **Windows x86-64**
   - **Clicar no ícone de download** (ícone azul de download)

2. **Arquivo baixado:**
   - Nome: `postgresql-16.11-x64.exe` (ou similar)
   - Tamanho: ~200-300 MB

---

### **Passo 2: Instalação**

1. **Executar instalador** como Administrador
2. **Seguir wizard:**
   - ✅ **Installation Directory:** Manter padrão (`C:\Program Files\PostgreSQL\16`)
   - ✅ **Select Components:** 
     - ✅ **PostgreSQL Server** (opcional, mas recomendado)
     - ✅ **Command Line Tools** ⚠️ **OBRIGATÓRIO**
     - ✅ **pgAdmin 4** (opcional, útil para gerenciamento)
   - ✅ **Data Directory:** Manter padrão
   - ✅ **Password:** Definir senha para usuário `postgres` (anotar para uso local)
   - ✅ **Port:** Manter `5432`
   - ✅ **Locale:** Manter padrão

3. **Durante instalação:**
   - ✅ **Marcar:** "Add PostgreSQL bin directory to PATH"
   - ✅ Isso permite usar `pg_dump` diretamente no PowerShell

---

### **Passo 3: Validação**

**Após instalação, abrir NOVO PowerShell:**

```powershell
# Verificar versão do pg_dump
pg_dump --version
# Deve retornar: pg_dump (PostgreSQL) 16.11

# Verificar versão do pg_restore
pg_restore --version
# Deve retornar: pg_restore (PostgreSQL) 16.11

# Verificar localização
Get-Command pg_dump
# Deve retornar: C:\Program Files\PostgreSQL\16\bin\pg_dump.exe
```

**✅ Se todos os comandos funcionarem → INSTALAÇÃO CONCLUÍDA**

---

## ⚠️ ALTERNATIVA: PostgreSQL 15.15

**Se preferir versão mais conservadora:**

- ✅ **PostgreSQL 15.15** também é uma excelente escolha
- ✅ Versão LTS estável e amplamente testada
- ✅ Totalmente compatível com Supabase
- ✅ Instalação idêntica ao PostgreSQL 16

**Diferença:** PostgreSQL 16 tem melhorias de performance, mas 15.15 é igualmente estável.

---

## 🚨 IMPORTANTE

### **Compatibilidade com Supabase**

**Supabase usa PostgreSQL 15 ou 16** em produção. Portanto:

- ✅ **PostgreSQL 16.11:** ✅ **100% Compatível**
- ✅ **PostgreSQL 15.15:** ✅ **100% Compatível**
- ⚠️ **PostgreSQL 17/18:** ⚠️ Pode funcionar, mas não testado oficialmente
- ❌ **PostgreSQL 14 ou anterior:** ❌ Versões antigas, não recomendadas

---

## ✅ CHECKLIST DE INSTALAÇÃO

- [ ] Download do PostgreSQL 16.11 (Windows x86-64)
- [ ] Instalação executada como Administrador
- [ ] Command Line Tools marcado durante instalação
- [ ] "Add to PATH" marcado durante instalação
- [ ] Novo PowerShell aberto após instalação
- [ ] `pg_dump --version` funciona
- [ ] `pg_restore --version` funciona

---

## 📋 PRÓXIMOS PASSOS APÓS INSTALAÇÃO

1. ✅ Validar instalação (`pg_dump --version`)
2. ✅ Coletar credenciais do Supabase Dashboard
3. ✅ Executar comando de backup
4. ✅ Validar backup (`pg_restore --list`)

---

**Documento criado em:** 2025-12-19T16:40:00.000Z  
**Status:** ✅ **RECOMENDAÇÃO DEFINIDA: PostgreSQL 16.11**

