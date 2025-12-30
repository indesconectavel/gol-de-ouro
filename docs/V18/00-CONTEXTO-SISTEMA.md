# 🔍 V18 ETAPA 0 — CONTEXTO OFICIAL DO SISTEMA
## Data: 2025-12-05
## Versão: V18.0.0

---

## 🌐 INFRAESTRUTURA DE PRODUÇÃO

### Backend Fly.io
- **URL:** https://goldeouro-backend-v2.fly.dev
- **Região:** gru (São Paulo)
- **WebSocket:** wss://goldeouro-backend-v2.fly.dev
- **Status:** ✅ Ativo em produção
- **Deploy:** Via `flyctl deploy`
- **Memória:** Configurada no `fly.toml`
- **Processos:** Node.js Express

### Frontend Player
- **Plataforma:** Vercel
- **URL:** https://www.goldeouro.lol
- **Build:** React + Vite
- **Status:** ✅ Deployado

### Frontend Admin
- **Plataforma:** Vercel
- **URL:** https://admin.goldeouro.lol
- **Build:** React + Vite
- **Status:** ✅ Deployado

### Banco Supabase
- **Tipo:** PostgreSQL
- **RLS:** Habilitado
- **Índices:** Configurados
- **Status:** ✅ Conectado

---

## 🎮 SISTEMA DE LOTES (LOTE_MODERNO)

### Como são Criados
- **Função:** `getOrCreateLoteByValue(amount)` em `server-fly.js`
- **Processo:**
  1. Verifica se existe lote ativo em memória (`lotesAtivos` Map)
  2. Se não existe, cria no banco via `LoteService.getOrCreateLote()`
  3. Cria objeto em memória com `winnerIndex` aleatório
  4. Armazena em `lotesAtivos.set(loteId, loteAtivo)`

### Como são Fechados
- **Condição 1:** Gol marcado → `lote.status = 'completed'` imediatamente
- **Condição 2:** Atingiu tamanho máximo → `lote.chutes.length >= config.size`
- **Processo:** Atualização em memória + persistência no banco via `LoteService.updateLoteAfterShot()`

### Onde Ficam Armazenados
- **Memória:** `lotesAtivos` Map (variável global em `server-fly.js`)
- **Banco:** Tabela `lotes` no Supabase
- **Sincronização:** `LoteService.syncActiveLotes()` ao iniciar servidor

### Como o Backend Decide Quando Fechar
- **Lógica:** `shotIndex === lote.winnerIndex` → gol → fecha imediatamente
- **Ou:** `lote.chutes.length >= config.size` → fecha automaticamente
- **Validação:** `LoteIntegrityValidator.validateAfterShot()`

### Por Que Lotes Ficam em Memória
- **Performance:** Acesso rápido sem query ao banco
- **Sincronização:** Estado atualizado em tempo real
- **Risco:** Perda de dados em caso de reinicialização (mitigado com persistência)

### Existe Persistência Real?
- ✅ **SIM:** Lotes são criados no banco via `LoteService.getOrCreateLote()`
- ✅ **SIM:** Chutes são salvos na tabela `chutes`
- ✅ **SIM:** Lotes são atualizados via `LoteService.updateLoteAfterShot()`
- ⚠️ **MAS:** Estado em memória pode divergir do banco

### O Que Acontece Após o Chute 10
- Se não houve gol antes: lote fecha automaticamente
- `lote.status = 'completed'`
- `lote.ativo = false`
- Persistência no banco

### O Que Acontece com Erros
- Validação pré-chute: `validateBeforeShot()`
- Validação pós-chute: `validateAfterShot()`
- Reversão automática se validação falhar

### Existe Reinício Automático?
- ✅ Sincronização ao iniciar: `syncActiveLotes()`
- ⚠️ Mas lotes em memória são perdidos e recriados do banco

---

## 🎯 MOTOR DE CHUTE

### Direções Permitidas
- `TL` - Top Left (Superior Esquerda)
- `TR` - Top Right (Superior Direita)
- `C` - Center (Centro)
- `BL` - Bottom Left (Inferior Esquerda)
- `BR` - Bottom Right (Inferior Direita)

### Como é Calculado o Gol
- **Sistema:** Baseado em `winnerIndex` do lote
- **Lógica:** `shotIndex === lote.winnerIndex` → gol
- **Não usa:** Random ou seed para cada chute
- **Usa:** Índice pré-definido no lote

