// Game Controller - Gol de Ouro v1.1.1
const { supabase, supabaseAdmin } = require('../database/supabase-config');

class GameController {
  constructor() {
    this.isSupabaseReal = false;
    this.initializeSupabase();
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

      res.json({
        success: true,
        data: gameStatus
      });
    } catch (error) {
      console.error('Erro ao obter status do jogo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Registrar chute
  async registerShot(req, res) {
    try {
      const { zona, potencia, angulo, valor_aposta } = req.body;

      // Validação básica
      if (!zona || !potencia || !angulo || !valor_aposta) {
        return res.status(400).json({
          success: false,
          message: 'Dados incompletos'
        });
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

      res.json({
        success: true,
        chute_id: chute.id,
        resultado: chute.resultado,
        banco: this.isSupabaseReal ? 'real' : 'memoria'
      });
    } catch (error) {
      console.error('Erro ao registrar chute:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Calcular resultado do chute
  calculateShotResult(zona, potencia, angulo) {
    const baseChance = 0.3; // 30% de chance base
    const potenciaBonus = (potencia - 50) / 100; // Bonus por potência
    const anguloPenalty = Math.abs(angulo) / 100; // Penalty por ângulo
    
    let chance = baseChance + potenciaBonus - anguloPenalty;
    chance = Math.max(0.1, Math.min(0.9, chance)); // Entre 10% e 90%
    
    const gol = Math.random() < chance;
    
    return {
      gol,
      chance: Math.round(chance * 100),
      potencia_efetiva: potencia,
      angulo_efetivo: angulo,
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

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
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

      res.json({
        success: true,
        data: chutes,
        banco: this.isSupabaseReal ? 'real' : 'memoria'
      });
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

const gameController = new GameController();

module.exports = {
  getGameStatus: gameController.getGameStatus.bind(gameController),
  registerShot: gameController.registerShot.bind(gameController),
  getGameStats: gameController.getGameStats.bind(gameController),
  getShotHistory: gameController.getShotHistory.bind(gameController)
};