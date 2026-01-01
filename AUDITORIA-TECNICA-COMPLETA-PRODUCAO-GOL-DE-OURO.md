# 🔍 AUDITORIA TÉCNICA COMPLETA - GOL DE OURO
## Análise do Estado Atual para Operação com Dinheiro Real

**Data:** 2026-01-01  
**Versão Analisada:** Pós MISSÃO C (BLOCOS 1 e 2)  
**Arquiteto:** Análise Técnica Completa  
**Status:** Diagnóstico Honesto do Estado de Produção

---

## 📋 1. LEITURA E CONTEXTO

### 1.1 Estrutura do Backend

#### Arquitetura Identificada

**Arquivo Principal:**
- `server-fly.js` (3041 linhas) - Servidor Express principal

**Modelos:**
- `models/User.js`
- `models/Game.js`
- `models/Bet.js`
- `models/Withdrawal.js`

**Controllers:**
- `controllers/gameController.js`
- `controllers/paymentController.js`
- `controllers/authController.js`
- `controllers/usuarioController.js`
- `controllers/withdrawController.js`
- `src/modules/game/controllers/game.controller.js` (versão modular)

**Services:**
- `services/loteService.js` - Gerenciamento de lotes
- `services/financialService.js` - Operações financeiras ACID
- `services/emailService.js` - Notificações

**Middlewares:**
- `middlewares/auth.js` / `src/modules/shared/middleware/authMiddleware.js`
- `middlewares/security-performance.js`
- Rate limiting configurado em `server-fly.js`

**Validadores:**
- `utils/lote-integrity-validator.js` - Validação de integridade de lotes
- `utils/pix-validator.js` - Validação de PIX
- `utils/webhook-signature-validator.js` - Validação de webhooks

**Database:**
- Supabase PostgreSQL (via `@supabase/supabase-js`)
- Funções RPC para operações ACID
- Schema em `database/migration_v19/`

### 1.2 Sistema de LOTES - Como Funciona

#### Criação de Lotes

**Localização:** `server-fly.js:399-456`

```399:456:server-fly.js
async function getOrCreateLoteByValue(amount) {
  const config = batchConfigs[amount];
  if (!config) {
    throw new Error(`Valor de aposta inválido: ${amount}`);
  }

  // Verificar cache em memória primeiro (performance)
  let loteAtivo = null;
  for (const [loteId, lote] of lotesAtivos.entries()) {
    const valorLote = typeof lote.valor !== 'undefined' ? lote.valor : lote.valorAposta;
    const ativo = typeof lote.ativo === 'boolean' ? lote.ativo : lote.status === 'active';
    if (valorLote === amount && ativo && lote.chutes.length < config.size) {
      loteAtivo = lote;
      break;
    }
  }

  // Se não existe em cache, buscar/criar no banco
  if (!loteAtivo) {
    const randomBytes = crypto.randomBytes(6).toString('hex');
    const loteId = `lote_${amount}_${Date.now()}_${randomBytes}`;
    // ✅ CORREÇÃO CIRÚRGICA: winnerIndex será determinado pelo fechamento econômico, não aleatório
    // Usar -1 como placeholder (será atualizado quando lote fechar)
    const winnerIndex = -1;

    // ✅ PERSISTIR NO BANCO
    const result = await LoteService.getOrCreateLote(loteId, amount, config.size, winnerIndex);
    
    if (!result.success) {
      throw new Error(`Erro ao criar lote: ${result.error}`);
    }

    const loteDb = result.lote;

    // Criar objeto em memória sincronizado com banco
    loteAtivo = {
      id: loteDb.id,
      valor: amount,
      ativo: loteDb.status === 'ativo',
      valorAposta: amount,
      config: config,
      chutes: [], // Array vazio inicialmente (será populado conforme chutes chegam)
      status: loteDb.status === 'ativo' ? 'active' : 'completed',
      winnerIndex: -1, // ✅ Será determinado quando lote fechar economicamente
      posicaoAtual: loteDb.posicao_atual || 0,
      createdAt: new Date().toISOString(),
      totalArrecadado: parseFloat(loteDb.total_arrecadado || 0),
      premioTotal: parseFloat(loteDb.premio_total || 0)
    };
    
    lotesAtivos.set(loteId, loteAtivo);
    console.log(`🎮 [LOTE] Novo lote criado e persistido: ${loteId} (R$${amount})`);
  }

  return loteAtivo;
}
```

