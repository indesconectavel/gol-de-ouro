# 📋 FASE 3 — BLOCO C1: GUIA DE VALIDAÇÃO MANUAL
## Passo a Passo para Validações que Requerem Ação Manual

**Data:** 19/12/2025  
**Hora:** 18:45:00  
**Status:** 🔄 **AGUARDANDO EXECUÇÃO MANUAL**

---

## ✅ ETAPAS JÁ VALIDADAS (AUTOMÁTICAS)

### **C1.1 — Healthcheck Backend** ✅ **APROVADO**
- Status HTTP: 200
- Database: connected
- Mercado Pago: connected
- Versão: 1.2.0

### **C1.7 — Logs e Estabilidade** ✅ **APROVADO**
- Sistema estável
- Nenhum erro crítico
- Apenas avisos esperados

---

## 📋 ETAPAS QUE REQUEREM EXECUÇÃO MANUAL

### **🔹 ETAPA C1.2 — CADASTRO E LOGIN REAL**

#### **Passo 1: Acessar Player Web**

1. Abrir navegador
2. Acessar URL do Player (fornecida pelo Vercel após deploy)
3. Verificar se página carrega sem erros
4. Abrir Console do navegador (F12 → Console)
5. Verificar se não há erros críticos

**✅ Critério de Sucesso:** Página carrega, sem erros no console

---

#### **Passo 2: Criar Usuário Real**

1. Clicar em "Cadastrar" ou "Registrar"
2. Preencher formulário:
   - Nome completo: `________________________`
   - Email válido: `________________________` (use email real, não de teste)
   - Senha: `________________________` (mínimo 6 caracteres)
   - Aceitar termos de uso: ✅
3. Clicar em "Cadastrar"
4. Verificar mensagem de sucesso

**✅ Critério de Sucesso:** Usuário criado com sucesso, redirecionamento funciona

**📝 Registrar em `docs/FASE-3-C1-VALIDACAO-IMEDIATA-EVIDENCIAS.md`:**
- Email usado: `________________________`
- Status: ✅ OK / ❌ ERRO

---

#### **Passo 3: Fazer Login**

1. Fazer login com o usuário criado
2. Verificar redirecionamento para dashboard
3. Verificar se token é armazenado:
   - F12 → Application → Local Storage → `authToken`
   - Copiar token (primeiros 20 caracteres)

**✅ Critério de Sucesso:** Login funciona, token armazenado, dashboard carrega

**📝 Registrar em `docs/FASE-3-C1-VALIDACAO-IMEDIATA-EVIDENCIAS.md`:**
- Token gerado: ✅ SIM / ❌ NÃO
- Token (primeiros 20 caracteres): `________________________`

---

### **🔹 ETAPA C1.3 — CRIAÇÃO DE PIX REAL**

#### **Passo 1: Navegar para Página de Pagamentos**

1. No Player Web, navegar para "Recarregar" ou "Pagamentos"
2. Verificar se página carrega corretamente

---

#### **Passo 2: Criar PIX Real**

1. Selecionar valor: **R$ 1,00** ou **R$ 5,00** (preferencialmente R$ 1,00)
2. Clicar em "Gerar PIX" ou "Criar Pagamento"
3. Aguardar resposta do backend
4. Verificar se QR Code aparece (se aplicável)
5. Verificar se dados do PIX aparecem:
   - Payment ID
   - Valor
   - Status inicial

**✅ Critério de Sucesso:** PIX gerado com sucesso, QR Code aparece, dados corretos

**📝 Registrar em `docs/FASE-3-C1-VALIDACAO-IMEDIATA-EVIDENCIAS.md`:**
- Valor do PIX: R$ `________________________`
- Payment ID: `________________________`
- QR Code gerado: ✅ SIM / ❌ NÃO
- Status inicial: `________________________`

---

### **🔹 ETAPA C1.4 — CONFIRMAÇÃO NO BANCO**

#### **Passo 1: Acessar Supabase Dashboard**

1. Acessar Supabase Dashboard
2. Ir para projeto: `goldeouro-production`
3. Ir para SQL Editor

---

#### **Passo 2: Executar Query SQL (Somente SELECT)**

**Query:**
```sql
SELECT 
  id,
  usuario_id,
  valor,
  status,
  payment_id,
  created_at
FROM pagamentos_pix
WHERE usuario_id = (
  SELECT id FROM usuarios WHERE email = 'SEU_EMAIL_AQUI'
)
ORDER BY created_at DESC
LIMIT 1;
```

**Substituir:** `SEU_EMAIL_AQUI` pelo email usado no cadastro

---

#### **Passo 3: Validar Resultado**

