# 🎯 PRÓXIMOS PASSOS - AUTOMAÇÃO SUPABASE V19

**Data:** 2025-12-11  
**Status Atual:** ✅ Sistema criado e executado (95% funcional)

---

## 📋 CHECKLIST DE AÇÕES NECESSÁRIAS

### 🔐 1. CONFIGURAR CREDENCIAIS PRODUCTION

**Problema:** Testes em production estão falhando com "Invalid API key"

**Ação:**
1. Verificar se existe arquivo `.env` na raiz do projeto
2. Adicionar ou atualizar a variável:
   ```env
   SUPABASE_PRODUCTION_SERVICE_ROLE_KEY=sua_chave_service_role_production_aqui
   ```
3. Ou usar a mesma chave de staging se for a mesma:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
   ```

**Como obter a chave:**
- Acessar: https://app.supabase.com
- Selecionar projeto **goldeouro-production**
- Settings → API → Service Role Key (secret)

**Validação:**
```bash
node automation/teste_pix_v19.js production
```

---

### 🔧 2. CORRIGIR ASSINATURAS DOS RPCs

**Problema:** Alguns RPCs têm assinaturas diferentes do esperado nos testes

**RPCs com problemas identificados:**
- `rpc_register_webhook_event` - Assinatura diferente
- `rpc_get_or_create_lote` - Assinatura diferente
- `rpc_register_reward` - Assinatura diferente
- `rpc_get_user_rewards` - Assinatura diferente
- `rpc_mark_reward_credited` - Assinatura diferente

**Ação:**
1. Verificar assinaturas reais dos RPCs no Supabase:
   ```sql
   SELECT 
     p.proname as function_name,
     pg_get_function_arguments(p.oid) as arguments
   FROM pg_proc p
   JOIN pg_namespace n ON p.pronamespace = n.oid
   WHERE n.nspname = 'public'
     AND p.proname LIKE 'rpc_%'
   ORDER BY p.proname;
   ```

2. Ajustar os scripts de teste em:
   - `automation/teste_pix_v19.js`
   - `automation/teste_premiacao_v19.js`

3. Ou criar RPCs wrapper com as assinaturas esperadas

**Validação:**
```bash
node automation/teste_pix_v19.js staging
node automation/teste_premiacao_v19.js staging
```

---

### 📊 3. APLICAR MIGRATIONS MANUALMENTE (SE NECESSÁRIO)

**Problema:** Aplicação automática de migrations requer execução manual

**Ação:**
1. Verificar diferenças entre staging e production:
   ```bash
   node automation/validation_suite.js
   ```

2. Se houver diferenças, aplicar migration manualmente:
   - Acessar Supabase Dashboard → SQL Editor
   - Selecionar projeto (staging ou production)
   - Copiar conteúdo de `database/migration_v19/PRODUCAO_CORRECAO_INCREMENTAL_V19.sql`
   - Executar no SQL Editor

3. Validar após aplicação:
   ```bash
   node automation/full_audit_v19.js
   ```

---

### ✅ 4. VALIDAR SEGURANÇA COMPLETA

**Ação:**
1. Verificar funções sem `SET search_path`:
   ```bash
   node automation/pipeline_staging.js
   node automation/pipeline_production.js
   ```

2. Revisar relatório de segurança nos logs:
   - `logs/v19/automation/pipeline_staging_results_*.json`
   - `logs/v19/automation/pipeline_production_results_*.json`

3. Corrigir funções se necessário (adicionar `SET search_path = public, pg_catalog;`)

---

### 🧪 5. EXECUTAR TESTES COMPLETOS

**Ação:**
1. Executar suite completa de testes:
   ```bash
   node automation/executar_v19.js
   ```

2. Revisar resultados:
   - Logs em `logs/v19/automation/`
   - Relatório em `RELATORIO_FINAL_AUDITORIA_V19.md`

3. Corrigir problemas encontrados

4. Reexecutar até todos os testes passarem

---

### 📝 6. GERAR RELATÓRIO FINAL

**Ação:**
1. Executar auditoria completa:
   ```bash
   node automation/full_audit_v19.js
   ```

2. Verificar relatório gerado:
   - `RELATORIO_FINAL_AUDITORIA_V19.md`

3. Revisar:
   - Status geral
   - Diferenças encontradas
   - Correções aplicadas
   - Status pós-correção
   - Testes PIX e Premiação
   - Hashes dos backups

---

### 🔄 7. SINCRONIZAR AMBIENTES

**Objetivo:** Garantir que staging e production estejam 100% iguais

**Ação:**
1. Comparar ambientes:
   ```bash
   node automation/validation_suite.js
   ```

2. Identificar diferenças:
   - Tabelas faltantes
   - RPCs faltantes
   - Índices faltantes
   - Constraints faltantes

3. Aplicar correções incrementalmente:
   - Usar `PRODUCAO_CORRECAO_INCREMENTAL_V19.sql` como base
   - Aplicar apenas o que falta em cada ambiente

4. Validar sincronização:
   ```bash
   node automation/full_audit_v19.js
   ```

---

### 🚀 8. AUTOMATIZAR EXECUÇÃO PERIÓDICA

**Ação:**
1. Criar script de agendamento (cron job ou task scheduler):
   ```bash
   # Executar diariamente às 2h da manhã
   0 2 * * * cd /caminho/do/projeto && node automation/executar_v19.js >> logs/cron.log 2>&1
   ```

2. Ou criar GitHub Action para execução automática:
   - Criar `.github/workflows/supabase-audit.yml`
   - Configurar para executar semanalmente

3. Configurar alertas:
   - Enviar email se houver falhas
   - Notificar Slack/Discord se houver problemas críticos

---

### 📚 9. DOCUMENTAR PROCESSOS

**Ação:**
1. Documentar fluxo completo de uso
2. Criar guia de troubleshooting
3. Documentar procedimentos de rollback
4. Criar runbook para operações comuns

---

### 🎯 10. VALIDAÇÃO FINAL

**Checklist de Validação:**
- [ ] Credenciais production configuradas
- [ ] Todos os RPCs funcionando corretamente
- [ ] Migrations aplicadas (se necessário)
- [ ] Segurança validada (SET search_path em todas as funções)
- [ ] Testes PIX passando (staging e production)
- [ ] Testes Premiação passando (staging e production)
- [ ] Ambientes sincronizados (staging = production)
- [ ] Relatório final gerado e revisado
- [ ] Backups funcionando corretamente
- [ ] Logs sendo gerados corretamente

**Comando de validação final:**
```bash
node automation/executar_v19.js
```

---

## 🎯 PRIORIDADES

### 🔴 ALTA PRIORIDADE (Fazer primeiro)
1. ✅ Configurar credenciais production
2. ✅ Corrigir assinaturas dos RPCs
3. ✅ Validar segurança completa

### 🟡 MÉDIA PRIORIDADE (Fazer em seguida)
4. ✅ Aplicar migrations se necessário
5. ✅ Executar testes completos
6. ✅ Sincronizar ambientes

### 🟢 BAIXA PRIORIDADE (Fazer depois)
7. ✅ Gerar relatório final
8. ✅ Automatizar execução periódica
9. ✅ Documentar processos

---

## 📞 COMANDOS ÚTEIS

### Executar tudo
```bash
node automation/executar_v19.js
```

### Executar apenas auditoria
```bash
node automation/full_audit_v19.js
```

### Executar pipeline específico
```bash
node automation/pipeline_staging.js
node automation/pipeline_production.js
```

### Executar testes específicos
```bash
node automation/teste_pix_v19.js staging
node automation/teste_pix_v19.js production
node automation/teste_premiacao_v19.js staging
node automation/teste_premiacao_v19.js production
```

### Validar estrutura V19
```bash
node automation/validation_suite.js
```

---

## 📁 ARQUIVOS IMPORTANTES

- **Configuração:** `.supabase/config.json`
- **Migration:** `database/migration_v19/PRODUCAO_CORRECAO_INCREMENTAL_V19.sql`
- **Relatório:** `RELATORIO_FINAL_AUDITORIA_V19.md`
- **Logs:** `logs/v19/automation/`
- **Backups:** `backup/estruturas/` e `backup/dumps/`

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **Nunca executar TRUNCATE, DROP TABLE ou DELETE** - Todas as operações são não-destrutivas
2. **Todas as migrations são idempotentes** - Podem ser executadas múltiplas vezes
3. **Backups são criados automaticamente** antes de qualquer operação crítica
4. **Logs detalhados** são salvos em `logs/v19/automation/`
5. **Relatórios JSON** são gerados para análise posterior

---

**Última atualização:** 2025-12-11  
**Próxima revisão:** Após completar itens de alta prioridade

