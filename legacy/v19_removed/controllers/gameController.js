// Game Controller - Gol de Ouro v1.3.0 - PADRONIZADO
const { supabase, supabaseAdmin } = require('../database/supabase-unified-config');
const crypto = require('crypto');
const response = require('../utils/response-helper');
const LoteService = require('../services/loteService');
const RewardService = require('../services/rewardService');
const LoteIntegrityValidator = require('../utils/lote-integrity-validator');

class GameController {
  constructor() {
    this.isSupabaseReal = false;
    this.dependencies = null; // Será injetado pelo servidor
    this.loteIntegrityValidator = new LoteIntegrityValidator();
    this.initializeSupabase();
  }

  // ✅ FASE 9 ETAPA 5: Injeção de dependências do servidor
  static injectDependencies(deps) {
    const instance = gameController;
    instance.dependencies = deps;
  }

  async initializeSupabase() {
    try {
      if (supabase && supabaseAdmin) {
        this.isSupabaseReal = true;
        console.log('✅ GameController: Supabase REAL configurado');
      }
    } catch (error) {
      console.log('⚠️ GameController: Supabase não disponível');
    }
  }

  // Obter status do jogo
  async getGameStatus(req, res) {
    try {
      const gameStatus = {
        status: 'active',
        sistema: 'LOTES (10 chutes, 1 ganhador, 9 defendidos)',
        lote_atual: {
          id: `lote_${Date.now()}`,
          chutes_coletados: 0,
          tamanho_maximo: 10,
          status: 'coletando'
        },
        estatisticas: {
          total_chutes: 0,
          total_gols: 0,
          total_usuarios: 0,
          premio_total: 0
        },
        banco: this.isSupabaseReal ? 'real' : 'memoria'
      };

      return response.success(res, gameStatus, 'Status do jogo obtido com sucesso!');
    } catch (error) {
      console.error('Erro ao obter status do jogo:', error);
      return response.serverError(res, error, 'Erro interno do servidor.');
    }
  }

  // Registrar chute
  async registerShot(req, res) {
    try {
      const { zona, potencia, angulo, valor_aposta } = req.body;

      // Validação básica
      if (!zona || potencia === undefined || angulo === undefined || !valor_aposta) {
        return response.validationError(res, 'Dados incompletos. Campos obrigatórios: zona, potencia, angulo, valor_aposta');
      }

      const chute = {
        id: Date.now(),
        zona,
        potencia,
        angulo,
        valor_aposta,
        timestamp: new Date().toISOString(),
        resultado: this.calculateShotResult(zona, potencia, angulo)
      };

      // Salvar no banco real se disponível
      if (this.isSupabaseReal) {
        try {
          const { data, error } = await supabaseAdmin
            .from('chutes')
            .insert([chute])
            .select()
            .single();

          if (error) throw error;
          chute.id = data.id;
        } catch (error) {
          console.log('⚠️ Erro ao salvar no Supabase, usando memória');
        }
      }

      return response.success(
        res,
        {
          chute_id: chute.id,
          resultado: chute.resultado,
          banco: this.isSupabaseReal ? 'real' : 'memoria'
        },
        'Chute registrado com sucesso!',
        201
      );
    } catch (error) {
      console.error('Erro ao registrar chute:', error);
      return response.serverError(res, error, 'Erro interno do servidor.');
    }
  }

  // Calcular resultado do chute (usando crypto para aleatoriedade segura)
  calculateShotResult(zona, potencia, angulo) {
    const baseChance = 0.3; // 30% de chance base
    const potenciaBonus = (potencia - 50) / 100; // Bonus por potência
    const anguloPenalty = Math.abs(angulo) / 100; // Penalty por ângulo
    
    let chance = baseChance + potenciaBonus - anguloPenalty;
    chance = Math.max(0.1, Math.min(0.9, chance)); // Entre 10% e 90%
    
    // Usar crypto.randomBytes para aleatoriedade segura
    const randomBytes = crypto.randomBytes(4);
    const randomValue = randomBytes.readUInt32BE(0) / 0xFFFFFFFF;
    const gol = randomValue < chance;
    
    return {
      gol,
      chance: Math.round(chance * 100),
      potencia_efetiva: Math.min(Math.max(potencia, 0), 100),
      angulo_efetivo: Math.min(Math.max(angulo, -180), 180),
      zona_efetiva: zona
    };
  }

