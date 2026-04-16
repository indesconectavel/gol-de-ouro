// GAME FINAL - VERSÃO DEFINITIVA E ESTÁVEL
// ====================================================
// Arquitetura profissional de Game Stage fixa (1920x1080)
// Todas as posições em PX fixo via layoutConfig.js
// Backend real | Estado único | Sem loops | Sem travamentos
// Data: 2026-03-09 — Cirurgia BLOCO F: integração backend real

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
import gameService from '../services/gameService';
import apiClient from '../services/apiClient';
import { API_ENDPOINTS } from '../config/api';
import musicManager from '../utils/musicManager';
import { track } from '../utils/analytics';
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

/** Hierarquia de feedback em gol/gol de ouro: overlay primeiro, som depois, toast por último (não altera durações de overlay). */
const GOAL_FEEDBACK_SOUND_DELAY_MS = 200;
const GOAL_FEEDBACK_TOAST_DELAY_MS = 600;
import goalieIdle from '../assets/goalie_idle.png';
import goalieDiveTL from '../assets/goalie_dive_tl.png';
import goalieDiveTR from '../assets/goalie_dive_tr.png';
import goalieDiveBL from '../assets/goalie_dive_bl.png';
import goalieDiveBR from '../assets/goalie_dive_br.png';
import goalieDiveMid from '../assets/goalie_dive_mid.png';
import ballImg from '../assets/ball.png';
import bgGoalImg from '../assets/bg_goal.jpg';
// Assets de resultado — contrato igual ao Current (produção FyKKeg6zb): defendeu, ganhou_5, ganhou_100, gol_de_ouro, gol_normal, goool
import golNormalImg from '../assets/gol_normal.png';
import defendeuImg from '../assets/defendeu.png';
import ganhou5Img from '../assets/ganhou_5.png';
import ganhou100Img from '../assets/ganhou_100.png';
import golDeOuroImg from '../assets/gol_de_ouro.png';

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
  const [loading, setLoading] = useState(true);
  
  // V1: valor fixo R$ 1 por chute — sem seleção de valor
  const betAmount = 1;
  
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
  // Variante do overlay "ganhou" (produção: ganhou_5 vs ganhou_100 por valor do prêmio)
  const [ganhouVariant100, setGanhouVariant100] = useState(false);
  
  // Estatísticas (totais da conta — backend real)
  const [totalChutes, setTotalChutes] = useState(0);
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

  // Garante que a trilha do login nunca persista na rota /game
  useEffect(() => {
    musicManager.stopMusic();
  }, []);
  
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

  const refreshProfileFresh = useCallback(async () => {
    const profileRes = await apiClient.get(API_ENDPOINTS.PROFILE, { skipCache: true });
    if (profileRes.data?.success && profileRes.data?.data) {
      const d = profileRes.data.data;
      setBalance(Number(d.saldo) || 0);
      setTotalChutes(Number(d.total_apostas) || 0);
      setTotalWinnings(Number(d.total_ganhos) || 0);
      setTotalGoldenGoals(Number(d.total_gols_de_ouro) || 0);
    }
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
    
    // Inicializar jogo (apenas uma vez) — Backend real
    const init = async () => {
      let initSucceeded = true;
      try {
        setLoading(true);
        // Perfil: saldo e totais da conta (sempre sem cache stale)
        await refreshProfileFresh();
        // Métricas globais e gameService (shotsUntilGoldenGoal)
        const initResult = await gameService.initialize();
        if (initResult?.success && initResult?.gameInfo?.goldenGoal) {
          const next = initResult.gameInfo.goldenGoal.shotsUntilNext;
          if (typeof next === 'number') setShotsUntilGoldenGoal(next);
        }
      } catch (error) {
        initSucceeded = false;
        console.error('Erro ao inicializar:', error);
        toast.error('Erro ao carregar dados do jogo.');
        track('game_error', {
          phase: 'init',
          code: String(error?.message || 'init_error').slice(0, 200)
        });
      } finally {
        setLoading(false);
        if (initSucceeded) {
          track('game_ready', {});
        }
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
      track('game_leave', { reason: 'unmount' });
      // NÃO resetar isInitializedRef para evitar loops
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshProfileFresh]); // executa na montagem com reidratação fresh
  
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
    if (balance < betAmount) {
      console.log('⚠️ [GAMEFINAL] Saldo insuficiente:', balance, '<', betAmount);
      track('game_error', { phase: 'shot', code: 'insufficient_balance' });
      toast.error(`Saldo insuficiente. Seu saldo: R$ ${balance.toFixed(2)}. Aposta: R$ ${betAmount}`);
      return;
    }
    
    // Validar direção
    const validDirections = ['TL', 'TR', 'C', 'BL', 'BR'];
    if (!validDirections.includes(direction)) {
      return;
    }

    track('shot_committed', {
      direction,
      shotNumber: totalChutes + 1
    });
    
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
      // 3. Processar chute no backend real
      const result = await gameService.processShot(direction, betAmount);
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Erro ao processar chute');
      }
      
      const isGoal = result.shot.isWinner;
      const isGoldenGoal = result.isGoldenGoal || result.shot.isGoldenGoal;

      const outcome = isGoldenGoal ? 'goal_golden' : (isGoal ? 'goal' : 'miss');
      const reward =
        (result.shot?.prize || 0) + (result.shot?.goldenGoalPrize || 0);
      track('shot_outcome', {
        outcome,
        direction,
        reward
      });
      if (isGoldenGoal && typeof gameService.getShotsUntilGoldenGoal === 'function') {
        const shotsUntilNext = gameService.getShotsUntilGoldenGoal();
        if (typeof shotsUntilNext === 'number') {
          track('golden_cycle_reset', { shotsUntilNext });
        }
      }
      
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
      
      // Atualizar saldo e totais da conta a partir da resposta do backend
      const newBalance = result.user?.newBalance ?? balance;
      setBalance(newBalance);
      setTotalChutes(prev => prev + 1);
      if (result.gameInfo?.goldenGoal?.shotsUntilNext != null) {
        setShotsUntilGoldenGoal(result.gameInfo.goldenGoal.shotsUntilNext);
      } else if (typeof gameService.getShotsUntilGoldenGoal === 'function') {
        setShotsUntilGoldenGoal(gameService.getShotsUntilGoldenGoal());
      } else {
        setShotsUntilGoldenGoal(prev => isGoldenGoal ? 10 : Math.max(0, prev - 1));
      }

      // Evita stale cache do profile ao sair/voltar para /game
      if (typeof apiClient.invalidateCache === 'function') {
        apiClient.invalidateCache(API_ENDPOINTS.PROFILE);
      }

      // Reconciliar totais da conta com leitura fresca sem bloquear animação/jogada
      refreshProfileFresh().catch((error) => {
        console.warn('⚠️ [GAMEFINAL] Falha ao reconciliar profile fresh:', error?.message || error);
      });
      
      // 5. Mostrar resultado
      setGamePhase(GAME_PHASE.RESULT);
      
      // Atualizar ganhos totais e gols de ouro (conta)
      if (isGoal) {
        const totalPrize = (result.shot.prize || 0) + (result.shot.goldenGoalPrize || 0);
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
          addTimer(setTimeout(() => {
            playGoalSound();
          }, GOAL_FEEDBACK_SOUND_DELAY_MS));
          addTimer(setTimeout(() => {
            toast.success(`🏆 GOL DE OURO! Você ganhou R$ ${result.shot.prize + result.shot.goldenGoalPrize}!`);
          }, GOAL_FEEDBACK_TOAST_DELAY_MS));
          
          // Reset após animação
          const timer = setTimeout(() => {
            resetVisuals();
            setGamePhase(GAME_PHASE.IDLE);
          }, OVERLAYS.ANIMATION_DURATION.GOLDEN_GOAL);
          addTimer(timer);
        } else {
          // GOL NORMAL — overlay "gol" = gol_normal; "ganhou" = ganhou_5 ou ganhou_100 (contrato produção)
          setGanhouVariant100((result.shot.prize || 0) >= 100 || (result.shot.goldenGoalPrize || 0) > 0);
          setShowGoool(true);
          addTimer(setTimeout(() => {
            playGoalSound();
          }, GOAL_FEEDBACK_SOUND_DELAY_MS));
          addTimer(setTimeout(() => {
            toast.success(`⚽ GOL! Você ganhou R$ ${result.shot.prize}!`);
          }, GOAL_FEEDBACK_TOAST_DELAY_MS));
          
          // Mostrar ganhou_5/ganhou_100 após gol_normal (1200ms = duração da animação)
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
        }, OVERLAYS.ANIMATION_DURATION.DEFENDEU);
        addTimer(timer);
      }
      
    } catch (error) {
      console.error('Erro ao processar chute:', error);
      track('game_error', {
        phase: 'shot',
        code: String(error?.message || 'shot_error').slice(0, 200)
      });
      toast.error(error.message || 'Erro ao processar chute');
      
      // Reset em caso de erro
      resetVisuals();
      setGamePhase(GAME_PHASE.IDLE);
    }
  }, [gamePhase, balance, totalChutes, playKickSound, playGoalSound, playDefenseSound, getGoalieJumpPosition, resetVisuals, addTimer, refreshProfileFresh]);
  
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
      <div className="game-loading-screen min-h-screen bg-gradient-to-br from-gray-900 to-slate-900 flex items-center justify-center">
        <div className="game-loading-label text-white text-xl">Carregando jogo...</div>
      </div>
    );
  }
  
  const goalieImage = getGoalieImage(goaliePose);
  const canShoot = gamePhase === GAME_PHASE.IDLE && balance >= betAmount;
  
  return (
    <div
      className="game-viewport"
      style={{
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
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
                    <div className="stat-value">{totalChutes}</div>
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
              
              {/* V1: Aposta fixa R$ 1 — sem seletor de valor */}
              <div className="hud-betting">
                <div className="betting-section">
                  <div className="bet-label">Aposta:</div>
                  <div className="bet-value-fixed">R$ 1,00 por chute</div>
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
                  height: targetSize
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
          
          {/* Overlays - Portal SEMPRE em #game-overlay-root (filho direto de body, fora de #root e de qualquer transform) */}
          {(() => {
            const overlayContainer = typeof document !== 'undefined'
              ? document.getElementById('game-overlay-root')
              : null;
            return overlayContainer ? (
              <>
                {/* Overlay GOL — contrato produção: gol_normal; goool no bundle para paridade com Current */}
                {showGoool && createPortal(
                  <img
                    src={golNormalImg}
                    alt="Gol!"
                    className="gs-goool"
                    style={{
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10000,
                      pointerEvents: 'none',
                      width: `min(${OVERLAYS.SIZE.GOOOL.width}px, 90vw)`,
                      height: `${OVERLAYS.SIZE.GOOOL.height}px`,
                      objectFit: 'contain',
                      animation: 'gooolPop 1.2s ease-out forwards',
                      display: 'block',
                      visibility: 'visible',
                      opacity: 1
                    }}
                  />,
                  overlayContainer
                )}
                
                {/* Overlay GANHOU — contrato produção: ganhou_5 ou ganhou_100 por prêmio */}
                {showGanhou && createPortal(
                  <img
                    src={ganhouVariant100 ? ganhou100Img : ganhou5Img}
                    alt="Ganhou!"
                    className="gs-ganhou"
                    style={{
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10001,
                      pointerEvents: 'none',
                      width: `min(${OVERLAYS.SIZE.GANHOU.width}px, 90vw)`,
                      height: `${OVERLAYS.SIZE.GANHOU.height}px`,
                      objectFit: 'contain',
                      animation: 'ganhouPop 5s ease-out forwards',
                      display: 'block',
                      visibility: 'visible',
                      opacity: 1
                    }}
                  />,
                  overlayContainer
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
                      width: `min(${OVERLAYS.SIZE.DEFENDEU.width}px, 90vw)`,
                      height: `${OVERLAYS.SIZE.DEFENDEU.height}px`,
                      objectFit: 'contain',
                      animation: 'pop 0.8s ease-out forwards',
                      display: 'block',
                      visibility: 'visible',
                      opacity: 1
                    }}
                  />,
                  overlayContainer
                )}
                
                {/* Overlay GOL DE OURO — contrato produção: gol_de_ouro */}
                {showGoldenGoal && createPortal(
                  <img
                    src={golDeOuroImg}
                    alt="Gol de Ouro!"
                    className="gs-golden-goal"
                    style={{
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10002,
                      pointerEvents: 'none',
                      width: `min(${OVERLAYS.SIZE.GOLDEN_GOAL.width}px, 90vw)`,
                      height: `${OVERLAYS.SIZE.GOLDEN_GOAL.height}px`,
                      objectFit: 'contain',
                      animation: 'ganhouPop 5.5s ease-out forwards',
                      display: 'block',
                      visibility: 'visible',
                      opacity: 1
                    }}
                  />,
                  overlayContainer
                )}
              </>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
};

export default GameFinal;
