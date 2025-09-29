# RA3 - PLANO MÍNIMO PARA CORREÇÃO DA API

## Problemas Identificados

1. **Endpoints /health e /readiness não respondem**
2. **Headers de segurança não aplicados**
3. **Rate limiting desabilitado**

## Plano Mínimo (1-3 linhas)

### 1. Adicionar endpoints de saúde no router.js
```javascript
// Linha 14-21: Adicionar após health existente
router.get('/readiness', (req, res) => {
  res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
});
```

### 2. Forçar helmet em produção no server-render-fix.js
```javascript
// Linha 60: Alterar para sempre habilitado em produção
const ENABLE_HELMET = process.env.NODE_ENV === 'production' || process.env.ENABLE_HELMET !== 'false';
```

### 3. Habilitar rate limiting em produção no server-render-fix.js
```javascript
// Linha 61: Alterar para habilitado em produção
const ENABLE_RATE_LIMIT = process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMIT === 'true';
```

## Impacto
- ✅ Endpoints de saúde funcionando
- ✅ Headers de segurança ativos
- ✅ Rate limiting ativo em produção
- ✅ Melhoria na segurança geral
