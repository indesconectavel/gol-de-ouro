# 🚀 V16 SQL RÁPIDO - FECHAR LOTES ATIVOS
## Execute este SQL no Supabase Dashboard

```sql
-- Fechar todos os lotes ativos
UPDATE lotes 
SET status = 'finalizado', updated_at = now()
WHERE status = 'ativo';
```

## Verificar resultado

```sql
SELECT COUNT(*) FROM lotes WHERE status = 'ativo';
```

Se retornar `0`, está tudo certo! ✅