**Configurações dos Lotes:**
```390:396:server-fly.js
const batchConfigs = {
  1: { size: 10, totalValue: 10, winChance: 0.1, description: "10% chance" },
  2: { size: 5, totalValue: 10, winChance: 0.2, description: "20% chance" },
  5: { size: 2, totalValue: 10, winChance: 0.5, description: "50% chance" },
  10: { size: 1, totalValue: 10, winChance: 1.0, description: "100% chance" }
};
```

**Persistência:**
- Lotes são persistidos no PostgreSQL via `LoteService.getOrCreateLote()`
- Cache em memória (`lotesAtivos` Map) sincronizado com banco
- Função RPC: `rpc_get_or_create_lote` com `FOR UPDATE` para locks

#### Entrada de Usuários em Lotes

**Fluxo:**
1. Usuário faz chute via `POST /api/games/shoot`
2. Sistema busca lote ativo para o valor de aposta
3. Se não existe, cria novo lote
4. Valida integridade antes de processar chute
5. Adiciona chute ao lote

**Não há restrição:** O mesmo usuário pode fazer múltiplos chutes no mesmo lote.

#### Lógica de Chute

**Endpoint:** `POST /api/games/shoot` (linha 1149)

**Fluxo Completo:**
1. **Validação de entrada** (direção, valor)
2. **Verificação de saldo** (consulta banco)
3. **Obter/criar lote** (`getOrCreateLoteByValue`)
4. **Validação de integridade** (`loteIntegrityValidator.validateBeforeShot`)
5. **Cálculo de arrecadação:**
   - `arrecadacaoAntesChute = lote.totalArrecadado`
   - `arrecadacaoAposChute = arrecadacaoAntesChute + amount`
6. **Determinação de gol:**
   - `fechaLote = arrecadacaoAposChute >= 10.00`
   - `isGoal = fechaLote` (gol só quando fecha economicamente)
7. **Cálculo de Gol de Ouro:**
   - Baseado em arrecadação global (R$1000 incrementais)
8. **Processamento:**
   - Adiciona chute ao lote (memória)
   - Salva chute no banco (`chutes` table)
   - Atualiza lote no banco (`LoteService.updateLoteAfterShot`)
   - Se gol: ajusta saldo do vencedor

