// COMPONENTE GAMESHOOT CORRIGIDO - GOL DE OURO v1.2.0
// ====================================================
// Data: 21/10/2025
// Status: INTEGRAÇÃO COMPLETA COM BACKEND REAL
// Versão: v1.2.0-final-production
// GPT-4o Auto-Fix: Sistema de jogo funcional

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import InternalPageLayout from '../components/InternalPageLayout';
import Logo from '../components/Logo';
import gameService from '../services/gameService';

const GameShoot = () => {
  const navigate = useNavigate();
  
  // Estados do jogo
  const [balance, setBalance] = useState(0);
  const [shooting, setShooting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  // V1: valor fixo R$ 1 por chute — sem seleção de valor
  const betAmount = 1;
  
  // Estados das animações
  const [ballPos, setBallPos] = useState({ x: 50, y: 90 });
  const [targetStage, setTargetStage] = useState(null);
  const [goaliePose, setGoaliePose] = useState("idle");
  const [goalieStagePos, setGoalieStagePos] = useState({ x: 50, y: 62, rot: 0 });
  
  // Estados dos resultados
  const [showGoool, setShowGoool] = useState(false);
  const [showDefendeu, setShowDefendeu] = useState(false);
  const [showGanhou, setShowGanhou] = useState(false);
  const [showGoldenGoal, setShowGoldenGoal] = useState(false);
  const [showGoldenVictory, setShowGoldenVictory] = useState(false);
  const [isGoldenGoal, setIsGoldenGoal] = useState(false);
  
  // Estados das estatísticas
  const [shotsTaken, setShotsTaken] = useState(0);
  const [sessionWins, setSessionWins] = useState(0);
  const [sessionLosses, setSessionLosses] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalGoldenGoals, setTotalGoldenGoals] = useState(0);
  
  // Estados do sistema
  const [gameInfo, setGameInfo] = useState(null);
  const [globalCounter, setGlobalCounter] = useState(0);
  const [shotsUntilGoldenGoal, setShotsUntilGoldenGoal] = useState(0);
  
  // Estados de áudio
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Zonas do gol
  const GOAL_ZONES = {
    "TL": { x: 20, y: 20 },
    "TR": { x: 80, y: 20 },
    "C": { x: 50, y: 15 },
    "BL": { x: 20, y: 40 },
    "BR": { x: 80, y: 40 }
  };
  
  const DIRS = ["TL", "TR", "C", "BL", "BR"];
  
  // =====================================================
  // INICIALIZAÇÃO
  // =====================================================
  
  useEffect(() => {
    initializeGame();
  }, []);
  
  const initializeGame = async () => {
    try {
      setLoading(true);
      
      // Inicializar GameService
      const initResult = await gameService.initialize();
      
      if (initResult.success) {
        const { userData, gameInfo } = initResult;
        
        // Atualizar estados
        setBalance(userData.saldo);
        setGlobalCounter(gameInfo.goldenGoal.counter);
        setShotsUntilGoldenGoal(gameInfo.goldenGoal.shotsUntilNext);
        setGameInfo(gameInfo);
        
        console.log('✅ [GAME] Jogo inicializado com sucesso');
        console.log(`💰 [GAME] Saldo: R$ ${userData.saldo}`);
        console.log(`📊 [GAME] Contador global: ${gameInfo.goldenGoal.counter}`);
        
      } else {
        throw new Error(initResult.error || 'Erro ao inicializar jogo');
      }
      
    } catch (error) {
      console.error('❌ [GAME] Erro ao inicializar:', error);
      setError('Erro ao carregar dados do jogo');
      toast.error('Erro ao carregar dados do jogo');
    } finally {
      setLoading(false);
    }
  };
  
  // =====================================================
  // FUNÇÕES DE ANIMAÇÃO
  // =====================================================
  
  function goalToStage(goal) {
    return {
      x: goal.x,
      y: goal.y
    };
  }
  
  function goalieTargetFor(dir) {
    const base = goalToStage(GOAL_ZONES[dir]);
    const centerX = 50;
    const centerY = 62;
    
    const isLateral = dir === "TL" || dir === "TR" || dir === "BL" || dir === "BR";
    const reductionFactor = isLateral ? 0.64 : 0.8;
    
    const offsetX = (base.x - centerX) * reductionFactor;
    const offsetY = (base.y - centerY) * reductionFactor;
    
    return { 
      x: centerX + offsetX, 
      y: centerY + offsetY, 
      rot: dir==="TL"||dir==="BL" ? -10 : dir==="TR"||dir==="BR" ? 10 : 0 
    };
  }
  
  // =====================================================
  // SISTEMA DE CHUTES CORRIGIDO
  // =====================================================
  
  const handleShoot = async (dir) => {
    if (shooting || balance < betAmount) return;
    
    setShooting(true);
    setError("");
    
    try {
      // Tocar som de chute
      if (audioEnabled) {
        // audioManager.playKickSound();
      }
      
      // Animação da bola
      const t = goalToStage(GOAL_ZONES[dir]);
      setTargetStage(t);
      requestAnimationFrame(() => setBallPos({ x: t.x, y: t.y }));
      
      // Processar chute no backend (V1: sempre R$ 1)
      const result = await gameService.processShot(dir, betAmount);
      
      if (result.success) {
        const { shot, user, isGoldenGoal: isGoldenGoalShot } = result;
        const isGoal = shot.isWinner;
        const prize = shot.prize + shot.goldenGoalPrize;
        
        // Atualizar estados
        setBalance(user.newBalance);
        setGlobalCounter(user.globalCounter);
        setIsGoldenGoal(isGoldenGoalShot);
        
        // Animação do goleiro baseada no resultado
        let goalieDirection;
        if (isGoal) {
          const otherDirections = DIRS.filter(d => d !== dir);
          goalieDirection = otherDirections[Math.floor(Math.random() * otherDirections.length)];
        } else {
          goalieDirection = dir;
        }
        
        const gTarget = goalieTargetFor(goalieDirection);
        setGoaliePose(goalieDirection);
        requestAnimationFrame(() => setGoalieStagePos(gTarget));
        
        // Mostrar resultado após animação
        setTimeout(() => {
          if (isGoal) {
            if (isGoldenGoalShot) {
              setShowGoldenGoal(true);
              toast.success(`🏆 GOL DE OURO! Você ganhou R$ ${prize}!`);
            } else {
              setShowGoool(true);
              toast.success(`⚽ GOL! Você ganhou R$ ${prize}!`);
            }
          } else {
            setShowDefendeu(true);
            toast.info('🥅 Defesa! Tente novamente.');
          }
          
          // Atualizar estatísticas
          setShotsTaken(prev => prev + 1);
          
          if (isGoal) {
            setSessionWins(prev => prev + 1);
            setCurrentStreak(prev => {
              const newStreak = prev + 1;
              if (newStreak > bestStreak) {
                setBestStreak(newStreak);
              }
              return newStreak;
            });
            
            if (isGoldenGoalShot) {
              setTotalGoldenGoals(prev => prev + 1);
            }
          } else {
            setSessionLosses(prev => prev + 1);
            setCurrentStreak(0);
          }
          
          // Atualizar contador global
          setShotsUntilGoldenGoal(gameService.getShotsUntilGoldenGoal());
          
          // Resetar animações
          setTimeout(() => {
            resetAnimations();
          }, 3000);
          
        }, 950);
        
      } else {
        throw new Error(result.error || 'Erro ao processar chute');
      }
      
    } catch (error) {
      console.error('❌ [GAME] Erro ao processar chute:', error);
      setError(error.message);
      toast.error(error.message);
      
      // Resetar animações em caso de erro
      setTimeout(() => {
        resetAnimations();
      }, 1000);
    }
  };
  
  const resetAnimations = () => {
    setBallPos({ x: 50, y: 90 });
    setTargetStage(null);
    setShowGoool(false);
    setShowDefendeu(false);
    setShowGanhou(false);
    setShowGoldenGoal(false);
    setShowGoldenVictory(false);
    setGoaliePose("idle");
    setGoalieStagePos({ x: 50, y: 62, rot: 0 });
    setShooting(false);
  };
  
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    console.log('🔊 Toggle Audio:', !audioEnabled ? 'ON' : 'OFF');
  };
  
  // =====================================================
  // RENDERIZAÇÃO
  // =====================================================
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando jogo...</div>
      </div>
    );
  }
  
  return (
    <InternalPageLayout title="Gol de Ouro">
    <div className="flex-1 bg-gradient-to-br from-gray-900 to-slate-900 text-white">
        <div className="p-6">
          {/* Header */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">⚽ Gol de Ouro</h1>
                <p className="text-white/70 mt-1">Escolha uma zona e chute ao gol!</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-white/70">Saldo</p>
                  <p className="text-2xl font-bold text-yellow-400">R$ {balance.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => navigate('/pagamentos')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  💳 Recarregar
                </button>
              </div>
            </div>
          </div>
          
          {/* V1: Economia fixa — R$ 1 por chute, lote 10 chutes, prêmio R$ 5 */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/10 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2">💰 Valor da Aposta</h2>
            <p className="text-white/90 text-lg font-medium">R$ 1,00 por chute</p>
            <p className="text-white/70 text-sm mt-1">Cada lote tem 10 chutes. O gol sai no 10º chute. Prêmio: R$ 5,00.</p>
          </div>
          
          {/* Campo de Futebol */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/10 shadow-xl">
            <div className="relative mx-auto" style={{ width: '400px', height: '300px' }}>
              {/* Campo */}
              <div className="absolute inset-0 bg-green-600 rounded-lg border-4 border-white">
                {/* Linhas do campo */}
                <div className="absolute inset-4 border-2 border-white rounded-lg"></div>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-white"></div>
                
                {/* Gol */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-4 border-white bg-transparent"></div>
                
                {/* Zonas clicáveis */}
                {Object.entries(GOAL_ZONES).map(([zone, pos]) => (
                  <button
                    key={zone}
                    onClick={() => handleShoot(zone)}
                    disabled={shooting || balance < betAmount}
                    className={`absolute w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                      shooting || balance < betAmount
                        ? 'bg-gray-500 border-gray-400 cursor-not-allowed'
                        : 'bg-yellow-400 border-yellow-300 hover:bg-yellow-300 hover:scale-110 cursor-pointer'
                    }`}
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    title={`Chutar para ${zone}`}
                  >
                    <span className="text-xs font-bold text-black">{zone}</span>
                  </button>
                ))}
                
                {/* Bola */}
                <div
                  className="absolute w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-500 ease-out"
                  style={{
                    left: `${ballPos.x}%`,
                    top: `${ballPos.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  ⚽
                </div>
                
                {/* Goleiro */}
                <div
                  className="absolute w-8 h-8 bg-blue-500 rounded-full border-2 border-blue-300 transition-all duration-300"
                  style={{
                    left: `${goalieStagePos.x}%`,
                    top: `${goalieStagePos.y}%`,
                    transform: `translate(-50%, -50%) rotate(${goalieStagePos.rot}deg)`
                  }}
                >
                  🥅
                </div>
              </div>
            </div>
            
            {/* Animações de resultado */}
            {showGoool && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-6xl font-bold text-yellow-400 animate-bounce">
                  ⚽ GOOOL!
                </div>
              </div>
            )}
            
            {showDefendeu && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-6xl font-bold text-blue-400 animate-bounce">
                  🥅 DEFENDEU!
                </div>
              </div>
            )}
            
            {showGoldenGoal && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-6xl font-bold text-yellow-400 animate-pulse">
                  🏆 GOL DE OURO!
                </div>
              </div>
            )}
          </div>
          
          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 text-center">
              <p className="text-2xl font-bold text-green-400">{sessionWins}</p>
              <p className="text-white/70 text-sm">Gols</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 text-center">
              <p className="text-2xl font-bold text-red-400">{sessionLosses}</p>
              <p className="text-white/70 text-sm">Defesas</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 text-center">
              <p className="text-2xl font-bold text-blue-400">{currentStreak}</p>
              <p className="text-white/70 text-sm">Sequência</p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 text-center">
              <p className="text-2xl font-bold text-yellow-400">{totalGoldenGoals}</p>
              <p className="text-white/70 text-sm">Gols de Ouro</p>
            </div>
          </div>
          
          {/* Sistema Gol de Ouro */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">🏆 Sistema Gol de Ouro</h2>
            <div className="text-center">
              <p className="text-lg text-white/80 mb-2">
                Chutes até próximo Gol de Ouro: <span className="font-bold text-yellow-400">{shotsUntilGoldenGoal}</span>
              </p>
              <p className="text-sm text-white/60">
                A cada 1000 chutes, um jogador ganha R$ 100 extra!
              </p>
            </div>
          </div>
          
          {/* Controles */}
          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={toggleAudio}
              className={`px-4 py-2 rounded-lg transition-colors ${
                audioEnabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}
            >
              {audioEnabled ? '🔊 Áudio ON' : '🔇 Áudio OFF'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              📊 Dashboard
            </button>
          </div>
        </div>
      </div>
    </InternalPageLayout>
  );
};

export default GameShoot;

// =====================================================
// COMPONENTE GAMESHOOT CORRIGIDO v1.2.0 - PRODUÇÃO REAL 100%
// =====================================================
