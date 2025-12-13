# 📦 STATUS DE BACKUPS - PRÉ APK REAL TEST

**Data:** 2025-01-12  
**Tag Git:** pre_apk_real_test  
**Timestamp:** Gerando...

---

## ✅ ETAPA 0 - BACKUPS (OBRIGATÓRIO)

### 1. Backup do Repositório Git

**Status:** ⏳ Pendente  
**Ação:** Criar commit e tag `pre_apk_real_test`

**Comandos executados:**
```bash
# Será executado após validação
```

---

### 2. Backup Supabase

**Status:** ⏳ Pendente  
**Ação:** Criar dumps completos do schema e tabelas críticas

**Tabelas críticas para backup:**
- [ ] users
- [ ] balances
- [ ] transactions
- [ ] lotes
- [ ] rewards
- [ ] webhook_events

**Localização dos dumps:**
- `backup/dumps/PROD/pre_apk_real_test/`

---

### 3. Variáveis de Ambiente

**Status:** ⏳ Verificando...

**Variáveis críticas:**
- [ ] `SUPABASE_URL_PROD`
- [ ] `SUPABASE_SERVICE_ROLE_KEY_PROD`
- [ ] `SUPABASE_ANON_KEY_PROD`
- [ ] PIX credentials (produção)

**Nota:** Variáveis sensíveis NÃO serão documentadas aqui por segurança.

---

## 📝 OBSERVAÇÕES

- Todos os backups devem ser criados ANTES de qualquer build ou teste
- Manter histórico completo de todas as operações
- Documentar qualquer problema encontrado

---

**Última atualização:** 2025-01-12