**Código Crítico:**
```1216:1288:server-fly.js
    // ✅ CORREÇÃO CIRÚRGICA: Calcular arrecadação ANTES de processar chute
    const arrecadacaoAntesChute = parseFloat(lote.totalArrecadado || 0);
    const arrecadacaoAposChute = arrecadacaoAntesChute + amount;
    
    // ✅ CORREÇÃO CIRÚRGICA: Verificar se este chute fecha o lote economicamente (R$10)
    const fechaLote = arrecadacaoAposChute >= 10.00;
    
    // ✅ CORREÇÃO CIRÚRGICA: Se fecha o lote, este chute é o vencedor (winnerIndex = shotIndex)
    const shotIndex = lote.chutes.length;
    const isGoal = fechaLote; // Gol só quando fecha economicamente
    
    // Incrementar contador global
    contadorChutesGlobal++;
    
    // ✅ CORREÇÃO CIRÚRGICA: Obter arrecadação global para calcular Gol de Ouro
    let arrecadacaoGlobal = 0;
    try {
      const { data: metrics, error: metricsError } = await supabase
        .from('metricas_globais')
        .select('total_receita')
        .eq('id', 1)
        .single();
      
      if (!metricsError && metrics) {
        arrecadacaoGlobal = parseFloat(metrics.total_receita || 0);
      }
    } catch (error) {
      console.error('❌ [SHOOT] Erro ao obter arrecadação global:', error);
    }
    
    // ✅ CORREÇÃO CIRÚRGICA: Calcular Gol de Ouro baseado em R$1000 arrecadados (não chutes)
    const novaArrecadacaoGlobal = arrecadacaoGlobal + amount;
    const ultimoGolDeOuroArrecadacao = await getUltimoGolDeOuroArrecadacao();
    const isGolDeOuro = (novaArrecadacaoGlobal >= ultimoGolDeOuroArrecadacao + 1000.00);
    
    // Salvar contador no Supabase
    await saveGlobalCounter();
    
    // ✅ CORREÇÃO CIRÚRGICA: Atualizar arrecadação global
    await updateArrecadacaoGlobal(novaArrecadacaoGlobal, isGolDeOuro);
    
    const result = isGoal ? 'goal' : 'miss';
    
    let premio = 0;
    let premioGolDeOuro = 0;
    
    // ✅ CORREÇÃO CIRÚRGICA: Só pagar prêmio se lote fechou com R$10 arrecadados
    if (isGoal && arrecadacaoAposChute >= 10.00) {
      // Prêmio normal: R$5 fixo (independente do valor apostado)
      premio = 5.00;
      
      // Gol de Ouro: R$100 adicional (só se atingiu R$1000 arrecadados globalmente)
      if (isGolDeOuro) {
        premioGolDeOuro = 100.00;
        ultimoGolDeOuro = contadorChutesGlobal;
        await setUltimoGolDeOuroArrecadacao(novaArrecadacaoGlobal);
        console.log(`🏆 [GOL DE OURO] Arrecadação global: R$${novaArrecadacaoGlobal.toFixed(2)} - Prêmio: R$ ${premioGolDeOuro.toFixed(2)}`);
      }
      
      // ✅ CORREÇÃO CIRÚRGICA: Encerrar o lote quando fecha economicamente
      lote.status = 'completed';
      lote.ativo = false;
      // ✅ CORREÇÃO CIRÚRGICA: Atualizar winnerIndex para o chute que fechou
      lote.winnerIndex = shotIndex;
      console.log(`✅ [LOTE] Lote ${lote.id} fechado economicamente: R$${arrecadacaoAposChute.toFixed(2)} arrecadado, vencedor: chute #${shotIndex + 1}`);
    } else if (isGoal) {
      // ✅ CORREÇÃO CIRÚRGICA: Bloquear gol se arrecadação < R$10 (não deve acontecer, mas segurança)
      console.error(`❌ [LOTE] Tentativa de gol com arrecadação insuficiente: R$${arrecadacaoAposChute.toFixed(2)}`);
      return res.status(400).json({
        success: false,
        message: 'Lote precisa arrecadar R$10 antes de conceder prêmio'
      });
    }
