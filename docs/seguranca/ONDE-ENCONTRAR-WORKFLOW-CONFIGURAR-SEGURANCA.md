# 📍 ONDE ENCONTRAR O WORKFLOW "🔒 Configurar Segurança Automática"

**Data:** 14 de Novembro de 2025  
**Versão:** 1.2.0

---

## 🎯 LOCALIZAÇÃO EXATA

### **Opção 1: Via Menu Lateral (Mais Fácil)**

1. Acesse: `https://github.com/indesconectavel/gol-de-ouro/actions`
2. No **menu lateral esquerdo**, role até encontrar:
   - `.github/workflows/configurar-seguranc...` (nome truncado)
   - Ou procure por qualquer workflow que comece com `configurar-seguranc`
3. **Clique** no workflow
4. Você verá a página do workflow com histórico de execuções
5. No canto superior direito, clique em **"Run workflow"**

---

### **Opção 2: Via Lista de Workflows**

1. Acesse: `https://github.com/indesconectavel/gol-de-ouro/actions`
2. No menu lateral esquerdo, você verá uma lista de workflows
3. Procure por: **`.github/workflows/configurar-seguranc...`**
   - O nome está truncado, mas é o único que começa com `configurar-seguranc`
4. **Clique** nele
5. Clique em **"Run workflow"**

---

### **Opção 3: Via URL Direta**

1. Acesse diretamente: `https://github.com/indesconectavel/gol-de-ouro/actions/workflows/configurar-seguranca.yml`
2. Clique em **"Run workflow"** (canto superior direito)

---

## 🔍 IDENTIFICAÇÃO VISUAL

### **Como Reconhecer:**

- **Nome no menu:** `.github/workflows/configurar-seguranc...` (truncado)
- **Nome completo:** `🔒 Configurar Segurança Automática`
- **Arquivo:** `.github/workflows/configurar-seguranca.yml`
- **Ícone:** Pode aparecer sem ícone especial ou com um ícone de configuração

---

## 📋 PASSOS DETALHADOS

### **Passo a Passo Completo:**

1. **Acesse o GitHub:**
   ```
   https://github.com/indesconectavel/gol-de-ouro
   ```

2. **Clique em "Actions"** (na barra de navegação superior)

3. **No menu lateral esquerdo**, você verá:
   ```
   Actions
   ├── All workflows
   ├── .github/workflows/configurar-seguranc...  ← ESTE É O WORKFLOW!
   ├── CI
   ├── Dependabot Updates
   ├── Deploy On Demand...
   ├── Rollback Automático...
   ├── Backend Deploy...
   ├── Frontend Deploy...
   ├── Health Monitor...
   ├── Monitoramento Avançado...
   ├── Pipeline Principal...
   ├── Segurança e Qualidade
   └── Testes Automatizados
   ```

4. **Clique** em `.github/workflows/configurar-seguranc...`

5. **Na página do workflow**, você verá:
   - Histórico de execuções
   - Botão **"Run workflow"** no canto superior direito

6. **Clique em "Run workflow"**

7. **Configure:**
   - Branch: `main` (já deve estar selecionado)
   - Clique em **"Run workflow"** (botão verde)

---

## ⚠️ SE NÃO ENCONTRAR

### **Possíveis Motivos:**

1. **Workflow ainda não apareceu:**
   - Aguarde alguns minutos após o commit
   - Recarregue a página (F5)

2. **Nome truncado:**
   - O nome pode estar muito longo e aparecer como `configurar-seguranc...`
   - Procure por qualquer workflow que comece com essas letras

3. **Filtro ativo:**
   - Verifique se há algum filtro ativo
   - Clique em "All workflows" para ver todos

---

## 🎯 ALTERNATIVA: EXECUTAR VIA API

Se não conseguir encontrar no GitHub, você pode executar via API:

```bash
# Usando curl (se tiver GITHUB_TOKEN configurado)
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/indesconectavel/gol-de-ouro/actions/workflows/configurar-seguranca.yml/dispatches \
  -d '{"ref":"main"}'
```

---

## ✅ VERIFICAÇÃO

Após executar, você verá:

1. Uma nova execução aparecendo na lista
2. Status: "In progress" (amarelo) ou "Success" (verde)
3. 3 jobs executando:
   - 🔒 Configurar Branch Protection
   - 🔍 Habilitar Secret Scanning
   - ✅ Verificar Configuração

---

## 📸 REFERÊNCIA VISUAL

Na imagem que você compartilhou, o workflow aparece como:
- **No menu lateral:** `.github/workflows/configurar-seguranc...`
- **Na lista de execuções:** `.github/workflows/configurar-seguranca.yml #6`

**Status atual:** O workflow #6 falhou, mas isso é normal se não tiver permissões. O importante é que ele existe e pode ser executado novamente!

---

## 🚀 PRÓXIMOS PASSOS

1. Encontre o workflow no menu lateral
2. Clique nele
3. Clique em "Run workflow"
4. Aguarde a execução
5. Verifique os logs para ver se configurou com sucesso

---

**Última atualização:** 14 de Novembro de 2025  
**Versão:** 1.0

