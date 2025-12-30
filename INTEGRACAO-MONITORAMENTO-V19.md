# 🔧 INTEGRAÇÃO DE MONITORAMENTO V19
## Como integrar monitoramento e heartbeat no server-fly.js
## Data: 2025-12-05

---

## 📋 PASSOS DE INTEGRAÇÃO

### 1. Adicionar Rotas de Monitoramento

No `server-fly.js`, após a linha onde as rotas são importadas (linha ~94), adicionar:

```javascript
// Importar rotas de monitoramento V19
const monitorRoutes = require('./src/modules/monitor/monitor.routes');
```

E depois, onde as rotas são registradas (após linha ~393), adicionar:

```javascript
// Rotas de monitoramento V19
app.use('/monitor', monitorRoutes);
app.use('/metrics', monitorRoutes);
```

### 2. Iniciar Heartbeat

No final da função `startServer()` (após linha ~800), adicionar:

```javascript
// Iniciar heartbeat sender V19
if (process.env.USE_DB_QUEUE === 'true') {
  const { startHeartbeat } = require('./src/scripts/heartbeat_sender');
  startHeartbeat();
  console.log('✅ [V19] Heartbeat sender iniciado');
}
```

### 3. Integrar Métricas Prometheus

No início do arquivo, após os imports (linha ~80), adicionar:

```javascript
// Métricas Prometheus V19
const { updateLotesAtivos, recordShot, recordReward, recordError5xx } = require('./src/modules/monitor/metrics');
```

E no método `shoot()` do GameController, após processar o chute, adicionar:

```javascript
// Registrar métricas
const latenciaMs = Date.now() - inicioProcessamento;
recordShot(resultado, valorAposta, latenciaMs);
if (premio > 0) {
  recordReward('normal', premio);
}
if (premioGolDeOuro > 0) {
  recordReward('gol_de_ouro', premioGolDeOuro);
}
```

### 4. Atualizar Métricas de Lotes Ativos

No método que sincroniza lotes ativos, adicionar:

```javascript
// Atualizar métrica de lotes ativos
const { data: lotesAtivos } = await supabaseAdmin
  .from('lotes')
  .select('id', { count: 'exact' })
  .eq('status', 'ativo');

updateLotesAtivos(lotesAtivos?.length || 0);
```

### 5. Registrar Erros 5xx

No middleware de tratamento de erros (linha ~928), adicionar:

```javascript
if (err.status >= 500) {
  recordError5xx();
}
```

---

## ✅ VERIFICAÇÃO

Após integrar, verificar:

1. **Endpoint /monitor:**
   ```bash
   curl http://localhost:8080/monitor
   ```

2. **Endpoint /metrics:**
   ```bash
   curl http://localhost:8080/metrics
   ```

3. **Heartbeat no banco:**
   ```sql
   SELECT * FROM system_heartbeat ORDER BY last_seen DESC LIMIT 5;
   ```

---

**Gerado em:** 2025-12-05  
**Versão:** V19.0.0