```

#### Definição do Gol Premiado

**Regra Econômica (MISSÃO C):**
- Lote fecha quando `total_arrecadado >= 10.00`
- O chute que fecha o lote (atinge R$10) é automaticamente o vencedor
- `winnerIndex` é definido no momento do fechamento (não pré-definido)

**Prêmios:**
- **Prêmio Normal:** R$ 5,00 fixo (quando lote fecha)
- **Gol de Ouro:** R$ 100,00 adicional (a cada R$1000 arrecadados globalmente)

#### Distribuição Financeira

**Débito de Saldo:**
- Ocorre via **gatilho do banco** (`chutes` table trigger)
- Trigger subtrai `valor_aposta` automaticamente ao inserir chute

**Crédito de Prêmio:**
- Se gol: ajuste manual do saldo (linha 1409-1419)
- Cálculo: `novoSaldo = saldoAtual - amount + premio + premioGolDeOuro`
- **PROBLEMA IDENTIFICADO:** Lógica de débito duplicada (ver seção 3.1)

**Operações Financeiras:**
- `FinancialService.addBalance()` - Crédito ACID
- `FinancialService.deductBalance()` - Débito ACID
- Funções RPC com `FOR UPDATE` para locks

#### Reentrada de Usuários

**Sem Restrições:**
- Usuário pode chutar imediatamente após qualquer resultado
- Pode fazer múltiplos chutes no mesmo lote
- Não há cooldown ou período de espera
- Se lote foi encerrado, próximo chute cria/entra em novo lote

---

## 🗺️ 2. MAPA REAL DO FLUXO DO JOGO

### 2.1 Fluxo Completo do Usuário

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ENTRADA                                                  │
│    - Usuário autenticado (JWT)                              │
│    - Saldo verificado no banco                              │
│    - Lote obtido/criado (cache + banco)                     │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CHUTE                                                     │
│    POST /api/games/shoot                                    │
│    - Validação de entrada (direction, amount)               │
│    - Verificação de saldo (consulta banco)                 │
│    - Validação de integridade do lote                       │
│    - Cálculo de arrecadação                                 │
│    - Determinação de gol (arrecadação >= R$10)              │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PROCESSAMENTO                                            │
│    - Adiciona chute ao lote (memória)                       │
│    - Salva chute no banco (tabela 'chutes')                 │
│    - Trigger do banco: debita saldo automaticamente         │
│    - Atualiza lote no banco (RPC)                           │
│    - Se gol: ajusta saldo do vencedor                       │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. RESULTADO                                                 │
│    - Retorna resultado (goal/miss)                        │
│    - Prêmio creditado (se gol)                              │
│    - Lote encerrado (se fechou)                             │
│    - Cache atualizado                                       │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. REENTRADA                                                 │
│    - Usuário pode chutar novamente imediatamente            │
│    - Novo lote criado se anterior foi encerrado             │
│    - Mesmo lote se ainda ativo                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Onde e Quando

#### Saldo é Debitado

**Localização:** Trigger do banco de dados (tabela `chutes`)

**Quando:**
- Imediatamente após inserção do chute no banco
- Via trigger automático (não visível no código JavaScript)

**Problema:** Há também ajuste manual de saldo no código (linha 1409), potencial duplicação.

#### Gol é Definido

**Quando:**
- `arrecadacaoAposChute >= 10.00`
- O chute que atinge R$10 é automaticamente o vencedor
- `winnerIndex` definido no momento do fechamento

**Código:**
```1224:1225:server-fly.js
    const shotIndex = lote.chutes.length;
    const isGoal = fechaLote; // Gol só quando fecha economicamente
```

#### Prêmio é Pago

**Quando:**
- Imediatamente após gol ser determinado
- Apenas se `arrecadacaoAposChute >= 10.00`

**Como:**
```1409:1419:server-fly.js
    if (isGoal) {
      const novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro;
      const { error: saldoWinnerError } = await supabase
        .from('usuarios')
        .update({ saldo: novoSaldoVencedor })
        .eq('id', req.user.userId);
      if (saldoWinnerError) {
        console.error('❌ [SHOOT] Erro ao ajustar saldo do vencedor:', saldoWinnerError);
      } else {
        shootResult.novoSaldo = novoSaldoVencedor;
      }
    }
```

**PROBLEMA:** Saldo já foi debitado pelo trigger, então está sendo debitado novamente aqui.

### 2.3 Quantos Usuários Participam por LOTE

**Não há limite de usuários únicos.**

- **R$1:** Máximo 10 chutes (qualquer combinação de usuários)
- **R$2:** Máximo 5 chutes
- **R$5:** Máximo 2 chutes
- **R$10:** Máximo 1 chute

**Exemplo:**
- Um único usuário pode fazer todos os 10 chutes de um lote R$1
- Ou 10 usuários diferentes podem fazer 1 chute cada
- Ou qualquer combinação

### 2.4 Cenários de Concorrência

#### Dois Usuários Chutam ao Mesmo Tempo

**Proteção Atual:**
- Função RPC `rpc_update_lote_after_shot` usa `FOR UPDATE` (lock de linha)
- Cache em memória não tem lock explícito

**Risco:**
- Se dois requests chegarem simultaneamente antes da chamada RPC, ambos podem ver o mesmo lote ativo em memória
- Validação de integridade (`validateBeforeShot`) verifica se lote ainda aceita chutes
- Lock do banco previne duplicação na persistência

**Classificação:** MÉDIO (mitigado, mas não eliminado)

#### Gol Já Foi Definido

**Proteção:**
- Validação `validateBeforeShot` verifica se lote está completo
- Lote é marcado como `completed` imediatamente após gol
- Cache é atualizado sincronizadamente

**Classificação:** BAIXO (bem protegido)

#### Requisição Repetida

**Proteção:**
- Não há idempotência explícita
- Não há `X-Idempotency-Key` implementado
- Rate limiting global (100 req/15min por IP)

**Classificação:** ALTO (falta idempotência)

---

## ⚠️ 3. INTEGRIDADE E RISCOS

### 3.1 Concorrência

**Riscos Identificados:**

#### CRÍTICO: Duplicação de Débito de Saldo

**Localização:** `server-fly.js:1409-1419`

**Problema:**
```1409:1419:server-fly.js
    if (isGoal) {
      const novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro;
      const { error: saldoWinnerError } = await supabase
        .from('usuarios')
        .update({ saldo: novoSaldoVencedor })
        .eq('id', req.user.userId);
      if (saldoWinnerError) {
        console.error('❌ [SHOOT] Erro ao ajustar saldo do vencedor:', saldoWinnerError);
      } else {
        shootResult.novoSaldo = novoSaldoVencedor;
      }
    }
