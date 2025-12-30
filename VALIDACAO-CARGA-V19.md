# 🧪 VALIDAÇÃO DE CARGA - ENGINE V19
## Data: 2025-12-07
## Versão: V19.0.0

---

## ⚠️ IMPORTANTE

**Este documento descreve os caminhos recomendados para testes de carga.**

**NÃO execute estes testes até:**
1. Migration V19 aplicada
2. Validações básicas passando
3. Ambiente de staging/teste disponível
4. Autorização explícita

---

## 🎯 CENÁRIOS DE TESTE

### Cenário 1: 100 Jogadores Simultâneos

**Objetivo:** Validar sistema sob carga moderada

**Configuração:**
- 100 usuários únicos
- Cada usuário faz 10 chutes
- Total: 1.000 chutes
- Tempo: 5 minutos

**Endpoints a Testar:**
- `POST /api/auth/login` - Login de 100 usuários
- `POST /api/games/shoot` - 1.000 chutes
- `GET /api/user/profile` - Consultas de perfil
- `GET /monitor` - Monitoramento durante carga

**Métricas a Observar:**
- Latência média de resposta
- Taxa de erro (deve ser < 1%)
- Uso de memória
- Uso de CPU
- Conexões ao banco
- Heartbeat funcionando

**Script de Teste Sugerido:**
```javascript
// Exemplo usando Artillery ou k6
// Não executar até migration aplicada
```

**Critérios de Sucesso:**
- ✅ Latência média < 500ms
- ✅ Taxa de erro < 1%
- ✅ Sem vazamentos de memória
- ✅ Heartbeat funcionando
- ✅ Todos os chutes persistidos

---

### Cenário 2: 10.000 Chutes

**Objetivo:** Validar persistência e performance sob alta carga

**Configuração:**
- 50 usuários únicos
- Cada usuário faz 200 chutes
- Total: 10.000 chutes
- Tempo: 30 minutos

**Endpoints a Testar:**
- `POST /api/games/shoot` - 10.000 chutes
- `GET /monitor` - Monitoramento contínuo
- `GET /metrics` - Métricas Prometheus

**Métricas a Observar:**
- Taxa de persistência (deve ser 100%)
- Latência de escrita no banco
- Tamanho da tabela `chutes`
- Tamanho da tabela `lotes`
- Índices funcionando corretamente

**Validações:**
- [ ] Todos os 10.000 chutes foram persistidos
- [ ] Lotes foram criados/atualizados corretamente
- [ ] Recompensas foram creditadas corretamente
- [ ] Transações financeiras foram registradas
- [ ] Sem inconsistências nos dados

**Critérios de Sucesso:**
- ✅ 100% dos chutes persistidos
- ✅ Latência média < 1s
- ✅ Sem erros de integridade
- ✅ Índices funcionando (queries rápidas)

---

### Cenário 3: 1.000 Partidas (Lotes)

**Objetivo:** Validar sistema de lotes sob carga

**Configuração:**
- Criar 1.000 lotes únicos
- Cada lote com 10 chutes
- Total: 10.000 chutes distribuídos em 1.000 lotes
- Tempo: 1 hora

**Endpoints a Testar:**
- `POST /api/games/shoot` - 10.000 chutes
- `GET /monitor` - Monitoramento de lotes ativos
- Queries diretas ao banco para validar lotes

**Validações:**
- [ ] 1.000 lotes criados corretamente
- [ ] Cada lote tem exatamente 10 chutes
- [ ] Lotes completados corretamente
- [ ] Recompensas distribuídas corretamente
- [ ] Sem lotes órfãos ou inconsistentes

**Queries de Validação:**
```sql
-- Contar lotes criados
SELECT COUNT(*) FROM lotes WHERE created_at > NOW() - INTERVAL '1 hour';

-- Verificar lotes completos
SELECT COUNT(*) FROM lotes WHERE status = 'completed';

-- Verificar chutes por lote
SELECT lote_id, COUNT(*) as chutes_count 
FROM chutes 
GROUP BY lote_id 
HAVING COUNT(*) != 10;
```

**Critérios de Sucesso:**
- ✅ 1.000 lotes criados
- ✅ Todos os lotes têm 10 chutes
- ✅ Lotes completados corretamente
- ✅ Sem inconsistências

---

### Cenário 4: Stress da Queue (Sistema Antigo - Referência)

**⚠️ NOTA:** Sistema de fila não é mais usado (sistema atual usa lotes)

**Objetivo:** Validar que sistema antigo não interfere

**Configuração:**
- Tentar usar endpoints de fila antigos
- Verificar que não causam problemas

**Endpoints a Testar:**
- `POST /api/fila/entrar` - Não deve existir ou retornar 404
- `POST /api/fila/chutar` - Não deve existir ou retornar 404

