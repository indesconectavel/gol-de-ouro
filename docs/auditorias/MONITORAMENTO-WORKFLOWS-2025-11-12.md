# 📊 Monitoramento de Workflows GitHub Actions
**Data:** 12 de Novembro de 2025  
**Commit:** `720d91b` - Correções críticas nos workflows

---

## 🎯 Workflows Acionados pelo Push

### ✅ Workflows que DEVEM ser acionados:

#### 1. **🚀 Pipeline Principal - Gol de Ouro** (`main-pipeline.yml`)
**Trigger:** `push` em `main`  
**Status Esperado:** ✅ Deve executar  
**Tempo Estimado:** 5-10 minutos

**Jobs:**
- `build-and-deploy`: Build e deploy completo

**Validações:**
- ✅ `FLY_APP_NAME` especificado corretamente
- ✅ `working-directory` para frontend especificado
- ✅ Deploy backend com app correto
- ✅ Deploy frontend no diretório correto

**URL para Monitorar:**
```
https://github.com/indesconectavel/gol-de-ouro/actions/workflows/main-pipeline.yml
```

---

#### 2. **CI** (`ci.yml`)
**Trigger:** `push` em `main`  
**Status Esperado:** ✅ Deve executar  
**Tempo Estimado:** 2-5 minutos

**Jobs:**
- `build-and-audit`: Smoke test e auditoria de segurança
- `backend-check`: Verificação de estrutura

**Validações:**
- ✅ Sem duplicação de definição
- ✅ Dois jobs válidos
- ✅ Verificações atualizadas

**URL para Monitorar:**
```
https://github.com/indesconectavel/gol-de-ouro/actions/workflows/ci.yml
```

---

#### 3. **CI/CD Pipeline - Gol de Ouro v2.0** (`ci-cd.yml`)
**Trigger:** `push` em `main`  
**Status Esperado:** ⚠️ Pode executar (mas pode falhar se estrutura esperada não existir)  
**Tempo Estimado:** 3-7 minutos

**Observação:** Este workflow espera estrutura `backend/` e `frontend/`, mas o projeto usa estrutura diferente.

**URL para Monitorar:**
```
https://github.com/indesconectavel/gol-de-ouro/actions/workflows/ci-cd.yml
```

---

### ⏸️ Workflows que NÃO devem ser acionados:

#### 4. **🚀 Backend Deploy (Fly.io)** (`backend-deploy.yml`)
**Trigger:** `push` em `main` com mudanças em paths específicos  
**Status Esperado:** ⏸️ NÃO deve executar  
**Razão:** Mudanças foram apenas em `.github/workflows/ci.yml` e `main-pipeline.yml`, não nos paths monitorados

**Paths Monitorados:**
- `server-fly.js`
- `package.json`
- `package-lock.json`
- `Dockerfile`
- `fly.toml`
- `config/**`
- `controllers/**`
- `middlewares/**`
- `services/**`
- `scripts/**`
- `.github/workflows/backend-deploy.yml` (mas não mudamos este arquivo)

---

## 📋 Checklist de Monitoramento

### ✅ Verificações Imediatas (0-5 minutos após push):

- [ ] Verificar se `main-pipeline.yml` iniciou execução
- [ ] Verificar se `ci.yml` iniciou execução
- [ ] Verificar se não há erros de sintaxe nos workflows

### ✅ Verificações Durante Execução (5-15 minutos):

- [ ] `ci.yml` - Job `build-and-audit` completou com sucesso
- [ ] `ci.yml` - Job `backend-check` completou com sucesso
- [ ] `main-pipeline.yml` - Build do projeto completou
- [ ] `main-pipeline.yml` - Deploy backend iniciou (se aplicável)
- [ ] `main-pipeline.yml` - Deploy frontend iniciou (se aplicável)

### ✅ Verificações Finais (15-20 minutos):

- [ ] Todos os workflows completaram sem erros
- [ ] Deploy backend bem-sucedido (se executado)
- [ ] Deploy frontend bem-sucedido (se executado)
- [ ] Health check passou após deploy

---

## 🔍 Como Monitorar

### Opção 1: GitHub Actions UI
1. Acesse: https://github.com/indesconectavel/gol-de-ouro/actions
2. Procure pelo commit `720d91b`
3. Clique em cada workflow para ver detalhes

### Opção 2: GitHub CLI (se disponível)
```bash
gh run list --workflow=main-pipeline.yml --limit 5
gh run list --workflow=ci.yml --limit 5
gh run watch
```

### Opção 3: API do GitHub
```bash
# Listar runs recentes
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/indesconectavel/gol-de-ouro/actions/runs
```

---

## ⚠️ Possíveis Problemas e Soluções

### Problema 1: Workflow não iniciou
**Causa Possível:** Erro de sintaxe YAML  
**Solução:** Verificar logs do GitHub Actions

### Problema 2: Deploy falhou
**Causa Possível:** Secrets não configurados ou app name incorreto  
**Solução:** Verificar secrets e `FLY_APP_NAME`

### Problema 3: Build falhou
**Causa Possível:** Dependências ou estrutura do projeto  
**Solução:** Verificar logs de build

---

## 📊 Status Esperado dos Workflows

| Workflow | Status Esperado | Tempo Estimado | Prioridade |
|----------|----------------|----------------|------------|
| `ci.yml` | ✅ Sucesso | 2-5 min | Alta |
| `main-pipeline.yml` | ✅ Sucesso | 5-10 min | Alta |
| `ci-cd.yml` | ⚠️ Pode falhar | 3-7 min | Baixa |
| `backend-deploy.yml` | ⏸️ Não executa | - | N/A |

---

## ✅ Validações das Correções

### Correção 1: `ci.yml` sem duplicação
**Validação:** Workflow deve executar sem erros de sintaxe  
**Indicador de Sucesso:** Job `build-and-audit` completa

### Correção 2: `FLY_APP_NAME` no `main-pipeline.yml`
**Validação:** Deploy deve usar `goldeouro-backend-v2`  
**Indicador de Sucesso:** Logs mostram `--app goldeouro-backend-v2`

### Correção 3: `working-directory` no deploy frontend
**Validação:** Deploy deve executar no diretório `goldeouro-player`  
**Indicador de Sucesso:** Logs mostram execução no diretório correto

---

## 📝 Notas

- ⏰ Workflows geralmente iniciam em 1-2 minutos após push
- 🔄 Se um workflow falhar, o `rollback.yml` pode ser acionado automaticamente
- 📊 Health Monitor executa a cada 30 minutos (não relacionado a este push)
- 🔒 Secrets devem estar configurados no GitHub para deploys funcionarem

---

**Última atualização:** 12 de Novembro de 2025, 17:30  
**Próxima verificação recomendada:** 5 minutos após push