**Validações:**
- ✅ PIX encontrado no banco
- ✅ Valor correto
- ✅ Status inicial correto (deve ser "pending" ou "aguardando")
- ✅ Vínculo com usuário correto

**📝 Registrar em `docs/FASE-3-C1-VALIDACAO-IMEDIATA-EVIDENCIAS.md`:**
- PIX encontrado: ✅ SIM / ❌ NÃO
- ID do PIX: `________________________`
- Valor no banco: R$ `________________________`
- Status no banco: `________________________`

---

### **🔹 ETAPA C1.5 — ATUALIZAÇÃO DE SALDO**

**⚠️ NOTA:** Esta etapa requer que o PIX seja pago. Se não for possível pagar o PIX agora, esta etapa pode ser pulada ou marcada como "N/A - PIX não pago".

#### **Passo 1: Pagar PIX (Se Aplicável)**

1. Usar aplicativo do banco para pagar o PIX gerado
2. Aguardar confirmação do pagamento
3. Aguardar webhook do Mercado Pago (pode levar alguns minutos)

---

#### **Passo 2: Verificar Saldo Atualizado**

1. No Player Web, verificar se saldo foi atualizado
2. Verificar se transação aparece no histórico

---

#### **Passo 3: Executar Query SQL (Somente SELECT)**

**Query:**
```sql
SELECT 
  id,
  usuario_id,
  tipo,
  valor,
  saldo_anterior,
  saldo_posterior,
  created_at
FROM transacoes
WHERE usuario_id = (
  SELECT id FROM usuarios WHERE email = 'SEU_EMAIL_AQUI'
)
ORDER BY created_at DESC
LIMIT 5;
```

**Validações:**
- ✅ Transação encontrada
- ✅ Saldo atualizado corretamente
- ✅ Consistência lógica (crédito)

**📝 Registrar em `docs/FASE-3-C1-VALIDACAO-IMEDIATA-EVIDENCIAS.md`:**
- Saldo atualizado: ✅ SIM / ❌ NÃO
- Transação registrada: ✅ SIM / ❌ NÃO

---

### **🔹 ETAPA C1.6 — EXECUÇÃO DO JOGO**

**⚠️ NOTA:** Esta etapa requer saldo disponível. Se não houver saldo, pode ser necessário pagar o PIX primeiro ou usar saldo existente.

#### **Passo 1: Entrar em um LOTE**

1. No Player Web, navegar para página do jogo
2. Selecionar valor da aposta (R$ 1, 2, 5 ou 10)
3. Verificar se LOTE é criado ou usado

---

#### **Passo 2: Executar Tentativa de Jogo**

1. Selecionar direção do chute (TL, TR, C, BL, BR)
2. Clicar em "Chutar" ou "Jogar"
3. Aguardar resposta do backend
4. Verificar resultado (gol ou defesa)

**✅ Critério de Sucesso:** Jogo executa, saldo consumido, tentativa registrada

**📝 Registrar em `docs/FASE-3-C1-VALIDACAO-IMEDIATA-EVIDENCIAS.md`:**
- Jogo executa: ✅ SIM / ❌ NÃO
- Saldo consumido: ✅ SIM / ❌ NÃO
- Tentativa registrada: ✅ SIM / ❌ NÃO
- Resultado: `________________________`

---

## 📊 CHECKLIST DE VALIDAÇÃO

### **Validações Automáticas (Já Concluídas):**
- [x] C1.1 - Healthcheck Backend ✅
- [x] C1.7 - Logs e Estabilidade ✅

### **Validações Manuais (Aguardando):**
- [ ] C1.2 - Cadastro e Login Real
- [ ] C1.3 - Criação de PIX Real
- [ ] C1.4 - Confirmação no Banco
- [ ] C1.5 - Atualização de Saldo (se PIX pago)
- [ ] C1.6 - Execução do Jogo (se saldo disponível)

---

## 📄 PRÓXIMOS PASSOS

Após completar todas as validações manuais:

1. ✅ Preencher `docs/FASE-3-C1-VALIDACAO-IMEDIATA-EVIDENCIAS.md`
2. ✅ Atualizar `docs/FASE-3-C1-VALIDACAO-IMEDIATA-EXECUCAO.md`
3. ✅ Preencher `docs/FASE-3-C1-RESUMO-EXECUTIVO.md` com decisão final
4. ✅ Declarar status final (APTO / APTO COM RESSALVAS / NÃO APTO)

---

**Documento criado em:** 2025-12-19T18:45:00.000Z  
**Status:** 🔄 **AGUARDANDO EXECUÇÃO MANUAL**