  // Obter estatísticas do jogo
  async getGameStats(req, res) {
    try {
      let stats = {
        total_chutes: 0,
        total_gols: 0,
        total_usuarios: 0,
        premio_total: 0,
        banco: this.isSupabaseReal ? 'real' : 'memoria'
      };

      if (this.isSupabaseReal) {
        try {
          // Buscar estatísticas do Supabase
          const { data: chutesData } = await supabaseAdmin
            .from('chutes')
            .select('*');
          
          const { data: usuariosData } = await supabaseAdmin
            .from('usuarios')
            .select('*');

          if (chutesData) {
            stats.total_chutes = chutesData.length;
            stats.total_gols = chutesData.filter(c => c.gol_marcado).length;
          }

          if (usuariosData) {
            stats.total_usuarios = usuariosData.length;
          }
        } catch (error) {
          console.log('⚠️ Erro ao buscar estatísticas do Supabase');
        }
      }

      return response.success(res, stats, 'Estatísticas obtidas com sucesso!');
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return response.serverError(res, error, 'Erro interno do servidor.');
    }
  }

  // Obter histórico de chutes
  async getShotHistory(req, res) {
    try {
      let chutes = [];

      if (this.isSupabaseReal) {
        try {
          const { data, error } = await supabaseAdmin
            .from('chutes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) throw error;
          chutes = data || [];
        } catch (error) {
          console.log('⚠️ Erro ao buscar histórico do Supabase');
        }
      }

      return response.success(
        res,
        {
          chutes: chutes,
          banco: this.isSupabaseReal ? 'real' : 'memoria',
          total: chutes.length
        },
        'Histórico de chutes obtido com sucesso!'
      );
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      return response.serverError(res, error, 'Erro interno do servidor.');
    }
  }

  // ✅ FASE 9 ETAPA 5: Método shoot refatorado com injeção de dependências
  async shoot(req, res) {
    try {
      // Verificar se dependências foram injetadas
      if (!this.dependencies) {
        console.error('❌ [SHOOT] Dependências não injetadas no GameController');
        return res.status(500).json({
          success: false,
          message: 'Sistema temporariamente indisponível'
        });
      }

      const { direction, amount } = req.body;
      const {
        dbConnected,
        supabase: supabaseInstance,
        getOrCreateLoteByValue,
        batchConfigs,
        contadorChutesGlobal,
        ultimoGolDeOuro,
        saveGlobalCounter,
        incrementGlobalCounter,
        setUltimoGolDeOuro
      } = this.dependencies;
      
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
      if (!dbConnected || !supabaseInstance) {
        return res.status(503).json({
          success: false,
          message: 'Sistema temporariamente indisponível'
        });
      }

      // Verificar saldo do usuário
      const { data: user, error: userError } = await supabaseInstance
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

      // Obter ou criar lote para este valor (persistido no banco)
      const lote = await getOrCreateLoteByValue(amount);
      
      // Validar integridade do lote antes de processar chute
      const integrityValidation = this.loteIntegrityValidator.validateBeforeShot(lote, {
        direction: direction,
        amount: amount,
        userId: req.user.userId
      });

      if (!integrityValidation.valid) {
        console.error('❌ [SHOOT] Problema de integridade do lote:', integrityValidation.error);
        console.error('❌ [SHOOT] Detalhes:', integrityValidation.details);
        console.error('❌ [SHOOT] Lote:', JSON.stringify(lote, null, 2));
        return res.status(400).json({
          success: false,
          message: integrityValidation.error,
          details: integrityValidation.details || [],
          loteId: lote?.id,
          loteValor: lote?.valor,
          loteChutes: lote?.chutes?.length || 0
        });
      }
      
      // Incrementar contador global
      const currentCounter = incrementGlobalCounter();
      
      // Verificar se é Gol de Ouro (a cada 1000 chutes)
      const isGolDeOuro = currentCounter % 1000 === 0;
      
      // Salvar contador no Supabase
      await saveGlobalCounter();
      
      // Determinar se é gol baseado no sistema de lotes
      const shotIndex = lote.chutes.length;
      const isGoal = shotIndex === lote.winnerIndex;
      const result = isGoal ? 'goal' : 'miss';
      
      let premio = 0;
      let premioGolDeOuro = 0;
      
      if (isGoal) {
        // Prêmio normal: R$5 fixo (independente do valor apostado)
        premio = 5.00;
        
        // Gol de Ouro: R$100 adicional
        if (isGolDeOuro) {
          premioGolDeOuro = 100.00;
          setUltimoGolDeOuro(currentCounter);
          console.log(`🏆 [GOL DE OURO] Chute #${currentCounter} - Prêmio: R$ ${premioGolDeOuro}`);
        }
        
        // Encerrar o lote imediatamente após o gol (um vencedor por lote)
        lote.status = 'completed';
        lote.ativo = false;
      }
      
      // Adicionar chute ao lote
      const chute = {
        id: `${lote.id}_${shotIndex}`,
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
      lote.totalArrecadado += amount;
      lote.premioTotal += premio + premioGolDeOuro;

      // Validar integridade do lote após adicionar chute
      const postShotValidation = this.loteIntegrityValidator.validateAfterShot(lote, {
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

      // Salvar chute no banco de dados
      const { data: chuteData, error: chuteError } = await supabaseInstance
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
          contador_global: currentCounter,
          shot_index: shotIndex + 1
        })
        .select('id')
        .single();

      if (chuteError) {
        console.error('❌ [SHOOT] Erro ao salvar chute:', chuteError);
      }

      const chuteId = chuteData?.id || null;

      // Verificar se lote está completo
      if (lote.chutes.length >= lote.config.size && lote.status !== 'completed') {
        lote.status = 'completed';
        lote.ativo = false;
        console.log(`🏆 [LOTE] Lote ${lote.id} completado: ${lote.chutes.length} chutes, R$${lote.totalArrecadado} arrecadado, R$${lote.premioTotal} em prêmios`);
      }

      // ✅ PERSISTÊNCIA DE LOTES: Atualizar lote no banco após chute
      if (dbConnected && supabaseInstance && lote.id) {
        try {
          const updateResult = await LoteService.updateLoteAfterShot(
            lote.id,
            amount,
            premio,
            premioGolDeOuro,
            isGoal
          );

          if (updateResult.success && updateResult.lote) {
            if (updateResult.lote.is_complete) {
              lote.status = 'completed';
              lote.ativo = false;
            }
            lote.totalArrecadado = parseFloat(updateResult.lote.total_arrecadado || lote.totalArrecadado);
            lote.premioTotal = parseFloat(updateResult.lote.premio_total || lote.premioTotal);
          } else {
            console.error(`❌ [SHOOT] Erro ao atualizar lote no banco: ${updateResult.error}`);
          }
        } catch (error) {
          console.error(`❌ [SHOOT] Exceção ao atualizar lote no banco: ${error.message}`);
        }
      }
      
      const shootResult = {
        loteId: lote.id,
        direction,
        amount,
        result,
        premio,
        premioGolDeOuro,
        isGolDeOuro,
        contadorGlobal: currentCounter,
        timestamp: new Date().toISOString(),
        playerId: req.user.userId,
        loteProgress: {
          current: lote.chutes.length,
          total: lote.config.size,
          remaining: lote.config.size - lote.chutes.length
        },
        isLoteComplete: lote.status === 'completed'
      };

      // ✅ FASE 5: Sistema de Recompensas ACID
      if (isGoal) {
        // Creditar prêmio normal (R$5)
        if (premio > 0) {
          const rewardResult = await RewardService.creditReward(
            req.user.userId,
            lote.id,
            chuteId,
            'gol_normal',
            premio,
            `Prêmio por gol no lote ${lote.id}`,
            {
              lote_id: lote.id,
              chute_id: chuteId,
              shot_index: shotIndex + 1,
              contador_global: currentCounter
            }
          );

          if (rewardResult.success) {
            shootResult.rewardId = rewardResult.rewardId;
            shootResult.saldoPosterior = rewardResult.saldoPosterior;
            console.log(`✅ [SHOOT] Recompensa de gol normal creditada: R$${premio} (reward_id: ${rewardResult.rewardId})`);
          } else {
            console.error(`❌ [SHOOT] Erro ao creditar recompensa de gol normal: ${rewardResult.error}`);
          }
        }

        // Creditar Gol de Ouro (R$100 adicional)
        if (premioGolDeOuro > 0) {
          const goldenRewardResult = await RewardService.creditReward(
            req.user.userId,
            lote.id,
            chuteId,
            'gol_de_ouro',
            premioGolDeOuro,
            `Gol de Ouro! Chute #${currentCounter}`,
            {
              lote_id: lote.id,
              chute_id: chuteId,
              shot_index: shotIndex + 1,
              contador_global: currentCounter,
              is_gol_de_ouro: true
            }
          );

          if (goldenRewardResult.success) {
            shootResult.goldenRewardId = goldenRewardResult.rewardId;
            shootResult.saldoPosterior = goldenRewardResult.saldoPosterior;
            console.log(`🏆 [SHOOT] Recompensa de Gol de Ouro creditada: R$${premioGolDeOuro} (reward_id: ${goldenRewardResult.rewardId})`);
          } else {
            console.error(`❌ [SHOOT] Erro ao creditar recompensa de Gol de Ouro: ${goldenRewardResult.error}`);
          }
        }
      }
      
      console.log(`⚽ [SHOOT] Chute #${currentCounter}: ${result} por usuário ${req.user.userId}`);
      
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
  }
}

const gameController = new GameController();

module.exports = {
  getGameStatus: gameController.getGameStatus.bind(gameController),
  registerShot: gameController.registerShot.bind(gameController),
  getGameStats: gameController.getGameStats.bind(gameController),
  getShotHistory: gameController.getShotHistory.bind(gameController),
  shoot: gameController.shoot.bind(gameController),
  injectDependencies: GameController.injectDependencies
};