```

**Análise:**
- Trigger do banco já debita `amount` ao inserir chute
- Código acima debita `amount` novamente no cálculo
- Resultado: Débito duplo em caso de gol

**Impacto:** CRÍTICO - Perda financeira para usuários

**Correção Necessária:**
```javascript
// CORRETO:
const novoSaldoVencedor = user.saldo + premio + premioGolDeOuro;
// (sem subtrair amount, pois já foi debitado pelo trigger)
```

#### MÉDIO: Race Condition no Cache

**Problema:**
- Cache em memória (`lotesAtivos` Map) não tem lock
- Dois requests simultâneos podem ver o mesmo estado
- Lock do banco previne inconsistência final, mas pode causar rejeições desnecessárias

**Mitigação Atual:**
- Validação de integridade antes e depois do chute
- Lock do banco na função RPC

**Recomendação:** Implementar lock no cache ou remover cache completamente

### 3.2 Duplicidade de Ações

#### ALTO: Falta de Idempotência

**Problema:**
- Não há `X-Idempotency-Key` implementado
- Requisições duplicadas (retry, refresh) podem causar múltiplos chutes

**Exemplo:**
- Usuário clica rapidamente 2x no botão
- Frontend envia 2 requisições
- Backend processa ambas (se chegarem antes da validação)

**Proteção Parcial:**
- Rate limiting (100 req/15min)
- Validação de integridade do lote

**Recomendação:** Implementar idempotência com chave única por chute

### 3.3 Falhas Financeiras

#### CRÍTICO: Débito Duplo (já mencionado)

#### MÉDIO: Falta de Transação Atômica Completa

**Problema:**
- Inserção de chute e atualização de saldo não estão em transação única
- Se falhar após inserir chute, saldo já foi debitado

**Proteção Parcial:**
- Funções RPC usam transações implícitas
- Mas ajuste manual de saldo (linha 1409) está fora da transação

### 3.4 Falta de Idempotência

**Classificação:** ALTO

**Problemas:**
- Sem `X-Idempotency-Key`
- Sem verificação de chute duplicado
- Rate limiting não é suficiente

### 3.5 Possibilidade de Fraude ou Abuso

#### MÉDIO: Múltiplos Chutes Rápidos

**Problema:**
- Usuário pode fazer múltiplos chutes muito rapidamente
- Rate limiting (100 req/15min) é muito permissivo para chutes
- Não há limite específico para endpoint `/api/games/shoot`

**Recomendação:** Rate limiting específico para chutes (ex: 10 chutes/minuto por usuário)

#### BAIXO: Validação de Saldo

**Proteção:**
- Saldo é verificado antes do chute
- Mas há janela de tempo entre verificação e débito

### 3.6 Pontos de Inconsistência

#### ALTO: Cache vs Banco

**Problema:**
- Cache em memória pode ficar dessincronizado com banco
- Se servidor reiniciar, cache é perdido (mas banco persiste)

**Mitigação:**
- `LoteService.syncActiveLotes()` sincroniza ao iniciar
- Mas não há sincronização contínua

#### MÉDIO: Contador Global

**Problema:**
- `contadorChutesGlobal` é variável em memória
- Pode ser perdido em restart
- Há função `saveGlobalCounter()` mas não está sendo chamada consistentemente

---

## 🔒 4. SEGURANÇA E PRODUÇÃO

### 4.1 Variáveis de Ambiente

**Validação:** ✅ Implementada (`config/required-env.js`)

**Variáveis Obrigatórias:**
- `JWT_SECRET` ✅
- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `MERCADOPAGO_ACCESS_TOKEN` (apenas produção) ✅

**Problemas:**
- Não há rotação automática de secrets
- `JWT_SECRET` não tem expiração

### 4.2 Tokens e Segredos

**JWT:**
- ✅ Implementado com `jsonwebtoken`
- ✅ Verificação em middleware `authenticateToken`
- ⚠️ Sem refresh token robusto (há endpoint mas não está integrado)
- ⚠️ Sem blacklist de tokens revogados

**Supabase:**
- ✅ Service Role Key usado apenas no backend
- ⚠️ Não há rotação de chaves

### 4.3 Proteção de Rotas Sensíveis

**Autenticação:**
- ✅ Middleware `authenticateToken` aplicado em rotas sensíveis
- ✅ Verificação de JWT válido

**Autorização:**
- ⚠️ Não há sistema de roles/permissões
- ⚠️ Qualquer usuário autenticado pode acessar qualquer rota

**Admin:**
- ⚠️ Há `authAdminToken` mas não está sendo usado consistentemente

### 4.4 CORS

**Configuração:** ✅ Implementada

```210:261:server-fly.js
const parseCorsOrigins = () => {
  const csv = process.env.CORS_ORIGIN || '';
  const list = csv.split(',').map(s => s.trim()).filter(Boolean);
  return list.length > 0 ? list : [
    'https://goldeouro.lol',
    'https://www.goldeouro.lol',
    'https://app.goldeouro.lol', // ✅ ADICIONADO: Subdomínio de produção
    'https://admin.goldeouro.lol',
    'http://localhost:5173', // Permitir localhost para desenvolvimento
    'http://localhost:5174'
  ];
};

