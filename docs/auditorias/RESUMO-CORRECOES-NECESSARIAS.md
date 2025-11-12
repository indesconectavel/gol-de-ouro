# 🔍 RESUMO DE CORREÇÕES NECESSÁRIAS - GOL DE OURO

**Data:** 27 de Outubro de 2025  
**Versão:** 1.2.0  
**Status:** 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

---

## 📊 SUMÁRIO EXECUTIVO

Identificados **4 problemas críticos** que impedem o sistema de funcionar em produção:

1. ❌ **Fly.io:** Máquina falhando por falta de dependência `nodemailer`
2. ⚠️ **Supabase:** Projeto será pausado por inatividade + 22 warnings de performance
3. ⚠️ **GitHub Actions:** Health Monitor falhando (JÁ CORRIGIDO com retry logic)
4. ⚠️ **Vercel:** Erro 404 no goldeouro-player (JÁ CORRIGIDO com rewrites)

---

## 🔴 PROBLEMA 1: FLY.IO - MÁQUINA FALHANDO

### Erro Identificado

```
Error: Cannot find module 'nodemailer'
Require stack:
- /app/services/emailService.js
- /app/server-fly.js
```

### Causa

O arquivo `server-fly.js` importa `emailService.js`, que por sua vez requer `nodemailer`, mas essa dependência não está no `package-backend.json`.

### ✅ Correção Aplicada

Adicionei `nodemailer` às dependências no `package-backend.json`:

```json
"nodemailer": "^6.9.8"
```

### 🔄 Ação Necessária

**EXECUTAR NOVAMENTE O DEPLOY:**

```bash
flyctl deploy --app goldeouro-backend-v2 --config fly.toml
```

### ⚠️ Importante

Se o deploy anterior falhou por timeout de rede, pode ser necessário:

1. **Destruir e recriar a máquina:**
   ```bash
   flyctl machine destroy 784e673ce62508 --app goldeouro-backend-v2
   flyctl deploy --app goldeouro-backend-v2
   ```

2. **Ou forçar o replace:**
   ```bash
   flyctl deploy --app goldeouro-backend-v2 --force
   ```

---

## ⚠️ PROBLEMA 2: SUPABASE - PAUSA POR INATIVIDADE

### Aviso Recebido

Email do Supabase: "Your Supabase Project goldeouro-db is going to be paused"

### Detalhes

- **Projeto:** `goldeouro-db` (ID: uatszaqzdqcwnfbipoxg)
- **Motivo:** Inativo por mais de 7 dias
- **Prazo:** Será pausado em ~2 dias
- **Projeto Atual:** `goldeouro-production` (ID: gayopagjdrkcmkirmfvy)

### ✅ Soluções

#### Opção 1: Ativar o Projeto (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/uatszaqzdqcwnfbipoxg
2. Execute uma query simples:

```sql
SELECT COUNT(*) FROM usuarios;
```

3. O projeto será automaticamente ativado

#### Opção 2: Upgrade para Pro

1. Acesse: Supabase > Projects > goldeouro-production > Settings > Billing
2. Upgrade para Pro (evita pausa automática)

#### Opção 3: Migrar Tudo para goldeouro-production

Se `goldeouro-db` não é mais usado, migre tudo para `goldeouro-production`.

### 🔧 Correção de Warnings de Performance (22 warnings)

#### Auth RLS Initialization Plan

**Problema:** `auth.uid()`, `auth.role()`, e `current_setting()` sendo re-avaliadas para cada linha.

**Solução:** Usar funções `SECURITY DEFINER`:

```sql
-- Criar função otimizada
CREATE OR REPLACE FUNCTION public.auth_user_id() 
RETURNS TEXT AS $$
  SELECT auth.uid()::TEXT;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Atualizar policies para usar a função
DROP POLICY IF EXISTS "users_own_data" ON public.usuarios;
CREATE POLICY "users_own_data" ON public.usuarios
  FOR SELECT USING (id = public.auth_user_id());
```

#### Múltiplas Políticas Permissivas

**Problema:** Múltiplas políticas RLS para o mesmo role/action.

**Solução:** Consolidar em uma única política:

```sql
-- Remover duplicatas
DROP POLICY IF EXISTS "old_policy_name" ON public.usuarios;
```

---

## ⚠️ PROBLEMA 3: GITHUB ACTIONS - HEALTH MONITOR

### Status

✅ **CORRIGIDO** - Adicionei retry logic com 3 tentativas e timeout de 30s.

### Mudanças Aplicadas

```yaml
- name: Verificar backend (Fly.io)
  id: backend-check
  run: |
    # Retry logic: 3 tentativas com 30s de timeout cada
    for i in {1..3}; do
      STATUS_BACKEND=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 https://goldeouro-backend-v2.fly.dev/health)
      if [ "$STATUS_BACKEND" = "200" ]; then
        echo "✅ Backend online na tentativa $i"
        exit 0
      fi
      if [ $i -lt 3 ]; then
        sleep 10
      fi
    done
    exit 1
```

