# 🔍 AUDITORIA TÉCNICA - PRODUÇÃO REAL
## Sistema Gol de Ouro - Estado Atual do Código

**Data:** 2025-01-24  
**Tipo:** Auditoria Técnica de Sistema Financeiro em Produção  
**Objetivo:** Diagnosticar se o sistema está BLINDADO para operação com dinheiro real  
**Versão Analisada:** Código atual em produção (server-fly.js)

---

## 1. CONTEXTO REAL DO SISTEMA

### 1.1 Como Funcionam os LOTES Hoje

**Arquitetura Atual:**
- Sistema opera por **LOTES ECONÔMICOS** (não existe `/entrar-partida`)
- Lotes são criados dinamicamente por valor de aposta (R$1, R$2, R$5, R$10)
- Cada lote fecha quando atinge **R$10 de arrecadação total**
- O chute que fecha o lote (atinge R$10) é automaticamente o vencedor

**Criação de Lote:**
```399:455:server-fly.js
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
    // ✅ CORREÇÃO CIRÚRGICA: Verificar se lote ainda não atingiu R$10 (não fechou)
    const totalArrecadado = lote.totalArrecadado || 0;
    if (valorLote === amount && ativo && totalArrecadado < 10.00) {
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

**Fechamento de Lote:**
```1262:1288:server-fly.js
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

**Regra Econômica:**
- Lote fecha quando `total_arrecadado >= 10.00`
- O chute que fecha o lote (atinge R$10) é automaticamente o vencedor
- `winnerIndex` é definido no momento do fechamento (não pré-definido)

### 1.2 Fluxo Completo do Chute

**Sequência de Operações:**
1. Usuário faz requisição `POST /api/games/shoot` com `direction` e `amount`
2. Sistema valida entrada e verifica saldo do usuário
3. Sistema obtém ou cria lote ativo para o valor de aposta
4. Sistema calcula se este chute fecha o lote (atinge R$10)
5. Sistema determina se é gol: `isGoal = fechaLote` (quando `arrecadacaoAposChute >= 10.00`)
6. Sistema insere chute no banco (tabela `chutes`)
7. **Trigger do banco** (`trigger_update_user_stats`) atualiza saldo automaticamente
8. Sistema atualiza lote no banco via `LoteService.updateLoteAfterShot()`
9. Sistema ajusta saldo manualmente se for gol (correção de bug)

