// GAME FINAL - VERSÃO DEFINITIVA E ESTÁVEL
// ====================================================
// Arquitetura profissional de Game Stage fixa (1920x1080)
// Todas as posições em PX fixo via layoutConfig.js
// Backend simulado | Estado único | Sem loops | Sem travamentos
// Data: 2025-01-27
// Status: VERSÃO VALIDADA ANTES DAS MELHORIAS

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Logo from '../components/Logo';
import {
  STAGE,
  BALL,
  GOALKEEPER,
  TARGETS,
  OVERLAYS,
  HUD,
  DIRECTION_TO_GOALKEEPER_JUMP,
  getTargetPosition
} from '../game/layoutConfig';
import './game-scene.css';
import './game-shoot.css';

// =====================================================
// ESTADO ÚNICO DO JOGO
// =====================================================
const GAME_PHASE = {
  IDLE: 'IDLE',           // Aguardando input
  SHOOTING: 'SHOOTING',   // Animação de chute (bola + goleiro juntos)
  RESULT: 'RESULT',       // Mostrando resultado
  RESET: 'RESET'          // Resetando para IDLE
};

// =====================================================
// BACKEND SIMULADO - Funções de simulação
// =====================================================
const simulateInitializeGame = async () => {
  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    userData: {
      saldo: 100.00
    },
    gameInfo: {
      goldenGoal: {
        shotsUntilNext: 10
      }
    }
  };
};

const simulateProcessShot = async (direction, betAmount) => {
  // Simular delay de processamento (mínimo para não atrasar animação)
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Simular resultado (20% de chance de gol - conforme relatório)
  const isGoal = Math.random() < 0.2;
  // Gol de ouro: a cada 10 chutes (se for gol)
  const globalCounter = Math.floor(Math.random() * 100);
  const isGoldenGoal = isGoal && (globalCounter % 10 === 0);
  
  return {
    success: true,
    shot: {
      isWinner: isGoal,
      isGoldenGoal: isGoldenGoal,
      prize: isGoal ? betAmount * 1.5 : 0, // Prêmio: Aposta × 1.5 (conforme relatório)
      goldenGoalPrize: isGoldenGoal ? 100 : 0 // Prêmio Gol de Ouro: R$ 100 (conforme relatório)
    },
    user: {
      newBalance: isGoal ? 100 + (betAmount * 1.5) + (isGoldenGoal ? 100 : 0) : 100 - betAmount,
      globalCounter: globalCounter
    },
    isGoldenGoal: isGoldenGoal
  };
};

