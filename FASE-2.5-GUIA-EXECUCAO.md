# 🚀 FASE 2.5 — GUIA DE EXECUÇÃO DE TESTES FUNCIONAIS
## Passo a Passo para Executar Testes em Staging

**Data:** 18/12/2025  
**Versão:** 1.0

---

## 📋 PREPARAÇÃO

### **1. Verificar Ambiente**

```bash
# Verificar se Engine V19 está rodando
curl https://goldeouro-backend-v2.fly.dev/health

# Verificar se UI Player está deployada
curl https://staging-player.goldeouro.lol

# Verificar se UI Admin está deployada
curl https://staging-admin.goldeouro.lol
```

### **2. Preparar Credenciais de Teste**

**Player:**
- Email: `teste.player@example.com`
- Senha: `senha123`
- Saldo inicial: R$ 50,00

**Admin:**
- Email: `admin@example.com`
- Senha: `admin123`

### **3. Instalar Ferramentas**

- [ ] Navegador Chrome/Firefox atualizado
- [ ] DevTools habilitado
- [ ] Extensão de captura de tela
- [ ] Postman/Insomnia (opcional)

---

## 🧪 EXECUTANDO TESTES

### **Passo 1: Abrir DevTools**

1. Abrir navegador
2. Pressionar `F12` ou `Ctrl+Shift+I`
3. Abrir abas:
   - **Console** - Para ver logs
   - **Network** - Para ver requisições
   - **Application** - Para ver localStorage

### **Passo 2: Limpar Cache**

1. Abrir DevTools
2. Clicar com botão direito no botão de refresh
3. Selecionar "Limpar cache e atualizar forçadamente"

### **Passo 3: Executar Teste**

1. Seguir passos do teste específico em `FASE-2.5-PLANO-TESTES-FUNCIONAIS.md`
2. Registrar evidências usando `FASE-2.5-TEMPLATE-REGISTRO-EVIDENCIAS.md`
3. Marcar checklist em `FASE-2.5-CHECKLIST-TESTES-MANUAIS.md`

### **Passo 4: Capturar Evidências**

**Screenshots:**
- Tirar screenshot de cada tela importante
- Salvar em `evidencias/[categoria]/[teste-id]-[numero].png`

**Logs:**
- Copiar logs relevantes do Console
- Salvar em `evidencias/[categoria]/[teste-id]-logs.txt`

**Network:**
- Exportar requisições relevantes
- Salvar em `evidencias/[categoria]/[teste-id]-network.json`

---

## 📊 REGISTRANDO RESULTADOS

### **Para Cada Teste:**

1. **Preencher Template de Evidências**
   - Usar `FASE-2.5-TEMPLATE-REGISTRO-EVIDENCIAS.md`
   - Preencher todos os campos
   - Anexar evidências

2. **Atualizar Checklist**
   - Marcar teste como ✅ Passou | ❌ Falhou | ⚠️ Bloqueado
   - Adicionar observações

3. **Registrar Problemas**
   - Descrever problema encontrado
   - Classificar como Crítico | Alto | Médio | Baixo
   - Sugerir solução

---

## 🔍 VALIDANDO ADAPTADORES

### **Como Verificar se Adaptadores Estão Funcionando**

#### **authAdapter**
```javascript
// No Console do navegador
// Verificar se token está armazenado
localStorage.getItem('authToken')

// Verificar se renovação automática funciona
// Observar Network tab quando token expira
```

#### **gameAdapter**
```javascript
// Verificar validação de saldo
// Tentar chutar com saldo insuficiente
// Verificar se requisição não foi feita

// Verificar contador global
// Comparar valor exibido com resposta do backend
```

#### **paymentAdapter**
```javascript
// Verificar polling automático
// Observar Network tab após criar pagamento
// Verificar requisições periódicas GET /api/payments/pix/status
```

---

## 📝 GERANDO RELATÓRIO FINAL

### **Passo 1: Consolidar Resultados**

1. Revisar todos os templates de evidências
2. Consolidar estatísticas
3. Listar problemas encontrados
4. Calcular taxas de sucesso

### **Passo 2: Preencher Relatório GO/NO-GO**

1. Usar `FASE-2.5-RELATORIO-GO-NO-GO.md`
2. Preencher todas as seções
3. Incluir evidências relevantes
4. Tomar decisão GO/NO-GO

### **Passo 3: Revisar e Aprovar**

1. Revisar relatório completo
2. Validar decisão
3. Obter aprovação
4. Documentar próximos passos

---

## ⚠️ TROUBLESHOOTING

### **Problema: Teste não executa**

**Solução:**
1. Verificar se ambiente está rodando
2. Verificar credenciais
3. Limpar cache
4. Verificar console para erros

### **Problema: Adaptador não funciona**

**Solução:**
1. Verificar se adaptador está importado
2. Verificar console para erros
3. Verificar Network tab para requisições
4. Comparar com código fonte

### **Problema: Evidências não capturam**

**Solução:**
1. Verificar permissões de arquivo
2. Verificar espaço em disco
3. Usar formato alternativo
4. Documentar manualmente

---

## ✅ CHECKLIST FINAL

Antes de considerar testes concluídos:

- [ ] Todos os testes críticos executados
- [ ] Todas as evidências capturadas
- [ ] Todos os templates preenchidos
- [ ] Checklist atualizado
- [ ] Relatório GO/NO-GO gerado
- [ ] Decisão tomada e documentada
- [ ] Próximos passos definidos

---

**GUIA DE EXECUÇÃO CONCLUÍDO** ✅

