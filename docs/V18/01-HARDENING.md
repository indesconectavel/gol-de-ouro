# 🔒 V18 HARDENING SUPREMO
## Data: 2025-12-05

## RLS (Row Level Security)

{
  "tabelas": {
    "usuarios": {
      "rls_habilitado": false,
      "status": "❌"
    },
    "transacoes": {
      "rls_habilitado": false,
      "status": "❌"
    },
    "chutes": {
      "rls_habilitado": false,
      "status": "❌"
    },
    "lotes": {
      "rls_habilitado": false,
      "status": "❌"
    },
    "pagamentos_pix": {
      "rls_habilitado": false,
      "status": "❌"
    }
  },
  "problemas": [
    "RLS não habilitado na tabela usuarios",
    "RLS não habilitado na tabela transacoes",
    "RLS não habilitado na tabela chutes",
    "RLS não habilitado na tabela lotes",
    "RLS não habilitado na tabela pagamentos_pix"
  ],
  "recomendacoes": [
    "ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE chutes ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE pagamentos_pix ENABLE ROW LEVEL SECURITY;"
  ]
}

## Índices

{
  "indices": {
    "idx_chutes_usuario_id": "❌",
    "idx_chutes_lote_id": "❌",
    "idx_chutes_created_at": "❌",
    "idx_transacoes_usuario_id": "❌",
    "idx_transacoes_created_at": "❌",
    "idx_lotes_status": "❌",
    "idx_lotes_valor_aposta": "❌",
    "idx_usuarios_email": "❌"
  },
  "faltando": [
    {
      "tabela": "chutes",
      "coluna": "usuario_id",
      "nome": "idx_chutes_usuario_id"
    },
    {
      "tabela": "chutes",
      "coluna": "lote_id",
      "nome": "idx_chutes_lote_id"
    },
    {
      "tabela": "chutes",
      "coluna": "created_at",
      "nome": "idx_chutes_created_at"
    },
    {
      "tabela": "transacoes",
      "coluna": "usuario_id",
      "nome": "idx_transacoes_usuario_id"
    },
    {
      "tabela": "transacoes",
      "coluna": "created_at",
      "nome": "idx_transacoes_created_at"
    },
    {
      "tabela": "lotes",
      "coluna": "status",
      "nome": "idx_lotes_status"
    },
    {
      "tabela": "lotes",
      "coluna": "valor_aposta",
      "nome": "idx_lotes_valor_aposta"
    },
    {
      "tabela": "usuarios",
      "coluna": "email",
      "nome": "idx_usuarios_email"
    }
  ],
  "recomendacoes": [
    "CREATE INDEX IF NOT EXISTS idx_chutes_usuario_id ON chutes(usuario_id);",
    "CREATE INDEX IF NOT EXISTS idx_chutes_lote_id ON chutes(lote_id);",
    "CREATE INDEX IF NOT EXISTS idx_chutes_created_at ON chutes(created_at);",
    "CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_id ON transacoes(usuario_id);",
    "CREATE INDEX IF NOT EXISTS idx_transacoes_created_at ON transacoes(created_at);",
    "CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes(status);",
    "CREATE INDEX IF NOT EXISTS idx_lotes_valor_aposta ON lotes(valor_aposta);",
    "CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);"
  ]
}

## Queries Lentas

{
  "queries": [],
  "recomendacoes": [
    "Instalar extensão pg_stat_statements para análise detalhada:",
    "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;",
    "",
    "Consultar queries lentas:",
    "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
  ]
}

## Race Conditions

{
  "riscos": [
    {
      "tipo": "Chutes simultâneos",
      "descricao": "Múltiplos chutes podem ser processados simultaneamente no mesmo lote",
      "mitigacao": "Usar SELECT FOR UPDATE ao obter lote"
    },
    {
      "tipo": "Atualização de saldo",
      "descricao": "Múltiplas transações podem atualizar saldo simultaneamente",
      "mitigacao": "Usar RPC functions com locks (já implementado)"
    }
  ],
  "recomendacoes": [
    "✅ RPC functions já implementadas com locks",
    "✅ FinancialService usa rpc_add_balance e rpc_deduct_balance",
    "⚠️ Verificar se getOrCreateLote usa SELECT FOR UPDATE"
  ]
}

## Corrupção de Memória

{
  "riscos": [
    {
      "tipo": "Lotes em memória",
      "descricao": "Lotes armazenados em Map() podem ser perdidos em reinicialização",
      "status": "⚠️ Mitigado parcialmente",
      "detalhes": "Sincronização ao iniciar, mas estado pode divergir"
    }
  ],
  "recomendacoes": [
    "✅ Sincronização implementada via syncActiveLotes()",
    "⚠️ Considerar migrar lotes completamente para banco",
    "⚠️ Implementar heartbeat para validar estado"
  ]
}

## Status: ✅ Verificação concluída