### A IA Usa Random ou Seed?
- **Criação do Lote:** `winnerIndex = crypto.randomInt(0, config.size)`
- **Determinação do Gol:** Comparação direta `shotIndex === winnerIndex`
- **Não há:** Simulação física ou probabilidade

### O Que Acontece com Empate
- **Não aplicável:** Sistema de lotes não tem empate
- **Um vencedor por lote:** Primeiro gol fecha o lote

### Como a Engine Valida Acerto/Erro
- **Validação:** `LoteIntegrityValidator.validateAfterShot()`
- **Verifica:** Resultado esperado vs resultado real
- **Reversão:** Se validação falhar, chute é revertido

### Sistema de Tentativas
- **Não há limite:** Usuário pode chutar múltiplas vezes no mesmo lote
- **Validação:** Apenas saldo suficiente

### Segurança Contra Fraude
- ✅ Validação de integridade do lote
- ✅ Verificação de saldo antes do chute
- ✅ Persistência no banco
- ⚠️ Mas: `winnerIndex` é conhecido no backend (não no frontend)

---

## 🏆 SISTEMA DE PREMIAÇÃO

### Como o Prêmio é Calculado
- **Prêmio Normal:** R$ 5,00 fixo (se gol)
- **Gol de Ouro:** R$ 100,00 adicional (a cada 1000 chutes)
- **Total:** `premio + premioGolDeOuro`

### É Baseado em Lotes?
- ✅ **SIM:** Prêmio é creditado quando `shotIndex === winnerIndex`
- ✅ **SIM:** Um vencedor por lote

### É Baseado na Ordem?
- ✅ **SIM:** Ordem do chute no lote (`shotIndex`)
- ✅ **SIM:** Comparação com `winnerIndex` pré-definido

### É Baseado no Usuário que Acertou?
- ✅ **SIM:** Usuário que fez o chute vencedor recebe o prêmio
- ✅ **SIM:** Prêmio creditado via `FinancialService.addBalance()`

### O Backend Gera Distribuição Automática?
- ✅ **SIM:** Prêmio é creditado automaticamente após gol
- ✅ **SIM:** Via `FinancialService.addBalance()`

### Existe Rastreamento do Ganhador?
- ✅ **SIM:** Chute salvo com `result: 'goal'`
- ✅ **SIM:** Lote salvo com status `completed`
- ✅ **SIM:** Transação registrada em `transacoes`

### Existem Premiações Múltiplas?
- ❌ **NÃO:** Um vencedor por lote
- ✅ **MAS:** Gol de Ouro pode ocorrer junto com prêmio normal

### Onde Está Registrado no Supabase
- **Tabela `chutes`:** Campo `premio` e `premio_gol_de_ouro`
- **Tabela `transacoes`:** Transação de crédito
- **Tabela `lotes`:** Status `completed` e `premio_total`

---

## 📊 CONFIGURAÇÕES DOS LOTES

| Valor | Tamanho | Chance | Descrição |
|-------|---------|--------|-----------|
| R$ 1,00 | 10 | 10% | Lote de 10 chutes |
| R$ 2,00 | 5 | 20% | Lote de 5 chutes |
| R$ 5,00 | 2 | 50% | Lote de 2 chutes |
| R$ 10,00 | 1 | 100% | Lote de 1 chute (garantido) |

---

## 🔐 CHAVES E SECRETS

### Fly.io Secrets
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `MP_CLIENT_ID`
- `MP_CLIENT_SECRET`

### Vercel Environment Variables
- Configurados via dashboard Vercel
- Variáveis de ambiente por projeto

---

## 📝 LOGS FLY

### Padrões
- `🎮 [LOTE]` - Criação/atualização de lotes
- `✅ [SHOOT]` - Chute bem-sucedido
- `❌ [SHOOT]` - Erro no chute
- `🏆 [GOL DE OURO]` - Gol de Ouro detectado

### Erros Comuns
- `Saldo insuficiente`
- `Lote com problemas de integridade`
- `Dependências não injetadas`

---

## ⚠️ DIVERGÊNCIAS VERSÕES

### Backend Local vs Produção
- **Local:** Pode ter código não deployado
- **Produção:** Versão atual em `server-fly.js`
- **Recomendação:** Sempre validar produção

---

**Gerado em:** 2025-12-05T00:30:00Z  
**Versão:** V18.0.0  
**Status:** ✅ Contexto reconstruído