### Resultado Esperado

- Health Monitor será mais resiliente
- Vai aguardar máquina iniciar
- Retries automáticos

---

## ⚠️ PROBLEMA 4: VERCEL - ERRO 404

### Status

✅ **CORRIGIDO** - Adicionei rewrite para SPA no `vercel.json`.

### Mudanças Aplicadas

```json
{
  "rewrites": [
    {
      "source": "/download",
      "destination": "/download.html"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Resultado Esperado

- Rotas SPA funcionando
- Sem mais 404 em `goldeouro.lol`

### 🔄 Ação Necessária

**Realizar novo deploy no Vercel:**

```bash
cd goldeouro-player
git add vercel.json
git commit -m "fix: Adicionar rewrites para SPA"
git push origin main
```

Ou o Vercel vai fazer auto-deploy na próxima push.

---

## 📋 CHECKLIST DE AÇÕES

### Imediatas (Hoje)

- [ ] **Deploy do Backend:** Executar `flyctl deploy --app goldeouro-backend-v2`
- [ ] **Verificar máquina:** `flyctl status --app goldeouro-backend-v2`
- [ ] **Testar health check:** `curl https://goldeouro-backend-v2.fly.dev/health`
- [ ] **Deploy do Player:** Push para triggerar Vercel deploy
- [ ] **Ativar Supabase:** Executar query em `goldeouro-db` ou fazer upgrade

### Curto Prazo (Esta Semana)

- [ ] **Otimizar RLS:** Aplicar funções `SECURITY DEFINER`
- [ ] **Remover índices não usados** no Supabase
- [ ] **Adicionar índices faltantes** em foreign keys
- [ ] **Configurar alertas** no Fly.io, Supabase e Vercel
- [ ] **Documentar** arquitetura completa

### Médio Prazo (Este Mês)

- [ ] **Testes end-to-end** completos
- [ ] **Monitoramento** com alertas ativos
- [ ] **Backup automático** do Supabase
- [ ] **Documentação** de troubleshooting

---

## 🎯 RECOMENDAÇÕES PARA FINALIZAR O JOGO

### Prioridades Críticas

1. ✅ **Corrigir dependência faltante** (nodemailer)
2. ✅ **Configurar rewrites Vercel** (SPA)
3. ✅ **Retry logic no Health Monitor**
4. ⚠️ **Ativar Supabase** (executar query)
5. ⚠️ **Otimizar RLS** (funções SECURITY DEFINER)

### Próximos Passos Sugeridos

1. **Testar Backend Após Deploy:**
   ```bash
   # Aguardar deploy completar
   flyctl logs --app goldeouro-backend-v2
   
   # Testar health
   curl https://goldeouro-backend-v2.fly.dev/health
   ```

2. **Testar Player no Vercel:**
   - Verificar se 404 foi resolvido
   - Testar rotas principais
   - Verificar PWA funcionando

3. **Monitorar GitHub Actions:**
   - Verificar próxima execução do Health Monitor
   - Confirmar que passa com retry logic

4. **Otimizar Supabase:**
   - Executar SQL de otimização
   - Remover índices não usados
   - Adicionar índices faltantes

---

## 📊 STATUS ATUAL

| Serviço | Status | Ação Necessária |
|---------|--------|-----------------|
| Fly.io Backend | 🔴 Falhando | Deploy com nodemailer |
| Supabase goldeouro-db | ⚠️ Será pausado | Executar query ou upgrade |
| Supabase goldeouro-production | 🟡 Warnings | Otimizar RLS |
| GitHub Actions | ✅ Corrigido | Aguardar próxima execução |
| Vercel goldeouro-player | ✅ Corrigido | Push para triggerar deploy |
| Vercel goldeouro-admin | ✅ Funcionando | Nenhuma |

---

## 🚀 COMANDOS RESUMIDOS

```bash
# 1. Deploy backend corrigido
flyctl deploy --app goldeouro-backend-v2

# 2. Verificar status
flyctl status --app goldeouro-backend-v2

# 3. Ver logs
flyctl logs --app goldeouro-backend-v2

# 4. Testar health
curl https://goldeouro-backend-v2.fly.dev/health

# 5. Ativar Supabase (execute no Supabase SQL Editor)
SELECT COUNT(*) FROM usuarios;

# 6. Deploy Vercel (push)
cd goldeouro-player
git add .
git commit -m "fix: Adicionar rewrites SPA"
git push origin main
```

---

**Próxima Ação Recomendada:** Executar o deploy do backend corrigido.

---

*Documento gerado via IA e MCPs - 27/10/2025*