// ✅ CORREÇÃO: Usar função dinâmica de origin para suportar wildcards Vercel
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sem origin (mobile apps, Postman, health checks, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = parseCorsOrigins();
    
    // Verificar se origin está na lista permitida
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // ✅ CORREÇÃO: Permitir wildcards do Vercel (goldeouro-player-*.vercel.app)
    // Padrão: https://goldeouro-player-{hash}-{team}.vercel.app
    const vercelPattern = /^https:\/\/goldeouro-player(-[a-z0-9]+)?(-[a-z0-9-]+)?\.vercel\.app$/;
    if (vercelPattern.test(origin)) {
      return callback(null, true);
    }
    
    // Bloquear origin não permitida
    console.warn(`🚫 [CORS] Origin bloqueada: ${origin}`);
    callback(new Error('Não permitido pelo CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'X-Idempotency-Key',
    'x-admin-token' // ✅ ADICIONADO: Header para admin
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24 horas para cache de preflight
}));
```

**Status:** ✅ Configurado corretamente

### 4.5 Rate Limit

**Configuração:** ✅ Implementada

```263:312:server-fly.js
// Rate limiting melhorado
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP (mais razoável)
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // ✅ CORRIGIDO: Desabilitar validação de trust proxy para evitar erro
  skip: (req) => {
    // Pular rate limiting para health check, meta e auth
    return req.path === '/health' || 
           req.path === '/meta' || 
           req.path.startsWith('/auth/') ||
           req.path.startsWith('/api/auth/');
  },
  handler: (req, res) => {
    console.log(`🚫 [RATE-LIMIT] IP ${req.ip} bloqueado por excesso de requests (${req.path})`);
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas. Tente novamente em 15 minutos.',
      retryAfter: Math.round(15 * 60) // 15 minutos em segundos
    });
  }
});

// Rate limiting específico para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login por IP
  validate: { trustProxy: false }, // ✅ CORRIGIDO: Desabilitar validação de trust proxy
  message: {
        success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  skipSuccessfulRequests: true, // Não contar tentativas bem-sucedidas
  handler: (req, res) => {
    console.log(`🚫 [AUTH-LIMIT] IP ${req.ip} bloqueado por excesso de tentativas de login`);
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    });
  }
});

