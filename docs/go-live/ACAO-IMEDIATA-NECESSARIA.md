# ⚡ AÇÃO IMEDIATA NECESSÁRIA - GO-LIVE

**Data:** 13 de Novembro de 2025  
**Hora:** 20:35 UTC  
**Prioridade:** 🔴 **CRÍTICA**

---

## 🚨 AÇÕES URGENTES (FAZER AGORA)

### **1. Executar Script SQL no Supabase** 🔴 **5 MINUTOS**

**Por que é crítico:**
- 8 tabelas com RLS desabilitado = vulnerabilidade de segurança crítica
- Dados podem ser acessados sem autenticação adequada
- Bloqueador para GO-LIVE

**Como fazer:**
1. Acessar: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/sql/new
2. Abrir arquivo: `database/corrigir-rls-supabase-completo.sql`
3. Copiar TODO o conteúdo do arquivo
4. Colar no SQL Editor do Supabase
5. Clicar em "Run" (ou F5)
6. Aguardar execução (deve levar alguns segundos)
7. Verificar no Security Advisor:
   - Acessar: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/advisors/security
   - Deve mostrar **0 erros** (antes eram 8)

**Verificação:**
- ✅ Security Advisor mostra 0 erros
- ✅ Todas as tabelas têm políticas RLS

---

### **2. Fazer Deploy do Frontend** 🔴 **5 MINUTOS**

**Por que é crítico:**
- Site está dando 404 porque build estava falhando
- Correções foram aplicadas mas precisam ser deployadas
- Bloqueador para GO-LIVE

**Como fazer:**
```bash
cd goldeouro-player
npx vercel --prod --yes
```

**Verificação:**
- ✅ Build passa sem erros
- ✅ Deploy completo
- ✅ Site acessível em https://goldeouro.lol (sem 404)

---

### **3. Verificar Domínio no Vercel** 🔴 **5 MINUTOS**

**Por que é crítico:**
- Domínio pode não estar configurado
- SSL pode não estar ativo
- Bloqueador para GO-LIVE

**Como fazer:**
1. Acessar: https://vercel.com/goldeouro-admins-projects/goldeouro-player/settings/domains
2. Verificar se "goldeouro.lol" está na lista de domínios
3. Se NÃO estiver:
   - Clicar em "Add Domain"
   - Digitar "goldeouro.lol"
   - Seguir instruções de DNS (se necessário)
4. Verificar se SSL está ativo (deve estar automaticamente)

**Verificação:**
- ✅ Domínio configurado
- ✅ SSL ativo (cadeado verde no navegador)
- ✅ Site acessível em https://goldeouro.lol

---

## ⏱️ TEMPO TOTAL ESTIMADO: 15 MINUTOS

Após essas 3 ações, o jogo estará **pronto para GO-LIVE básico**.

---

## ✅ VERIFICAÇÃO FINAL

Após executar as 3 ações acima, verificar:

1. ✅ Site acessível: https://goldeouro.lol (sem 404)
2. ✅ Security Advisor: 0 erros
3. ✅ Build do Vercel: Sucesso
4. ✅ SSL: Ativo e válido

---

**Status:** 🔴 **AGUARDANDO EXECUÇÃO DAS 3 AÇÕES**