**Código Principal:**
```1149:1436:server-fly.js
// Endpoint para chutar
app.post('/api/games/shoot', authenticateToken, async (req, res) => {
  try {
    const { direction, amount } = req.body;
    
    // Validar entrada
    if (!direction || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Direção e valor são obrigatórios'
      });
    }

    // Validar valor de aposta
    if (!batchConfigs[amount]) {
      return res.status(400).json({
        success: false,
        message: 'Valor de aposta inválido. Use: 1, 2, 5 ou 10'
      });
    }

    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    // Verificar saldo do usuário
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('saldo')
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (user.saldo < amount) {
      return res.status(400).json({
      success: false,
        message: 'Saldo insuficiente'
      });
    }

    // Obter ou criar lote para este valor
    const lote = await getOrCreateLoteByValue(amount);
    
    // Validar integridade do lote antes de processar chute
    const integrityValidation = loteIntegrityValidator.validateBeforeShot(lote, {
      direction: direction,
      amount: amount,
      userId: req.user.userId
    });

    if (!integrityValidation.valid) {
      console.error('❌ [SHOOT] Problema de integridade do lote:', integrityValidation.error);
      return res.status(400).json({
        success: false,
        message: integrityValidation.error
      });
    }
    
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
    
    // Adicionar chute ao lote
    const chute = {
      id: `${lote.id}_${shotIndex}`,
      // Campo esperado pelo validador
      userId: req.user.userId,
      direction,
      amount,
      result,
      premio,
      premioGolDeOuro,
      isGolDeOuro,
      shotIndex: shotIndex + 1,
      timestamp: new Date().toISOString()
    };
    
    lote.chutes.push(chute);
    lote.totalArrecadado = arrecadacaoAposChute; // ✅ Usar valor calculado
    lote.premioTotal += premio + premioGolDeOuro;

    // Validar integridade do lote após adicionar chute
    const postShotValidation = loteIntegrityValidator.validateAfterShot(lote, {
      result: result,
      premio: premio,
      premioGolDeOuro: premioGolDeOuro,
      timestamp: new Date().toISOString()
    });

    if (!postShotValidation.valid) {
      console.error('❌ [SHOOT] Problema de integridade após chute:', postShotValidation.error);
      // Reverter chute do lote
      lote.chutes.pop();
      lote.totalArrecadado -= amount;
      lote.premioTotal -= premio + premioGolDeOuro;
      return res.status(400).json({
        success: false,
        message: postShotValidation.error
      });
    }

    // Salvar chute no banco de dados (usar tabela 'chutes' para acionar gatilhos de métricas/saldo)
    const { error: chuteError } = await supabase
      .from('chutes')
      .insert({
        usuario_id: req.user.userId,
        lote_id: lote.id,
        direcao: direction,
        valor_aposta: amount,
        resultado: result,
        premio: premio,
        premio_gol_de_ouro: premioGolDeOuro,
        is_gol_de_ouro: isGolDeOuro,
        contador_global: contadorChutesGlobal,
        shot_index: shotIndex + 1
      });

    if (chuteError) {
      console.error('❌ [SHOOT] Erro ao salvar chute:', chuteError);
    }

    // ✅ ATUALIZAR LOTE NO BANCO (persistência)
    const updateResult = await LoteService.updateLoteAfterShot(
      lote.id,
      amount,
      premio,
      premioGolDeOuro,
      isGoal
    );

    if (updateResult.success && updateResult.lote.is_complete) {
      // ✅ CORREÇÃO CIRÚRGICA: Lote foi finalizado no banco (atingiu R$10)
      lote.status = 'completed';
      lote.ativo = false;
      // ✅ Atualizar winnerIndex do cache com o valor do banco
      if (updateResult.lote.indice_vencedor !== undefined) {
        lote.winnerIndex = updateResult.lote.indice_vencedor;
      }
      console.log(`🏆 [LOTE] Lote ${lote.id} completado e persistido: ${lote.chutes.length} chutes, R$${lote.totalArrecadado.toFixed(2)} arrecadado, R$${lote.premioTotal.toFixed(2)} em prêmios`);
      
      // ✅ CORREÇÃO CIRÚRGICA: Remover lote do cache para forçar criação de novo lote
      lotesAtivos.delete(lote.id);
    } else if (updateResult.success) {
      // Atualizar posição atual do cache
      lote.posicaoAtual = updateResult.lote.posicao_atual;
      lote.totalArrecadado = parseFloat(updateResult.lote.total_arrecadado);
      lote.premioTotal = parseFloat(updateResult.lote.premio_total);
      // ✅ Atualizar winnerIndex se foi definido
      if (updateResult.lote.indice_vencedor !== undefined) {
        lote.winnerIndex = updateResult.lote.indice_vencedor;
      }
    } else {
      console.error('❌ [SHOOT] Erro ao atualizar lote no banco:', updateResult.error);
    }

    // ✅ CORREÇÃO CIRÚRGICA: Remover verificação de tamanho máximo (lote fecha apenas por R$10)
    
    const shootResult = {
      loteId: lote.id,
      direction,
      amount,
      result,
      premio,
      premioGolDeOuro,
      isGolDeOuro,
      contadorGlobal: contadorChutesGlobal,
      timestamp: new Date().toISOString(),
      playerId: req.user.userId,
      loteProgress: {
        current: lote.chutes.length,
        total: lote.config.size,
        remaining: lote.config.size - lote.chutes.length
      },
      isLoteComplete: lote.status === 'completed'
    };

    // Ajuste de saldo:
    // - Perdas: gatilho do banco subtrai 'valor_aposta' automaticamente
    // - Vitórias: gatilho do banco credita apenas o prêmio (premio + premioGolDeOuro)
    //   Para manter a economia esperada (todos pagam a aposta), subtrair manualmente
    //   o valor da aposta apenas quando houver gol (evita dupla cobrança nas derrotas).
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
    
    console.log(`⚽ [SHOOT] Chute #${contadorChutesGlobal}: ${result} por usuário ${req.user.userId}`);
    
    res.status(200).json({
      success: true,
      data: shootResult
    });

  } catch (error) {
    console.error('❌ [SHOOT] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});
```

### 1.3 Onde Ocorrem Débito e Crédito

**Débito de Saldo:**
- **Localização:** Trigger do banco `trigger_update_user_stats` (schema-supabase-final.sql:328-332)
- **Quando:** Automaticamente ao inserir registro na tabela `chutes`
- **Lógica:** Se `resultado = 'miss'` → Subtrai `valor_aposta` do saldo

**Código do Trigger:**
```298:332:schema-supabase-final.sql
-- Função para atualizar estatísticas do usuário
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar total de apostas
    UPDATE public.usuarios 
    SET total_apostas = total_apostas + 1,
        updated_at = NOW()
    WHERE id = NEW.usuario_id;
    
    -- Se ganhou, atualizar total de ganhos
    IF NEW.resultado = 'goal' THEN
        UPDATE public.usuarios 
        SET total_ganhos = total_ganhos + NEW.premio + NEW.premio_gol_de_ouro,
            saldo = saldo + NEW.premio + NEW.premio_gol_de_ouro,
            updated_at = NOW()
        WHERE id = NEW.usuario_id;
    ELSE
        -- Se perdeu, descontar aposta do saldo
        UPDATE public.usuarios 
        SET saldo = saldo - NEW.valor_aposta,
            updated_at = NOW()
        WHERE id = NEW.usuario_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estatísticas do usuário
DROP TRIGGER IF EXISTS trigger_update_user_stats ON public.chutes;
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT ON public.chutes
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();
```

**Crédito de Prêmio:**
- **Localização:** Mesmo trigger `trigger_update_user_stats`
- **Quando:** Automaticamente quando `resultado = 'goal'`
- **Lógica:** Adiciona `premio + premio_gol_de_ouro` ao saldo
- **Problema:** Backend faz ajuste manual adicional (linha 1409-1419) que pode causar inconsistência

**Ajuste Manual (PROBLEMÁTICO):**
```1404:1420:server-fly.js
    // Ajuste de saldo:
    // - Perdas: gatilho do banco subtrai 'valor_aposta' automaticamente
    // - Vitórias: gatilho do banco credita apenas o prêmio (premio + premioGolDeOuro)
    //   Para manter a economia esperada (todos pagam a aposta), subtrair manualmente
    //   o valor da aposta apenas quando houver gol (evita dupla cobrança nas derrotas).
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

**Análise do Problema:**
- Trigger credita: `saldo = saldo + premio + premioGolDeOuro`
- Backend ajusta: `saldo = user.saldo - amount + premio + premioGolDeOuro`
- **Problema:** `user.saldo` foi lido ANTES do trigger executar, então o cálculo está usando saldo desatualizado
- **Risco:** Cálculo incorreto do saldo final

### 1.4 Como Funciona a Reentrada do Usuário

**Estado Atual:**
- Não há endpoint específico para obter lotes ativos
- Frontend usa `gameService.initialize()` que chama `/api/user/profile` e `/api/metrics`
- Lotes são gerenciados apenas no backend (cache em memória + banco)
- Usuário não precisa "entrar" em lote - lote é atribuído automaticamente ao fazer chute

**Sincronização ao Iniciar Servidor:**
```2979:3012:server-fly.js
    // ✅ SINCRONIZAR LOTES ATIVOS DO BANCO AO INICIAR
    async function syncLotesOnStartup() {
      try {
        const syncResult = await LoteService.syncActiveLotes();
        if (syncResult.success && syncResult.count > 0) {
          console.log(`✅ [STARTUP] ${syncResult.count} lotes ativos recuperados do banco`);
          // Popular cache em memória com lotes do banco
          for (const loteDb of syncResult.lotes) {
            const config = batchConfigs[loteDb.valor_aposta];
            if (config) {
              const lote = {
                id: loteDb.id,
                valor: loteDb.valor_aposta,
                ativo: loteDb.status === 'ativo',
                valorAposta: loteDb.valor_aposta,
                config: config,
                chutes: [], // Será populado conforme necessário
                status: loteDb.status === 'ativo' ? 'active' : 'completed',
                winnerIndex: loteDb.indice_vencedor,
                posicaoAtual: loteDb.posicao_atual || 0,
                createdAt: loteDb.created_at,
                totalArrecadado: parseFloat(loteDb.total_arrecadado || 0),
                premioTotal: parseFloat(loteDb.premio_total || 0)
              };
              lotesAtivos.set(loteDb.id, lote);
            }
          }
        } else {
          console.log('✅ [STARTUP] Nenhum lote ativo encontrado no banco');
        }
      } catch (error) {
        console.error('❌ [STARTUP] Erro ao sincronizar lotes:', error);
      }
    }
```

---

## 2. MAPA DE RISCOS ATUAIS

### 2.1 Riscos CRÍTICOS (Bloqueiam Operação com Dinheiro Real)

#### 🔴 CRÍTICO #1: Cálculo Incorreto de Saldo em Vitórias

**Localização:** `server-fly.js:1409-1419`

**Problema:**
- Saldo do usuário é lido ANTES do trigger executar (linha 1178)
- Ajuste manual usa `user.saldo` que não reflete o crédito do trigger
- Cálculo: `novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro`
- Mas `user.saldo` já foi atualizado pelo trigger para `user.saldo + premio + premioGolDeOuro`
- **Resultado:** Saldo final incorreto (pode ser maior ou menor que o esperado)

**Impacto:** Perda financeira para usuários ou plataforma

**Evidência:**
```1178:1196:server-fly.js
    // Verificar saldo do usuário
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('saldo')
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (user.saldo < amount) {
      return res.status(400).json({
      success: false,
        message: 'Saldo insuficiente'
      });
    }
```

E depois:
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

**Correção Necessária:**
- Ler saldo atualizado APÓS o trigger executar
- Ou remover ajuste manual e corrigir trigger para já subtrair `amount` quando for gol

#### 🔴 CRÍTICO #2: Falta de Idempotência

**Localização:** `server-fly.js:1149` (endpoint `/api/games/shoot`)

**Problema:**
- Não há `X-Idempotency-Key` implementado
- Requisições duplicadas (retry, refresh, duplo clique) podem causar múltiplos chutes
- Usuário pode ser debitado múltiplas vezes pela mesma ação

**Impacto:** Perda financeira para usuários

**Evidência:**
- Endpoint não verifica se chute já foi processado
- Não há validação de chute duplicado
- Rate limiting (100 req/15min) é muito permissivo para chutes

**Correção Necessária:**
- Implementar `X-Idempotency-Key` obrigatório
- Verificar se chute com mesma chave já foi processado
- Retornar resultado anterior se chave já existe

#### 🔴 CRÍTICO #3: Race Condition no Cache vs Banco

**Localização:** `server-fly.js:399-455` (função `getOrCreateLoteByValue`)

**Problema:**
- Cache em memória (`lotesAtivos` Map) não tem lock
- Dois requests simultâneos podem ver o mesmo estado de lote
- Ambos podem tentar adicionar chute ao mesmo lote
- Lock do banco previne inconsistência final, mas pode causar rejeições desnecessárias

**Impacto:** Chutes podem ser rejeitados incorretamente ou processados duplicados

**Evidência:**
```405:415:server-fly.js
  // Verificar cache em memória primeiro (performance)
  let loteAtivo = null;
  for (const [loteId, lote] of lotesAtivos.entries()) {
    const valorLote = typeof lote.valor !== 'undefined' ? lote.valor : lote.valorAposta;
    const ativo = typeof lote.ativo === 'boolean' ? lote.ativo : lote.status === 'active';
    // ✅ CORREÇÃO CIRÚRGICA: Verificar se lote ainda não atingiu R$10 (não fechou)
    const totalArrecadado = lote.totalArrecadado || 0;
    if (valorLote === amount && ativo && totalArrecadado < 10.00) {
      loteAtivo = lote;
      break;
    }
  }
```

**Correção Necessária:**
- Implementar lock no cache (mutex) ou remover cache completamente
- Usar apenas banco como fonte de verdade

### 2.2 Riscos ALTOS

#### 🟠 ALTO #1: Falta de Transação Atômica Completa

**Localização:** `server-fly.js:1329-1381`

**Problema:**
- Inserção de chute e atualização de saldo não estão em transação única explícita
- Se falhar após inserir chute, saldo já foi debitado pelo trigger
- Não há rollback automático

**Impacto:** Saldo pode ficar inconsistente em caso de falha

**Evidência:**
```1329:1356:server-fly.js
    // Salvar chute no banco de dados (usar tabela 'chutes' para acionar gatilhos de métricas/saldo)
    const { error: chuteError } = await supabase
      .from('chutes')
      .insert({
        usuario_id: req.user.userId,
        lote_id: lote.id,
        direcao: direction,
        valor_aposta: amount,
        resultado: result,
        premio: premio,
        premio_gol_de_ouro: premioGolDeOuro,
        is_gol_de_ouro: isGolDeOuro,
        contador_global: contadorChutesGlobal,
        shot_index: shotIndex + 1
      });

    if (chuteError) {
      console.error('❌ [SHOOT] Erro ao salvar chute:', chuteError);
    }

    // ✅ ATUALIZAR LOTE NO BANCO (persistência)
    const updateResult = await LoteService.updateLoteAfterShot(
      lote.id,
      amount,
      premio,
      premioGolDeOuro,
      isGoal
    );
```

**Mitigação Parcial:**
- Funções RPC usam transações implícitas
- Mas ajuste manual de saldo (linha 1409) está fora da transação

**Correção Necessária:**
- Usar transação explícita do Supabase
- Incluir todos os passos em uma única transação

#### 🟠 ALTO #2: Rate Limiting Muito Permissivo para Chutes

**Localização:** `server-fly.js:264-289`

**Problema:**
- Rate limiting global: 100 req/15min por IP
- Não há limite específico para endpoint `/api/games/shoot`
- Usuário pode fazer muitos chutes rapidamente

**Impacto:** Possibilidade de abuso e sobrecarga do sistema

**Evidência:**
```264:289:server-fly.js
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
```

**Correção Necessária:**
- Implementar rate limiting específico para `/api/games/shoot`
- Limite recomendado: 10 chutes/minuto por usuário autenticado

#### 🟠 ALTO #3: Cache vs Banco Dessincronizado

**Localização:** `server-fly.js:385` (variável `lotesAtivos`)

**Problema:**
- Cache em memória pode ficar dessincronizado com banco
- Se servidor reiniciar, cache é perdido (mas banco persiste)
- Sincronização só ocorre ao iniciar servidor

**Impacto:** Lotes podem aparecer como ativos quando já foram fechados

**Evidência:**
- Cache é atualizado manualmente após operações
- Não há sincronização contínua
- Se outro processo modificar banco, cache não reflete mudança

**Correção Necessária:**
- Implementar sincronização periódica ou remover cache
- Usar apenas banco como fonte de verdade

### 2.3 Riscos MÉDIOS

#### 🟡 MÉDIO #1: Contador Global em Memória

**Localização:** `server-fly.js:387`

**Problema:**
- `contadorChutesGlobal` é variável em memória
- Pode ser perdido em restart
- Há função `saveGlobalCounter()` mas não está sendo chamada consistentemente

**Impacto:** Contador pode ser resetado ou inconsistente

**Correção Necessária:**
- Sempre salvar contador após incrementar
- Usar banco como fonte de verdade

#### 🟡 MÉDIO #2: Falta de Logs de Auditoria Financeira

**Localização:** Sistema inteiro

**Problema:**
- Logs são apenas `console.log`
- Não há tabela de auditoria financeira
- Não há rastreamento de todas as transações

**Impacto:** Dificulta investigação de problemas financeiros

**Correção Necessária:**
- Implementar tabela de auditoria
- Registrar todas as operações financeiras
- Incluir timestamps, valores, usuários, IPs

#### 🟡 MÉDIO #3: Validação de Saldo com Janela de Tempo

**Localização:** `server-fly.js:1178-1196`

**Problema:**
- Saldo é verificado antes do chute
- Há janela de tempo entre verificação e débito
- Em alta concorrência, saldo pode mudar entre verificação e débito

**Impacto:** Usuário pode fazer chute com saldo insuficiente

**Mitigação Parcial:**
- Trigger do banco verifica saldo antes de debitar
- Mas validação no backend pode ser otimista

**Correção Necessária:**
- Usar lock pessimista no banco
- Verificar saldo dentro da transação

### 2.4 Riscos BAIXOS

#### 🟢 BAIXO #1: Falta de Endpoint para Obter Lotes Ativos

**Localização:** Sistema inteiro

**Problema:**
- Frontend não tem como consultar lotes ativos
- Usuário não sabe em qual lote está

**Impacto:** Experiência do usuário limitada

**Correção Necessária:**
- Implementar endpoint `/api/lotes/ativos`
- Retornar informações de lotes ativos por valor

#### 🟢 BAIXO #2: Falta de Validação de Direção

**Localização:** `server-fly.js:1154-1159`

**Problema:**
- Validação de direção é básica
- Não verifica se direção é válida (TL, TR, C, BL, BR)

**Impacto:** Requisições inválidas podem ser processadas

**Correção Necessária:**
- Adicionar validação explícita de direção

---

## 3. VEREDICTO DE PRODUÇÃO

### ❌ NÃO - Sistema NÃO pode operar com dinheiro real hoje

### Por quê?

**Riscos Críticos que Bloqueiam Operação:**

1. **Cálculo Incorreto de Saldo em Vitórias (CRÍTICO #1)**
   - Saldo final pode estar incorreto
   - Usuários podem perder dinheiro ou receber mais do que deveriam
   - **Bloqueador absoluto**

2. **Falta de Idempotência (CRÍTICO #2)**
   - Requisições duplicadas podem causar múltiplos débitos
   - Usuário pode ser cobrado múltiplas vezes pela mesma ação
   - **Bloqueador absoluto**

3. **Race Condition no Cache (CRÍTICO #3)**
   - Chutes podem ser processados incorretamente
   - Lotes podem ficar inconsistentes
   - **Bloqueador absoluto**

**Riscos Altos que Comprometem Operação:**

4. **Falta de Transação Atômica (ALTO #1)**
   - Saldo pode ficar inconsistente em caso de falha
   - Não há rollback automático

5. **Rate Limiting Permissivo (ALTO #2)**
   - Possibilidade de abuso
   - Sistema pode ser sobrecarregado

6. **Cache Dessincronizado (ALTO #3)**
   - Lotes podem aparecer como ativos quando já foram fechados
   - Dados podem estar inconsistentes

**Conclusão:**
Sistema precisa de correções críticas antes de operar com dinheiro real. Os 3 riscos críticos são bloqueadores absolutos que podem causar perdas financeiras reais para usuários ou plataforma.

---

## 4. CHECKLIST DEFINITIVO — MISSÃO D

### BLOQUEADORES (Obrigatórios Antes de Operar)

#### 🔴 BLOQUEADOR #1: Corrigir Cálculo de Saldo em Vitórias
- [ ] Remover ajuste manual de saldo (linha 1409-1419)
- [ ] Corrigir trigger para já subtrair `amount` quando for gol
- [ ] Ou: Ler saldo atualizado APÓS trigger executar
- [ ] Testar: Verificar saldo final em vitórias
- [ ] Validar: Saldo deve ser `saldo_inicial - amount + premio + premioGolDeOuro`

#### 🔴 BLOQUEADOR #2: Implementar Idempotência
- [ ] Adicionar `X-Idempotency-Key` obrigatório no endpoint `/api/games/shoot`
- [ ] Criar tabela `idempotency_keys` com campos: `key`, `user_id`, `endpoint`, `result`, `created_at`
- [ ] Verificar se chave já existe antes de processar
- [ ] Retornar resultado anterior se chave já existe
- [ ] Limpar chaves antigas (ex: > 24 horas)
- [ ] Testar: Requisições duplicadas devem retornar mesmo resultado

#### 🔴 BLOQUEADOR #3: Corrigir Race Condition no Cache
- [ ] Implementar lock (mutex) no cache `lotesAtivos`
- [ ] Ou: Remover cache completamente e usar apenas banco
- [ ] Garantir que apenas um request processa lote por vez
- [ ] Testar: Múltiplos requests simultâneos não devem causar inconsistência

### ESSENCIAIS (Logo Após Bloqueadores)

#### 🟠 ESSENCIAL #1: Transação Atômica Completa
- [ ] Usar transação explícita do Supabase
- [ ] Incluir inserção de chute, atualização de lote e ajuste de saldo em uma única transação
- [ ] Implementar rollback em caso de erro
- [ ] Testar: Falhas devem reverter todas as operações

#### 🟠 ESSENCIAL #2: Rate Limiting Específico para Chutes
- [ ] Criar rate limiter específico para `/api/games/shoot`
- [ ] Limite: 10 chutes/minuto por usuário autenticado
- [ ] Usar `req.user.userId` em vez de IP
- [ ] Testar: Usuário não deve conseguir fazer mais de 10 chutes/minuto

#### 🟠 ESSENCIAL #3: Sincronização Contínua Cache-Banco
- [ ] Implementar sincronização periódica (ex: a cada 5 segundos)
- [ ] Ou: Remover cache e usar apenas banco
- [ ] Garantir que cache sempre reflete estado do banco
- [ ] Testar: Cache deve estar sincronizado após operações

#### 🟠 ESSENCIAL #4: Logs de Auditoria Financeira
- [ ] Criar tabela `auditoria_financeira` com campos: `id`, `usuario_id`, `tipo`, `valor`, `saldo_anterior`, `saldo_posterior`, `referencia_id`, `ip`, `user_agent`, `created_at`
- [ ] Registrar todas as operações financeiras
- [ ] Incluir timestamps, valores, usuários, IPs
- [ ] Testar: Todas as transações devem ser registradas

### MELHORIAS (Não Bloqueiam Operação Inicial)

#### 🟡 MELHORIA #1: Contador Global Persistente
- [ ] Sempre salvar contador após incrementar
- [ ] Usar banco como fonte de verdade
- [ ] Recuperar contador do banco ao iniciar servidor

#### 🟡 MELHORIA #2: Endpoint para Obter Lotes Ativos
- [ ] Implementar `GET /api/lotes/ativos`
- [ ] Retornar informações de lotes ativos por valor
- [ ] Incluir progresso, arrecadação, prêmio

#### 🟡 MELHORIA #3: Validação de Direção
- [ ] Adicionar validação explícita de direção
- [ ] Verificar se direção é válida (TL, TR, C, BL, BR)
- [ ] Retornar erro 400 se direção inválida

#### 🟡 MELHORIA #4: Monitoramento e Alertas
- [ ] Implementar alertas para operações financeiras suspeitas
- [ ] Monitorar saldos negativos
- [ ] Alertar sobre inconsistências entre cache e banco

---

## 5. ESTRATÉGIA DE EXECUÇÃO

### 5.1 Quantos Blocos de Execução

**Recomendação: 3 blocos**

**BLOCO 1: Correções Críticas (BLOQUEADORES)**
- Correção de cálculo de saldo
- Implementação de idempotência
- Correção de race condition
- **Tempo estimado:** 4-6 horas
- **Risco:** Alto (mudanças críticas)

**BLOCO 2: Essenciais (ESSENCIAIS)**
- Transação atômica
- Rate limiting específico
- Sincronização cache-banco
- Logs de auditoria
- **Tempo estimado:** 3-4 horas
- **Risco:** Médio

**BLOCO 3: Melhorias (MELHORIAS)**
- Contador global persistente
- Endpoint lotes ativos
- Validação de direção
- Monitoramento
- **Tempo estimado:** 2-3 horas
- **Risco:** Baixo

### 5.2 O que NÃO Deve Ser Feito Agora

**NÃO fazer:**
- Refatoração completa do sistema
- Mudança de arquitetura
- Reescrita de componentes
- Adição de features novas
- Otimizações prematuras

**Foco:**
- Apenas correções críticas e essenciais
- Manter arquitetura atual
- Mudanças cirúrgicas e testadas

### 5.3 O que Pode Esperar Sem Risco

**Pode esperar:**
- Melhorias de UX
- Features novas
- Otimizações de performance
- Refatorações não críticas

**Prioridade:**
- Primeiro: Bloqueadores
- Segundo: Essenciais
- Terceiro: Melhorias

### 5.4 Limites de Ferramentas

**Cursor/IA:**
- Pode ajudar com código
- Mas precisa de revisão humana
- Testes devem ser feitos manualmente
- Validação financeira deve ser feita por humanos

**Recomendação:**
- Usar Cursor para gerar código
- Revisar manualmente
- Testar em ambiente de staging
- Validar com dados reais antes de produção

### 5.5 Risco de Regressão

**Mitigação:**
- Testes unitários para cada correção
- Testes de integração para fluxo completo
- Testes de carga para race conditions
- Validação manual de cálculos financeiros

**Checklist de Validação:**
- [ ] Todos os testes passam
- [ ] Cálculos financeiros estão corretos
- [ ] Idempotência funciona
- [ ] Race conditions não ocorrem
- [ ] Logs de auditoria estão completos

---

## 6. CONCLUSÃO EXECUTIVA

### Status Real do Sistema

**Estado Atual:**
- Sistema tem arquitetura funcional de lotes econômicos
- Lógica de fechamento por R$10 está implementada
- Persistência no banco está funcionando
- **MAS:** 3 riscos críticos bloqueiam operação com dinheiro real

### Nível de Risco Atual

**CRÍTICO - NÃO APTO PARA PRODUÇÃO**

**Razões:**
1. Cálculo incorreto de saldo em vitórias
2. Falta de idempotência (múltiplos débitos)
3. Race condition no cache (inconsistências)

**Impacto:**
- Perdas financeiras para usuários ou plataforma
- Inconsistências de dados
- Possibilidade de fraude

### Se a MISSÃO D é Grande ou Controlável

**CONTROLÁVEL**

**Justificativa:**
- 3 bloqueadores críticos (4-6 horas)
- 4 essenciais (3-4 horas)
- Total: 7-10 horas de trabalho focado
- Não requer reescrita completa
- Mudanças são cirúrgicas e testáveis

**Complexidade:**
- Média (não é trivial, mas é factível)
- Requer conhecimento de transações ACID
- Requer testes cuidadosos

### Próximo Passo Lógico

**Imediato (Hoje):**
1. Revisar este relatório com equipe
2. Priorizar bloqueadores críticos
3. Criar ambiente de staging para testes

**Curto Prazo (Esta Semana):**
1. Implementar BLOCO 1 (Bloqueadores)
2. Testar extensivamente
3. Validar cálculos financeiros manualmente

**Médio Prazo (Próxima Semana):**
1. Implementar BLOCO 2 (Essenciais)
2. Testes de integração
3. Preparar para produção

**Longo Prazo (Futuro):**
1. Implementar BLOCO 3 (Melhorias)
2. Monitoramento contínuo
3. Otimizações

### Recomendação Final

**NÃO liberar para produção até:**
- ✅ Todos os 3 bloqueadores críticos corrigidos
- ✅ Testes extensivos realizados
- ✅ Validação manual de cálculos financeiros
- ✅ Logs de auditoria funcionando

**Após correções:**
- Sistema estará apto para operação com dinheiro real
- Riscos restantes serão gerenciáveis
- Monitoramento contínuo será necessário

---

**Fim do Relatório**