// =====================================================
// ASSETS
// =====================================================
import goalieIdle from '../assets/goalie_idle.png';
import goalieDiveTL from '../assets/goalie_dive_tl.png';
import goalieDiveTR from '../assets/goalie_dive_tr.png';
import goalieDiveBL from '../assets/goalie_dive_bl.png';
import goalieDiveBR from '../assets/goalie_dive_br.png';
import goalieDiveMid from '../assets/goalie_dive_mid.png';
import ballImg from '../assets/ball.png';
import bgGoalImg from '../assets/bg_goal.jpg';
import gooolImg from '../assets/goool.png';
import defendeuImg from '../assets/defendeu.png';
import ganhouImg from '../assets/ganhou.png';
import goldenGoalImg from '../assets/golden-goal.png';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================
const GameFinal = () => {
  const navigate = useNavigate();
  
  // =====================================================
  // ESTADO ÚNICO
  // =====================================================
  const [gamePhase, setGamePhase] = useState(GAME_PHASE.IDLE);
  const [balance, setBalance] = useState(0);
  const [currentBet, setCurrentBet] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Estados de animação (em pixels fixos do layoutConfig)
  // Posição inicial da bola: x: 1000, y: 1010 (ajustado)
  const [ballPos, setBallPos] = useState(BALL?.START || { x: 1000, y: 1010 });
  const [goaliePose, setGoaliePose] = useState('idle');
  const [goaliePos, setGoaliePos] = useState({ 
    ...(GOALKEEPER?.IDLE || { x: 960, y: 690 }), 
    rot: GOALKEEPER?.ROTATION_IDLE || 0 
  });
  
  // Garantir que a posição inicial da bola seja sempre atualizada do layoutConfig
  useEffect(() => {
    if (BALL?.START) {
      setBallPos(BALL.START);
    }
  }, []);
  
  // Estados de resultado
  const [showGoool, setShowGoool] = useState(false);
  const [showDefendeu, setShowDefendeu] = useState(false);
  const [showGanhou, setShowGanhou] = useState(false);
  const [showGoldenGoal, setShowGoldenGoal] = useState(false);
  
  // Estatísticas
  const [shotsTaken, setShotsTaken] = useState(0);
  const [sessionWins, setSessionWins] = useState(0);
  const [shotsUntilGoldenGoal, setShotsUntilGoldenGoal] = useState(10);
  const [totalGoldenGoals, setTotalGoldenGoals] = useState(0);
  const [totalWinnings, setTotalWinnings] = useState(0);
  
  // Refs para timers
  const timersRef = useRef([]);
  
  // Estado de escala do jogo
  const [gameScale, setGameScale] = useState(1);
  
  // =====================================================
  // FUNÇÕES DE ÁUDIO SIMPLES
  // =====================================================
  const [isMuted, setIsMuted] = useState(false);
  const crowdAudioRef = useRef(null);
  
  const playSound = useCallback((soundFile) => {
    if (isMuted) return;
    try {
      const audio = new Audio(soundFile);
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } catch (error) {
      // Ignorar erros de áudio
    }
  }, [isMuted]);
  
  const playKickSound = useCallback(() => playSound('/sounds/kick.mp3'), [playSound]);
  
  // Áudio de gol com corte: inicia em 4s e para em 10s
  const playGoalSound = useCallback(() => {
    if (isMuted) return;
    try {
      const audio = new Audio('/sounds/gol.mp3');
      audio.volume = 0.7;
      
      // Função para iniciar no segundo 4
      const startAt4 = () => {
        audio.currentTime = 4;
      };
      
      // Função para parar no segundo 10
      const stopAt10 = () => {
        if (audio.currentTime >= 10) {
          audio.pause();
          audio.currentTime = 0;
          audio.removeEventListener('timeupdate', stopAt10);
        }
      };
      
      // Quando os metadados estiverem carregados, definir o ponto de início
      audio.addEventListener('loadedmetadata', startAt4);
      
      // Monitorar o tempo e parar no segundo 10
      audio.addEventListener('timeupdate', stopAt10);
      
      audio.play().catch(() => {});
    } catch (error) {
      // Ignorar erros de áudio
    }
  }, [isMuted]);
  
  const playDefenseSound = useCallback(() => playSound('/sounds/defesa.mp3'), [playSound]);
  
  // Áudio de torcida em loop
  useEffect(() => {
    if (!crowdAudioRef.current) {
      crowdAudioRef.current = new Audio('/sounds/torcida.mp3');
      crowdAudioRef.current.loop = true;
      crowdAudioRef.current.volume = 0.12; // Volume reduzido em 30% (de 0.175 para 0.12)
    }
    
    const crowdAudio = crowdAudioRef.current;
    
    if (!isMuted && !loading) {
      crowdAudio.play().catch(() => {
        // Ignorar erro se o navegador bloquear autoplay
      });
    } else {
      crowdAudio.pause();
    }
    
    // Cleanup quando componente desmonta ou quando muted/loading muda
    return () => {
      if (crowdAudio) {
        crowdAudio.pause();
        crowdAudio.currentTime = 0;
      }
    };
  }, [isMuted, loading]);
  
  // =====================================================
  // FUNÇÕES AUXILIARES
  // =====================================================
  const getGoalieImage = useCallback((pose) => {
    switch(pose) {
      case 'TL': return goalieDiveTL;
      case 'TR': return goalieDiveTR;
      case 'BL': return goalieDiveBL;
      case 'BR': return goalieDiveBR;
      case 'C': return goalieDiveMid;
      default: return goalieIdle;
    }
  }, []);
  
  // Obter posição do goleiro baseado na direção
  const getGoalieJumpPosition = useCallback((direction) => {
    if (!DIRECTION_TO_GOALKEEPER_JUMP || !GOALKEEPER?.JUMPS) {
      return GOALKEEPER?.IDLE || { x: 960, y: 520, rot: 0 };
    }
    const jumpKey = DIRECTION_TO_GOALKEEPER_JUMP[direction];
    return GOALKEEPER.JUMPS[jumpKey] || GOALKEEPER.IDLE || { x: 960, y: 520, rot: 0 };
  }, []);
  
  
  const addTimer = useCallback((timer) => {
    timersRef.current.push(timer);
    return timer;
  }, []);
  
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    timersRef.current = [];
  }, []);
  
  // =====================================================
  // CÁLCULO DE ESCALA DO GAME STAGE (função estável)
  // =====================================================
  const calculateScale = useCallback(() => {
    if (typeof window === 'undefined') return 1;
    const stageWidth = STAGE?.WIDTH || 1920;
    const stageHeight = STAGE?.HEIGHT || 1080;
    const scaleX = window.innerWidth / stageWidth;
    const scaleY = window.innerHeight / stageHeight;
    return Math.min(scaleX, scaleY) || 1;
  }, []);
  
  // Ref para evitar loops no resize
  const resizeTimerRef = useRef(null);
  const isInitializedRef = useRef(false);
  
  // =====================================================
  // INICIALIZAÇÃO E RESIZE (APENAS UMA VEZ)
  // =====================================================
  useEffect(() => {
    // Prevenir múltiplas inicializações
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    // Ativar CSS da página
    if (typeof document !== 'undefined' && document.body) {
      document.body.setAttribute('data-page', 'game');
    }
    
    // Calcular escala inicial
    const initialScale = calculateScale();
    setGameScale(initialScale);
    
    // Listener de resize com debounce (apenas uma vez)
    const handleResize = () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      resizeTimerRef.current = setTimeout(() => {
        const newScale = calculateScale();
        // Só atualiza se a escala mudou significativamente (evita micro-updates)
        setGameScale(prevScale => {
          const diff = Math.abs(newScale - prevScale);
          // Só atualiza se a diferença for maior que 0.001 (evita re-renders desnecessários)
          return diff > 0.001 ? newScale : prevScale;
        });
      }, 200); // Aumentado para 200ms para reduzir frequência
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Inicializar jogo (apenas uma vez) - Backend Simulado
    const init = async () => {
      try {
        setLoading(true);
        const result = await simulateInitializeGame();
        
        if (result && result.success) {
          const saldo = result.userData?.saldo || 100.00;
          setBalance(saldo);
          const shotsUntilNext = result.gameInfo?.goldenGoal?.shotsUntilNext || 10;
          setShotsUntilGoldenGoal(shotsUntilNext);
        }
      } catch (error) {
        console.error('Erro ao inicializar:', error);
        setBalance(100.00); // Fallback para saldo simulado
      } finally {
        setLoading(false);
      }
    };
    
    init();
    
    // Cleanup (apenas quando componente desmonta)
    return () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      window.removeEventListener('resize', handleResize);
      clearAllTimers();
      if (typeof document !== 'undefined' && document.body) {
        document.body.removeAttribute('data-page');
      }
      // NÃO resetar isInitializedRef para evitar loops
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vazio - executa apenas uma vez na montagem
  
  // =====================================================
  // RESET VISUAL
  // =====================================================
  const resetVisuals = useCallback(() => {
    clearAllTimers();
    setBallPos(BALL?.START || { x: 1000, y: 1010 });
    setGoaliePose('idle');
    setGoaliePos({ 
      ...(GOALKEEPER?.IDLE || { x: 960, y: 690 }), 
      rot: GOALKEEPER?.ROTATION_IDLE || 0 
    });
    setShowGoool(false);
    setShowDefendeu(false);
    setShowGanhou(false);
    setShowGoldenGoal(false);
  }, [clearAllTimers]);
  
  // =====================================================
  // HANDLE SHOOT - LÓGICA CLARA E SEM AMBIGUIDADE
  // =====================================================
  const handleShoot = useCallback(async (direction) => {
    // Validar fase
    if (gamePhase !== GAME_PHASE.IDLE) {
      return;
    }
    
    // Validar saldo
    if (balance < currentBet) {
      console.log('⚠️ [GAMEFINAL] Saldo insuficiente:', balance, '<', currentBet);
      toast.error(`Saldo insuficiente. Seu saldo: R$ ${balance.toFixed(2)}. Aposta: R$ ${currentBet}`);
      return;
    }
    
    // Validar direção
    const validDirections = ['TL', 'TR', 'C', 'BL', 'BR'];
    if (!validDirections.includes(direction)) {
      return;
    }
    
    // =====================================================
    // FASE 3: LÓGICA DE JOGO CLARA
    // =====================================================
    // 1. Iniciar fase de chute
    setGamePhase(GAME_PHASE.SHOOTING);
    playKickSound();
    
    // 2. Bola SEMPRE vai para o centro exato do target (com os mesmos offsets dos targets visuais)
    const targetPos = getTargetPosition?.(direction) || TARGETS?.[direction] || TARGETS?.C || { x: 960, y: 400 };
    // Aplicar os mesmos offsets que os targets visuais usam
    const isLeft = direction === 'TL' || direction === 'BL';
    const isRight = direction === 'TR' || direction === 'BR';
    const horizontalOffset = isLeft 
      ? (TARGETS?.HORIZONTAL_OFFSET?.LEFT || 30)
      : isRight 
        ? (TARGETS?.HORIZONTAL_OFFSET?.RIGHT || -30)
        : (TARGETS?.HORIZONTAL_OFFSET?.CENTER || 0);
    const verticalOffset = TARGETS?.VERTICAL_OFFSET || 0;
    const finalBallPos = {
      x: targetPos.x + horizontalOffset,
      y: targetPos.y + verticalOffset
    };
    
    try {
      // 3. Processar chute no backend simulado PRIMEIRO (com delay mínimo para não atrasar)
      // Usar Promise.race para processar rapidamente mas manter a lógica
      const result = await simulateProcessShot(direction, currentBet);
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Erro ao processar chute');
      }
      
      const isGoal = result.shot.isWinner;
      const isGoldenGoal = result.isGoldenGoal || result.shot.isGoldenGoal;
      
      // 4. Função para obter direção oposta/diferente
      const getOppositeDirection = (dir) => {
        const opposites = {
          'TL': 'BR',  // Top Left → Bottom Right
          'TR': 'BL',  // Top Right → Bottom Left
          'C': 'TL',   // Center → Top Left (qualquer direção diferente)
          'BL': 'TR',  // Bottom Left → Top Right
          'BR': 'TL'   // Bottom Right → Top Left
        };
        return opposites[dir] || 'C';
      };
      
      // 5. GOLEIRO PULA NA DIREÇÃO CORRETA (UMA ÚNICA VEZ)
      // - Se GOL: goleiro pula em direção DIFERENTE (errou)
      // - Se DEFESA: goleiro pula na direção da bola (defendeu)
      const goalieDirection = isGoal ? getOppositeDirection(direction) : direction;
      const goalieJump = getGoalieJumpPosition(goalieDirection);
      setGoaliePose(goalieDirection);
      setGoaliePos({ ...goalieJump });
      
      // 6. BOLA SE MOVE (simultâneo com goleiro)
      setBallPos(finalBallPos);
      
      // Atualizar saldo
      const newBalance = result.user?.newBalance || balance;
      setBalance(newBalance);
      setShotsTaken(prev => prev + 1);
      setShotsUntilGoldenGoal(10 - (result.user?.globalCounter || 0) % 10);
      
      // 5. Mostrar resultado
      setGamePhase(GAME_PHASE.RESULT);
      
      // Atualizar ganhos totais e gols de ouro
      if (isGoal) {
        const totalPrize = result.shot.prize + (result.shot.goldenGoalPrize || 0);
        setTotalWinnings(prev => prev + totalPrize);
        
        if (isGoldenGoal) {
          setTotalGoldenGoals(prev => prev + 1);
        }
      }
      
      // =====================================================
      // FASE 4: ANIMAÇÕES E OVERLAYS
      // =====================================================
      if (isGoal) {
        if (isGoldenGoal) {
          // GOL DE OURO
          setShowGoldenGoal(true);
          playGoalSound();
          toast.success(`🏆 GOL DE OURO! Você ganhou R$ ${result.shot.prize + result.shot.goldenGoalPrize}!`);
          
          // Reset após animação
          const timer = setTimeout(() => {
            resetVisuals();
            setGamePhase(GAME_PHASE.IDLE);
          }, OVERLAYS.ANIMATION_DURATION.GOLDEN_GOAL);
          addTimer(timer);
        } else {
          // GOL NORMAL
          setShowGoool(true);
          playGoalSound();
          toast.success(`⚽ GOL! Você ganhou R$ ${result.shot.prize}!`);
          
          // Mostrar ganhou.png após goool.png (1200ms = duração da animação goool)
          const showGanhouTimer = setTimeout(() => {
            setShowGoool(false);
            setShowGanhou(true);
          }, OVERLAYS.ANIMATION_DURATION.GOOOL);
          addTimer(showGanhouTimer);
          
          // Reset após animação ganhou (1200ms goool + 5000ms ganhou)
          const resetTimer = setTimeout(() => {
            resetVisuals();
            setGamePhase(GAME_PHASE.IDLE);
          }, OVERLAYS.ANIMATION_DURATION.GOOOL + OVERLAYS.ANIMATION_DURATION.GANHOU);
          addTimer(resetTimer);
        }
        
        setSessionWins(prev => prev + 1);
      } else {
        // DEFESA
        // Mostrar overlay de defesa
        setShowDefendeu(true);
        
        // Tocar som de defesa com pequeno delay (sincronizar com momento da defesa)
        const defenseSoundTimer = setTimeout(() => {
          playDefenseSound();
        }, 400); // Delay de 400ms para sincronizar com a animação do goleiro
        addTimer(defenseSoundTimer);
        
        toast.info('🥅 Defesa! Tente novamente.');
        
        // Reset após animação
        const timer = setTimeout(() => {
          resetVisuals();
          setGamePhase(GAME_PHASE.IDLE);
        }, OVERLAYS.ANIMATION_DURATION.DEFENDEU + 1200);
        addTimer(timer);
      }
      
    } catch (error) {
      console.error('Erro ao processar chute:', error);
      toast.error(error.message || 'Erro ao processar chute');
      
      // Reset em caso de erro
      resetVisuals();
      setGamePhase(GAME_PHASE.IDLE);
    }
  }, [gamePhase, balance, currentBet, playKickSound, playGoalSound, playDefenseSound, getGoalieJumpPosition, resetVisuals, addTimer]);
  
  // =====================================================
  // HANDLE BET CHANGE
  // =====================================================
  const handleBetChange = useCallback((newBet) => {
    if (newBet >= 1 && newBet <= 10 && newBet <= balance && gamePhase === GAME_PHASE.IDLE) {
      setCurrentBet(newBet);
    }
  }, [balance, gamePhase]);
  
  // =====================================================
  // VALORES E MEMOIZAÇÕES (ANTES DE QUALQUER RETURN)
  // =====================================================
  // Valores seguros para renderização
  const stageWidth = STAGE?.WIDTH || 1920;
  const stageHeight = STAGE?.HEIGHT || 1080;
  const ballSize = BALL?.SIZE || 90;
  const goalieSize = GOALKEEPER?.SIZE || { width: 220, height: 260 };
  const targetSize = TARGETS?.SIZE || 60;
  const hudHeader = HUD?.HEADER || { top: 20, left: 20, right: 20, height: 100 };
  const hudBottomLeft = HUD?.BOTTOM_LEFT || { left: 20, bottom: 20 };
  const hudBottomRight = HUD?.BOTTOM_RIGHT || { right: 20, bottom: 20 };
  
  // Memoizar estilo do game-scale para evitar re-renders
  const gameScaleStyle = useMemo(() => ({
    transform: `scale(${gameScale})`,
    transformOrigin: 'center center',
    width: stageWidth,
    height: stageHeight,
    position: 'relative'
  }), [gameScale, stageWidth, stageHeight]);
  
  // =====================================================
  // RENDER
  // =====================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando jogo...</div>
      </div>
    );
  }
  
  const goalieImage = getGoalieImage(goaliePose);
  const betValues = [1, 2, 5, 10];
  const canShoot = gamePhase === GAME_PHASE.IDLE && balance >= currentBet;
  
  return (
    <div className="game-viewport">
      {/* FASE 1: GAME SCALE - Aplica transform: scale() */}
      <div 
        className="game-scale"
        style={gameScaleStyle}
      >
        {/* FASE 1: GAME STAGE - Stage fixo 1920x1080 */}
        <div className="game-stage" style={{
          width: stageWidth,
          height: stageHeight,
          position: 'relative',
          overflow: 'hidden',
          background: '#0b3a1d'
        }}>
          {/* Background */}
          <img 
            src={bgGoalImg} 
            alt="Campo de Futebol" 
            className="scene-bg"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: stageWidth,
              height: stageHeight,
              objectFit: 'cover',
              zIndex: 1
            }}
          />
          
          {/* HUD Header - Posição fixa em pixels */}
          <div className="hud-header" style={{
            position: 'absolute',
            left: hudHeader.left,
            right: hudHeader.right,
            top: hudHeader.top,
            zIndex: 10,
            pointerEvents: 'auto'
          }}>
            <div className="hud-content">
              {/* Logo */}
              <div className="brand-small">
                <Logo size="small" className="brand-logo-small" />
              </div>
              
              {/* Estatísticas */}
              <div className="hud-stats">
                <div className="stat-item">
                  <span className="stat-icon">💰</span>
                  <div className="stat-content">
                    <div className="stat-label">SALDO</div>
                    <div className="stat-value">R$ {balance.toFixed(2)}</div>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">⚽</span>
                  <div className="stat-content">
                    <div className="stat-label">CHUTES</div>
                    <div className="stat-value">{shotsTaken}</div>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">💰</span>
                  <div className="stat-content">
                    <div className="stat-label">GANHOS</div>
                    <div className="stat-value">R$ {totalWinnings.toFixed(2)}</div>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🏆</span>
                  <div className="stat-content">
                    <div className="stat-label">GOLS DE OURO</div>
                    <div className="stat-value">{totalGoldenGoals}</div>
                  </div>
                </div>
              </div>
              
              {/* Apostas */}
              <div className="hud-betting">
                <div className="betting-section">
                  <div className="bet-label">Aposta:</div>
                  <div className="bet-buttons">
                    {betValues.map((value) => (
                      <button
                        key={value}
                        onClick={() => handleBetChange(value)}
                        disabled={balance < value || gamePhase !== GAME_PHASE.IDLE}
                        className={`bet-btn ${currentBet === value ? 'active' : ''} ${balance < value ? 'disabled' : ''}`}
                      >
                        R${value}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-dashboard"
                >
                  MENU PRINCIPAL
                </button>
              </div>
            </div>
          </div>
          
          {/* Targets (Zonas clicáveis) - Posições fixas em pixels */}
          {(['TL', 'TR', 'C', 'BL', 'BR']).map((zone) => {
            const pos = getTargetPosition?.(zone) || TARGETS?.[zone] || { x: 960, y: 400 };
            const isLeft = zone === 'TL' || zone === 'BL';
            const isRight = zone === 'TR' || zone === 'BR';
            const horizontalOffset = isLeft 
              ? (TARGETS?.HORIZONTAL_OFFSET?.LEFT || 30)
              : isRight 
                ? (TARGETS?.HORIZONTAL_OFFSET?.RIGHT || -30)
                : (TARGETS?.HORIZONTAL_OFFSET?.CENTER || 0);
            const adjustedX = pos.x + horizontalOffset;
            const adjustedY = pos.y + (TARGETS?.VERTICAL_OFFSET || 0);
            
            return (
              <button
                key={zone}
                onClick={() => handleShoot(zone)}
                disabled={!canShoot}
                className={`gs-zone ${!canShoot ? 'disabled' : ''}`}
                style={{
                  position: 'absolute',
                  left: adjustedX - targetSize / 2,
                  top: adjustedY - targetSize / 2,
                  width: targetSize,
                  height: targetSize,
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.6)',
                  background: !canShoot ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.5)',
                  cursor: !canShoot ? 'not-allowed' : 'pointer',
                  zIndex: 5,
                  transition: 'all 0.2s ease'
                }}
                title={`Chutar para ${zone}`}
              />
            );
          })}
          
          {/* Goleiro - Posição fixa em pixels */}
          <img
            src={goalieImage}
            alt="Goleiro"
            className="gs-goalie"
            style={{
              position: 'absolute',
              left: goaliePos.x - goalieSize.width / 2,
              top: goaliePos.y - goalieSize.height / 2,
              transform: `rotate(${goaliePos.rot || 0}deg)`,
              transition: `transform ${GOALKEEPER?.ANIMATION_DURATION || 500}ms cubic-bezier(0.4, 0, 0.2, 1), left ${GOALKEEPER?.ANIMATION_DURATION || 500}ms cubic-bezier(0.4, 0, 0.2, 1), top ${GOALKEEPER?.ANIMATION_DURATION || 500}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              willChange: 'transform',
              zIndex: 3,
              width: goalieSize.width,
              height: goalieSize.height,
              objectFit: 'contain'
            }}
          />
          
          {/* Bola - Posição fixa em pixels */}
          <img
            src={ballImg}
            alt="Bola"
            className="gs-ball"
            style={{
              position: 'absolute',
              left: ballPos.x - ballSize / 2,
              top: ballPos.y - ballSize / 2,
              transition: `left ${BALL?.ANIMATION_DURATION || 600}ms cubic-bezier(0.4, 0, 0.2, 1), top ${BALL?.ANIMATION_DURATION || 600}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              willChange: 'transform',
              zIndex: 4,
              width: ballSize,
              height: ballSize,
              objectFit: 'contain'
            }}
          />
          
          {/* HUD Inferior Esquerdo */}
          <div className="hud-bottom-left" style={{
            position: 'absolute',
            left: hudBottomLeft.left,
            bottom: hudBottomLeft.bottom,
            zIndex: 10
          }}>
            <div className="game-actions">
              <button
                onClick={() => navigate('/pagamentos')}
                className="hud-btn primary"
                disabled={gamePhase !== GAME_PHASE.IDLE}
              >
                <span className="btn-icon">💳</span>
                <span>Recarregar</span>
              </button>
            </div>
          </div>
          
          {/* HUD Inferior Direito */}
          <div className="hud-bottom-right" style={{
            position: 'absolute',
            right: hudBottomRight.right,
            bottom: hudBottomRight.bottom,
            zIndex: 10
          }}>
            <div className="control-panel">
              <div className="control-buttons">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="control-btn"
                  title={isMuted ? 'Ativar Áudio' : 'Desativar Áudio'}
                >
                  <span className="btn-icon">{isMuted ? '🔇' : '🔊'}</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Overlays - Portal com centralização absoluta */}
          {typeof document !== 'undefined' && document.body && (
            <>
              {/* Overlay GOL */}
              {showGoool && createPortal(
                <img
                  src={gooolImg}
                  alt="Gol!"
                  className="gs-goool"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10000,
                    pointerEvents: 'none',
                    width: `${OVERLAYS.SIZE.GOOOL.width}px`,
                    height: `${OVERLAYS.SIZE.GOOOL.height}px`,
                    objectFit: 'contain',
                    animation: 'gooolPop 1.2s ease-out forwards',
                    display: 'block',
                    visibility: 'visible',
                    opacity: 1
                  }}
                />,
                document.body
              )}
              
              {/* Overlay GANHOU (aparece após goool.png) */}
              {showGanhou && createPortal(
                <img
                  src={ganhouImg}
                  alt="Ganhou!"
                  className="gs-ganhou"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10001,
                    pointerEvents: 'none',
                    width: `${OVERLAYS.SIZE.GANHOU.width}px`,
                    height: `${OVERLAYS.SIZE.GANHOU.height}px`,
                    objectFit: 'contain',
                    animation: 'ganhouPop 5s ease-out forwards',
                    display: 'block',
                    visibility: 'visible',
                    opacity: 1
                  }}
                />,
                document.body
              )}
              
              {/* Overlay DEFENDEU */}
              {showDefendeu && createPortal(
                <img
                  src={defendeuImg}
                  alt="Defendeu!"
                  className="gs-defendeu"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10000,
                    pointerEvents: 'none',
                    width: `${OVERLAYS.SIZE.DEFENDEU.width}px`,
                    height: `${OVERLAYS.SIZE.DEFENDEU.height}px`,
                    objectFit: 'contain',
                    animation: 'pop 0.8s ease-out forwards',
                    display: 'block',
                    visibility: 'visible',
                    opacity: 1
                  }}
                />,
                document.body
              )}
              
              {/* Overlay GOL DE OURO */}
              {showGoldenGoal && createPortal(
                <img
                  src={goldenGoalImg}
                  alt="Gol de Ouro!"
                  className="gs-golden-goal"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10002,
                    pointerEvents: 'none',
                    width: `${OVERLAYS.SIZE.GOLDEN_GOAL.width}px`,
                    height: `${OVERLAYS.SIZE.GOLDEN_GOAL.height}px`,
                    objectFit: 'contain',
                    animation: 'ganhouPop 5s ease-out forwards',
                    display: 'block',
                    visibility: 'visible',
                    opacity: 1
                  }}
                />,
                document.body
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameFinal;