app.use(limiter); // Rate limiting global
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
app.use('/auth/', authLimiter);
```

**Problemas:**
- ⚠️ Rate limit muito permissivo para chutes (100 req/15min)
- ⚠️ Não há rate limit específico para `/api/games/shoot`
- ⚠️ Rate limit baseado em IP (pode ser contornado com VPN)

### 4.6 Logs e Auditoria

**Logs:**
- ✅ Console.log em pontos críticos
- ⚠️ Não há sistema de logs estruturado
- ⚠️ Logs não são persistidos (apenas console)
- ⚠️ Não há rotação de logs

**Auditoria:**
- ⚠️ Não há tabela de auditoria de ações
- ⚠️ Não há rastreamento de mudanças financeiras
- ⚠️ Não há logs de segurança

---

## 📈 5. ESCALA E ESTRESSE

### 5.1 Capacidade Estimada

#### 100 Usuários Simultâneos

**Status:** ✅ PROVAVELMENTE AGUENTA

**Bottlenecks:**
- Rate limiting (100 req/15min por IP) pode bloquear usuários legítimos
- Cache em memória pode ter race conditions
- Banco de dados (Supabase) tem limites de conexão

**Recomendações:**
- Monitorar conexões do banco
- Ajustar rate limiting por usuário (não apenas IP)

#### 1.000 Usuários Simultâneos

**Status:** ⚠️ PODE QUEBRAR

**Problemas:**
- Cache em memória não escala (Map simples)
- Sem pool de conexões configurado explicitamente
- Rate limiting baseado em IP não funciona bem com muitos usuários
- Sem load balancing ou sharding

**Onde Quebraria Primeiro:**
1. **Conexões do Banco:** Supabase tem limite de conexões simultâneas
2. **Cache em Memória:** Race conditions aumentam exponencialmente
3. **Rate Limiting:** Muitos falsos positivos

#### 10.000 Usuários Simultâneos

**Status:** ❌ NÃO AGUENTA

**Problemas Críticos:**
- Arquitetura não foi projetada para escala
- Cache em memória não é distribuído
- Sem fila de processamento
- Sem cache distribuído (Redis)
- Sem balanceamento de carga

### 5.2 Onde Quebraria Primeiro

**Ordem de Falha:**
1. **Conexões do Banco** (Supabase limits)
2. **Cache em Memória** (race conditions)
3. **Rate Limiting** (falsos positivos)
4. **Processamento Síncrono** (sem fila)

### 5.3 O Que Precisa Ser Blindado

**Antes de Tráfego Pago:**

1. **CRÍTICO:** Corrigir débito duplo
2. **CRÍTICO:** Implementar idempotência
3. **ALTO:** Rate limiting específico para chutes
4. **ALTO:** Sistema de logs estruturado
5. **MÉDIO:** Cache distribuído (Redis)
6. **MÉDIO:** Fila de processamento (Bull/Redis)
7. **MÉDIO:** Pool de conexões configurado
8. **BAIXO:** Monitoramento e alertas

---

## 📊 6. CONCLUSÃO EXECUTIVA

### 6.1 Diagnóstico Honesto

**Estado Atual:**
- ✅ Sistema funcional para operação básica
- ✅ Persistência de lotes implementada
- ✅ Validações de integridade presentes
- ⚠️ Problemas críticos de concorrência
- ⚠️ Falta de idempotência
- ❌ Débito duplo em caso de gol

**Pronto para Dinheiro Real?**
**❌ NÃO - Requer correções críticas antes**

### 6.2 Checklist Técnico para MISSÃO D

#### Prioridade CRÍTICA (Bloqueadores)

- [ ] **CORRIGIR DÉBITO DUPLO**
  - Remover subtração de `amount` no cálculo de saldo do vencedor
  - Usar apenas: `novoSaldo = saldoAtual + premio + premioGolDeOuro`
  - Testar com múltiplos gols simultâneos

- [ ] **IMPLEMENTAR IDEMPOTÊNCIA**
  - Adicionar `X-Idempotency-Key` header
  - Verificar chute duplicado antes de processar
  - Retornar resultado anterior se chute já foi processado

- [ ] **RATE LIMITING ESPECÍFICO PARA CHUTES**
  - Limitar `/api/games/shoot` a 10-20 chutes/minuto por usuário
  - Não apenas por IP (usuários podem compartilhar IP)

#### Prioridade ALTA (Essenciais)

- [ ] **SISTEMA DE LOGS ESTRUTURADO**
  - Implementar Winston ou similar
  - Logs de todas as operações financeiras
  - Rotação de logs

- [ ] **AUDITORIA DE AÇÕES**
  - Tabela de auditoria
  - Rastreamento de mudanças financeiras
  - Logs de segurança

- [ ] **TRANSAÇÃO ATÔMICA COMPLETA**
  - Garantir que inserção de chute e atualização de saldo estejam em transação única
  - Usar transações explícitas do PostgreSQL

- [ ] **LOCK NO CACHE OU REMOVER CACHE**
  - Implementar lock no `lotesAtivos` Map
  - Ou remover cache e usar apenas banco (mais lento, mas seguro)

#### Prioridade MÉDIA (Melhorias)

- [ ] **CACHE DISTRIBUÍDO (Redis)**
  - Substituir cache em memória por Redis
  - Permitir múltiplas instâncias do servidor

- [ ] **FILA DE PROCESSAMENTO**
  - Implementar Bull/Redis para processar chutes
  - Garantir ordem e evitar race conditions

- [ ] **MONITORAMENTO**
  - Health checks robustos
  - Métricas de performance
  - Alertas para erros críticos

- [ ] **TESTES DE CARGA**
  - Testar com 100, 1.000 e 10.000 usuários simultâneos
  - Identificar e corrigir bottlenecks

#### Prioridade BAIXA (Otimizações)

- [ ] **SISTEMA DE ROLES/PERMISSÕES**
  - Implementar autorização granular
  - Proteger rotas admin

- [ ] **REFRESH TOKEN ROBUSTO**
  - Integrar refresh token no fluxo
  - Blacklist de tokens revogados

- [ ] **ROTAÇÃO DE SECRETS**
  - Implementar rotação automática de JWT_SECRET
  - Rotação de chaves Supabase

### 6.3 Recomendações Objetivas

#### Não Operar com Dinheiro Real Até:

1. ✅ Corrigir débito duplo
2. ✅ Implementar idempotência
3. ✅ Rate limiting específico para chutes
4. ✅ Sistema de logs estruturado
5. ✅ Testes de carga com cenários reais

#### Operar com Limitações:

- Limitar a 100-200 usuários simultâneos
- Monitorar constantemente logs e métricas
- Ter plano de rollback pronto
- Ter suporte técnico disponível 24/7

#### Arquitetura Recomendada para Escala:

1. **Cache Distribuído:** Redis para lotes ativos
2. **Fila de Processamento:** Bull/Redis para chutes
3. **Load Balancer:** Distribuir carga entre instâncias
4. **Database Pool:** Configurar pool de conexões adequado
5. **Monitoring:** Prometheus + Grafana para métricas

---

## 📝 RESUMO FINAL

### ✅ O Que Está Sólido

- Persistência de lotes no banco
- Validações de integridade
- Autenticação JWT
- CORS configurado
- Rate limiting básico
- Estrutura modular

### ⚠️ O Que Está Frágil

- Cache em memória (race conditions)
- Falta de idempotência
- Rate limiting muito permissivo
- Logs não estruturados
- Sem auditoria

### ❌ O Que NÃO Está Pronto

- **DÉBITO DUPLO EM CASO DE GOL** (CRÍTICO)
- Idempotência de requisições
- Transações atômicas completas
- Escalabilidade para >1000 usuários
- Sistema de monitoramento robusto

### 🎯 VEREDICTO

**O sistema NÃO está pronto para operar com dinheiro real em produção sem as correções críticas.**

**Tempo estimado para correções críticas:** 2-3 dias de desenvolvimento + 1 dia de testes

**Recomendação:** Implementar MISSÃO D (correções críticas) antes de qualquer operação com dinheiro real.

---

**Gerado em:** 2026-01-01  
**Status:** ✅ ANÁLISE COMPLETA  
**Próximo Passo:** MISSÃO D - Correções Críticas