**Validações:**
- [ ] Endpoints de fila não estão registrados
- [ ] Não causam erros no sistema
- [ ] Sistema de lotes funciona independentemente

---

## 📊 MÉTRICAS A COLETAR

### Métricas do Servidor

- **CPU Usage:** Deve ficar < 80%
- **Memory Usage:** Deve ficar < 2GB
- **Response Time (p50):** < 200ms
- **Response Time (p95):** < 500ms
- **Response Time (p99):** < 1s
- **Error Rate:** < 1%
- **Throughput:** Chutes por segundo

### Métricas do Banco

- **Conexões Ativas:** < 50
- **Queries por Segundo:** Monitorar
- **Tamanho das Tabelas:** Monitorar crescimento
- **Índices:** Verificar uso
- **Locks:** Verificar deadlocks

### Métricas de Negócio

- **Chutes Processados:** Total
- **Lotes Criados:** Total
- **Lotes Completados:** Total
- **Recompensas Creditadas:** Total
- **Transações Criadas:** Total

---

## 🛠️ FERRAMENTAS RECOMENDADAS

### Para Testes de Carga

1. **Artillery** (Node.js)
   ```bash
   npm install -g artillery
   artillery quick --count 100 --num 10 http://localhost:8080/api/games/shoot
   ```

2. **k6** (Go)
   ```bash
   k6 run script.js
   ```

3. **Apache Bench (ab)**
   ```bash
   ab -n 1000 -c 10 http://localhost:8080/health
   ```

### Para Monitoramento

1. **Prometheus** - Métricas do endpoint `/metrics`
2. **Grafana** - Visualização de métricas
3. **Supabase Dashboard** - Monitoramento do banco
4. **Node.js Inspector** - Profiling de performance

---

## 📋 CHECKLIST DE VALIDAÇÃO DE CARGA

### Antes de Executar

- [ ] Migration V19 aplicada
- [ ] Validações básicas passando
- [ ] Ambiente de staging/teste disponível
- [ ] Backup do banco criado
- [ ] Ferramentas de teste instaladas
- [ ] Monitoramento configurado

### Durante os Testes

- [ ] Monitorar métricas em tempo real
- [ ] Verificar logs do servidor
- [ ] Verificar logs do banco
- [ ] Verificar heartbeat
- [ ] Documentar problemas encontrados

### Após os Testes

- [ ] Validar integridade dos dados
- [ ] Verificar métricas coletadas
- [ ] Analisar performance
- [ ] Identificar gargalos
- [ ] Documentar resultados
- [ ] Criar relatório de testes

---

## 🚨 LIMITES E ALERTAS

### Limites Recomendados

- **Latência Máxima Aceitável:** 2s
- **Taxa de Erro Máxima:** 5%
- **Uso de Memória Máximo:** 4GB
- **Uso de CPU Máximo:** 90%
- **Conexões ao Banco Máximas:** 100

### Alertas a Configurar

- [ ] Latência > 1s
- [ ] Taxa de erro > 1%
- [ ] Uso de memória > 2GB
- [ ] Uso de CPU > 80%
- [ ] Heartbeat não atualizado > 60s
- [ ] Deadlocks no banco

---

## 📝 RELATÓRIO DE TESTES

**Template Sugerido:**

```markdown
# Relatório de Testes de Carga - ENGINE V19

## Data: YYYY-MM-DD
## Ambiente: staging/production
## Versão: V19.0.0

## Cenário Testado
- Descrição do cenário
- Configuração usada
- Tempo de execução

## Resultados
- Total de requisições
- Taxa de sucesso
- Latência média
- Latência p95
- Latência p99
- Taxa de erro

## Métricas do Servidor
- CPU Usage
- Memory Usage
- Response Time

## Métricas do Banco
- Conexões ativas
- Queries por segundo
- Tamanho das tabelas

## Problemas Encontrados
- Lista de problemas

## Conclusão
- Sistema estável?
- Pronto para produção?
- Melhorias necessárias?
```

---

## ✅ CRITÉRIOS DE APROVAÇÃO

**Sistema está aprovado para produção se:**

- ✅ Todos os testes passaram
- ✅ Latência média < 500ms
- ✅ Taxa de erro < 1%
- ✅ Sem vazamentos de memória
- ✅ Integridade dos dados garantida
- ✅ Heartbeat funcionando
- ✅ Monitoramento funcionando
- ✅ Sem deadlocks
- ✅ Performance aceitável

---

**Gerado em:** 2025-12-07T00:00:00Z  
**Versão:** V19.0.0  
**Status:** ⚠️ **AGUARDANDO MIGRATION V19**

