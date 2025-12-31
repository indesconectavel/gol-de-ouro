// PÁGINA JOGO COMPLETA - GOL DE OURO
// ====================================================
// Página validada com imagens, animações e integração backend completa
// Data: 2025-01-24
// Status: PÁGINA VALIDADA RESTAURADA

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Logo from '../components/Logo';
import gameService from '../services/gameService';
import useSimpleSound from '../hooks/useSimpleSound';
import useGameResponsive from '../hooks/useGameResponsive';
import useGamification from '../hooks/useGamification';
import Chat from '../components/Chat';
import './game-scene.css';
import './game-shoot.css'; // Para classes gs-goool e gs-defendeu

// ✅ FASE 1: AUTORIDADE ÚNICA DO JOGO - Estado central que decide tudo
const GAME_STATE = {
  IDLE: 'IDLE',
  SHOOTING: 'SHOOTING',
  RESOLVING: 'RESOLVING',
};

// Importar todas as imagens
import goalieIdle from '../assets/goalie_idle.png';
import goalieDiveTL from '../assets/goalie_dive_tl.png';
import goalieDiveTR from '../assets/goalie_dive_tr.png';
import goalieDiveBL from '../assets/goalie_dive_bl.png';
import goalieDiveBR from '../assets/goalie_dive_br.png';
import goalieDiveMid from '../assets/goalie_dive_mid.png';
import ballImg from '../assets/ball.png';
import bgGoalImg from '../assets/bg_goal.jpg';
// Novas imagens (com fallback para imagens antigas)
import golNormalImg from '../assets/gol_normal.png';
import gooolImg from '../assets/goool.png'; // Fallback
import ganhou5Img from '../assets/ganhou_5.png';
import ganhouImg from '../assets/ganhou.png'; // Fallback
import golDeOuroImg from '../assets/gol_de_ouro.png';
import goldenGoalImg from '../assets/golden-goal.png'; // Fallback
import ganhou100Img from '../assets/ganhou_100.png';
import defendeuImg from '../assets/defendeu.png';

const Jogo = () => {
  const navigate = useNavigate();
  
  // Sistema de responsividade
  const { getGoalieSize, getBallSize, isMobile, isTablet, isDesktop, dimensions } = useGameResponsive();
  
  // Sistema de gamificação (rank do jogador)
  const { points, userLevel } = useGamification();
  
  // Função para obter o rank do jogador baseado em pontos
  const getRankInfo = (points) => {
    if (points >= 10000) return { title: 'Lenda', icon: '👑', color: '#EC4899' };
    if (points >= 5000) return { title: 'Mestre', icon: '🏆', color: '#8B5CF6' };
    if (points >= 2000) return { title: 'Expert', icon: '⭐', color: '#F59E0B' };
    if (points >= 1000) return { title: 'Profissional', icon: '💎', color: '#3B82F6' };
    if (points >= 500) return { title: 'Competidor', icon: '🎯', color: '#10B981' };
    return { title: 'Novato', icon: '🌱', color: '#6B7280' };
  };
  
  const rankInfo = getRankInfo(points);
  
  // Sistema de áudio - TODOS OS SONS
  const { 
    playKickSound, 
    playGoalSound, 
    playDefenseSound, 
    playButtonClick,
    playCelebrationSound,
    playCrowdSound,
    playBackgroundMusic,
    isMuted, 
    toggleMute 
  } = useSimpleSound();
  
  
  // Estados do jogo
  const [balance, setBalance] = useState(0);
  const [currentBet, setCurrentBet] = useState(1);
  const [shooting, setShooting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  // ✅ FASE 1: ESTADO CENTRAL DO JOGO - Autoridade única que decide tudo
  const [gameState, setGameState] = useState(GAME_STATE.IDLE);
  
  // ✅ ESTADO CENTRAL DE ANIMAÇÃO (será removido na FASE 5)
  const [isAnimating, setIsAnimating] = useState(false);
  
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
  const [showGanhou100, setShowGanhou100] = useState(false);
  
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
  
  // Estados de áudio - usar apenas isMuted do hook
  // Removido audioEnabled local para evitar conflito
  
  // Estado do chat
  const [chatOpen, setChatOpen] = useState(false);
  
  // Zonas do gol
  const GOAL_ZONES = {
    "TL": { x: 20, y: 16 }, // Subido 20% total (20 - 4 = 16)
    "TR": { x: 80, y: 16 }, // Subido 20% total (20 - 4 = 16)
    "C": { x: 50, y: 16 }, // Subido 20% total (20 - 4 = 16)
    "BL": { x: 20, y: 40 },
    "BR": { x: 80, y: 40 }
  };
  
  const DIRS = ["TL", "TR", "C", "BL", "BR"];
  
  // Valores de aposta disponíveis
  const betValues = [1, 2, 5, 10];
  
  // ✅ OTIMIZAÇÃO: Ref para armazenar timers e limpar no cleanup
  const timersRef = useRef([]);
  
  // ✅ REFS para event listeners de animação
  const ballRef = useRef(null);
  const goalieRef = useRef(null);
  const overlayRefs = useRef({
    goool: null,
    defendeu: null,
    ganhou: null,
    goldenGoal: null,
    ganhou100: null
  });
  
  // ✅ OTIMIZAÇÃO: Função para adicionar timer e garantir limpeza
  const addTimer = useCallback((timer) => {
    timersRef.current.push(timer);
    return timer;
  }, []);
  
  // ✅ OTIMIZAÇÃO: Limpar todos os timers
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    timersRef.current = [];
  }, []);
  
  // Função para obter imagem do goleiro baseada na pose - MEMOIZADA
  const getGoalieImage = useCallback((pose) => {
    switch(pose) {
      case "TL": return goalieDiveTL;
      case "TR": return goalieDiveTR;
      case "BL": return goalieDiveBL;
      case "BR": return goalieDiveBR;
      case "C": return goalieDiveMid;
      case "idle":
      default: return goalieIdle;
    }
  }, []);
  
  // ✅ OTIMIZAÇÃO: Memoizar imagem atual do goleiro para evitar re-renders
  const currentGoalieImage = useMemo(() => getGoalieImage(goaliePose), [goaliePose, getGoalieImage]);
  
  // ✅ OTIMIZAÇÃO: Memoizar tamanhos para evitar recálculos
  const goalieSize = useMemo(() => getGoalieSize(), [getGoalieSize]);
  const ballSize = useMemo(() => getBallSize(), [getBallSize]);
  
  // =====================================================
  // INICIALIZAÇÃO
  // =====================================================
  
  useEffect(() => {
    // Ativar CSS da página apenas se body existir
    if (typeof document !== 'undefined' && document.body) {
      document.body.setAttribute('data-page', 'game');
    }
    
    // Iniciar música de fundo após 2 segundos
    if (!isMuted) {
      const musicTimer = setTimeout(() => {
        playBackgroundMusic();
      }, 2000);
      addTimer(musicTimer);
    }
    
    // ✅ OTIMIZAÇÃO: Limpar ao desmontar
    return () => {
      clearAllTimers();
      if (typeof document !== 'undefined' && document.body) {
        document.body.removeAttribute('data-page');
      }
    };
  }, [isMuted, playBackgroundMusic, addTimer, clearAllTimers]);
  
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (mounted) {
        await initializeGame();
      }
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  // DEBUG: Monitorar mudanças nos estados das imagens
  useEffect(() => {
    console.log('🔍 [DEBUG] Estados das imagens mudaram:', {
      showGoool,
      showDefendeu,
      showGanhou,
      showGoldenGoal,
      showGanhou100
    });
  }, [showGoool, showDefendeu, showGanhou, showGoldenGoal, showGanhou100]);
  
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
        
        console.log('✅ [JOGO] Jogo inicializado com sucesso');
        console.log(`💰 [JOGO] Saldo: R$ ${userData.saldo}`);
        console.log(`📊 [JOGO] Contador global: ${gameInfo.goldenGoal.counter}`);
        
      } else {
        throw new Error(initResult.error || 'Erro ao inicializar jogo');
      }
      
    } catch (error) {
      console.error('❌ [JOGO] Erro ao inicializar:', error);
      setError('Erro ao carregar dados do jogo');
      toast.error('Erro ao carregar dados do jogo');
    } finally {
      setLoading(false);
    }
  };
  
  // =====================================================
  // FUNÇÕES DE ANIMAÇÃO
  // =====================================================
  
  // Função para obter a posição visual real da GOAL_ZONE (com offsets aplicados)
  function getVisualGoalPosition(zone, pos) {
    const isLeft = zone === 'TL' || zone === 'BL';
    const isRight = zone === 'TR' || zone === 'BR';
    const horizontalOffsetPx = isLeft ? 30 : isRight ? -30 : 0; // +30px para esquerda, -30px para direita
    const verticalOffsetPx = 150; // Todas as zonas estão abaixadas em 150px no CSS
    
    // Usar stageWidth e stageHeight reais do hook para calcular offset em porcentagem corretamente
    const stageWidth = dimensions.stageWidth || (typeof window !== 'undefined' ? window.innerWidth : 1000);
    const stageHeight = dimensions.stageHeight || (typeof window !== 'undefined' ? window.innerHeight : 600);
    
    // Converter offsets de pixels para porcentagem
    const horizontalOffsetPercent = (horizontalOffsetPx / stageWidth) * 100;
    const verticalOffsetPercent = (verticalOffsetPx / stageHeight) * 100;
    
    // Retornar posição visual real (X com offset horizontal, Y com offset vertical)
    return {
      x: pos.x + horizontalOffsetPercent,
      y: pos.y + verticalOffsetPercent
    };
  }
  
  function goalToStage(goal) {
    return {
      x: goal.x,
      y: goal.y
    };
  }
  
  function goalieTargetFor(dir) {
    // Usar posição visual real (com offset de 30px para laterais)
    const visualPos = getVisualGoalPosition(dir, GOAL_ZONES[dir]);
    const base = goalToStage(visualPos);
    const centerX = 50;
    const centerY = 62;
    
    const isLateral = dir === "TL" || dir === "TR" || dir === "BL" || dir === "BR";
    // Redução do deslocamento lateral: 0.64 → 0.576 (reduzido em 10%)
    const reductionFactor = isLateral ? 0.576 : 0.8; // 0.64 * 0.9 = 0.576
    
    const offsetX = (base.x - centerX) * reductionFactor;
    const offsetY = (base.y - centerY) * reductionFactor;
    
    return { 
      x: centerX + offsetX, 
      y: centerY + offsetY, 
      rot: dir==="TL"||dir==="BL" ? -10 : dir==="TR"||dir==="BR" ? 10 : 0 
    };
  }
  
  // =====================================================
  // SISTEMA DE CHUTES
  // =====================================================
  
  const handleShoot = async (dir) => {
    console.log('🎯 [JOGO] handleShoot chamado com direção:', dir);
    console.log('🎯 [JOGO] Estado atual:', { gameState, balance, currentBet });
    
    // ✅ FASE 2: AUTORIDADE ÚNICA - Apenas gameState decide
    if (gameState !== GAME_STATE.IDLE) {
      console.log('[GAME] Clique ignorado - estado:', gameState);
      if (!isMuted) playButtonClick();
      return;
    }
    
    // Validar saldo
    if (balance < currentBet) {
      console.log('⚠️ [JOGO] Saldo insuficiente:', balance, '<', currentBet);
      if (!isMuted) playButtonClick();
      return;
    }
    
    console.log('✅ [JOGO] Chute permitido - iniciando processamento');
    
    // ✅ FASE 2: Tomar controle - gameState é a autoridade
    setGameState(GAME_STATE.SHOOTING);
    
    // Feedback sonoro no clique
    if (!isMuted) playButtonClick();
    
    // ✅ Manter estados antigos por enquanto (serão removidos na FASE 5)
    setShooting(true);
    setIsAnimating(true);
    setError("");
    
    try {
      // Tocar som de chute
      if (!isMuted) {
        console.log('🔊 [JOGO] Tocando som de chute');
        playKickSound();
      }
      
      // ✅ CORREÇÃO: Animação do goleiro IMEDIATAMENTE na direção do chute
      // Usar posição visual real (com offsets de 30px horizontal e 150px vertical)
      const gTarget = goalieTargetFor(dir);
      
      // ✅ OTIMIZAÇÃO: Mudar pose e posição juntos, sem requestAnimationFrame aninhado
      setGoaliePose(dir); // Pular na direção do chute
      setGoalieStagePos(gTarget); // Atualizar posição diretamente (React otimiza)
      
      // Animação da bola e goleiro - NÃO resetar aqui, será resetado após resultado
      const visualPos = getVisualGoalPosition(dir, GOAL_ZONES[dir]);
      console.log('🎯 [JOGO] Posição visual calculada:', { zone: dir, original: GOAL_ZONES[dir], visual: visualPos });
      const t = goalToStage(visualPos);
      setTargetStage(t);
      setBallPos({ x: t.x, y: t.y });
      
      // Validar direção antes de enviar
      if (!['TL', 'TR', 'C', 'BL', 'BR'].includes(dir)) {
        console.error('❌ [JOGO] Direção inválida:', dir);
        throw new Error('Direção inválida');
      }
      
      // Validar valor de aposta
      if (![1, 2, 5, 10].includes(currentBet)) {
        console.error('❌ [JOGO] Valor de aposta inválido:', currentBet);
        throw new Error('Valor de aposta inválido');
      }
      
      // Validar saldo
      if (balance < currentBet) {
        console.error('❌ [JOGO] Saldo insuficiente:', balance, '<', currentBet);
        throw new Error('Saldo insuficiente');
      }
      
      // Log para debug
      console.log('🎯 [JOGO] Enviando chute:', { direction: dir, amount: currentBet, balance });
      
      // Processar chute no backend
      const result = await gameService.processShot(dir, currentBet);
      
      // ✅ FASE 3: Backend não manda - sempre entrar em RESOLVING após backend
      setGameState(GAME_STATE.RESOLVING);
      
      if (result.success) {
        const { shot, user, isGoldenGoal: isGoldenGoalShot } = result;
        const isGoal = shot.isWinner;
        const prize = shot.prize + shot.goldenGoalPrize;
        
        // Atualizar estados
        setBalance(user.newBalance);
        setGlobalCounter(user.globalCounter);
        
        // ✅ Se foi gol, o goleiro já pulou na direção errada (correto)
        // Se não foi gol, o goleiro já pulou na direção certa (correto)
        // Não precisa alterar a animação do goleiro aqui, já está correto
        
        // Mostrar resultado IMEDIATAMENTE (sem delay para melhor responsividade)
        // IMPORTANTE: Capturar valores no momento para evitar closure stale
        const capturedIsGoal = isGoal;
        const capturedIsGoldenGoalShot = isGoldenGoalShot;
        const capturedPrize = prize;
        
        // ✅ OTIMIZAÇÃO: Remover requestAnimationFrame aninhado - atualizar estados diretamente
        console.log('🎯 [JOGO] Resultado do chute:', { 
          isGoal: capturedIsGoal, 
          isGoldenGoalShot: capturedIsGoldenGoalShot, 
          prize: capturedPrize 
        });
        
        if (capturedIsGoal) {
            if (capturedIsGoldenGoalShot) {
              // GOL DE OURO - Corrigido timing para 5.5s (animação dura 5s)
              console.log('🏆 [JOGO] GOL DE OURO detectado');
              console.log('🏆 [JOGO] setando showGoldenGoal = true');
              // ✅ CRÍTICO: Usar flushSync para garantir que o estado seja atualizado imediatamente
              flushSync(() => {
                setShowGoldenGoal(true);
              });
              console.log('🏆 [JOGO] showGoldenGoal setado para true');
              
              // ✅ ÁUDIO EVENT-BASED: Tocar quando overlay aparece
              if (!isMuted) {
                console.log('🔊 [JOGO] Tocando celebração de gol de ouro');
                playCelebrationSound();
                // Torcida após 1s
                const crowdTimer = setTimeout(() => {
                  if (!isMuted) playCrowdSound();
                }, 1000);
                addTimer(crowdTimer);
              }
              toast.success(`🏆 GOL DE OURO! Você ganhou R$ ${capturedPrize}!`);
              
              // Mostrar ganhou_100.png após 1.2s (quando gol_de_ouro termina)
              const showGanhou100Timer = setTimeout(() => {
                console.log('🎉 [JOGO] Mostrando ganhou_100.png');
                // ✅ CRÍTICO: Usar flushSync para garantir que o estado seja atualizado imediatamente
                flushSync(() => {
                  setShowGanhou100(true);
                });
                // ✅ ÁUDIO: Tocar celebração quando ganhou_100 aparece
                if (!isMuted) {
                  playCelebrationSound();
                }
                // ✅ FASE 4: Reset após ganhouPop terminar (5s de animação + margem)
                const resetTimer = setTimeout(() => {
                  console.log('🔄 [JOGO] Finalizando ciclo após ganhou_100 (fallback timer)');
                  endCycle();
                }, 5200); // 5s de animação + 200ms de margem
                addTimer(resetTimer);
              }, 1200);
              addTimer(showGanhou100Timer);
              
              // Ocultar gol_de_ouro.png após 1.2s (quando ganhou_100 aparece)
              const hideGoldenTimer = setTimeout(() => {
                console.log('🔄 [JOGO] Ocultando gol_de_ouro.png');
                setShowGoldenGoal(false);
              }, 1200);
              addTimer(hideGoldenTimer);
            } else {
              // GOL NORMAL - Corrigido timing para 5.5s total (ganhouPop dura 5s)
              console.log('⚽ [JOGO] GOL NORMAL detectado');
              console.log('⚽ [JOGO] setando showGoool = true');
              // ✅ CRÍTICO: Usar flushSync para garantir que o estado seja atualizado imediatamente
              flushSync(() => {
                setShowGoool(true);
              });
              console.log('⚽ [JOGO] showGoool setado para true');
              
              // ✅ ÁUDIO EVENT-BASED: Tocar quando overlay aparece
              if (!isMuted) {
                console.log('🔊 [JOGO] Tocando som de gol');
                playGoalSound();
                // Torcida após 1.5s
                const crowdTimer2 = setTimeout(() => {
                  if (!isMuted) playCrowdSound();
                }, 1500);
                addTimer(crowdTimer2);
              }
              toast.success(`⚽ GOL! Você ganhou R$ ${capturedPrize}!`);
              
              // Mostrar ganhou.png após 1.2s (quando gooolPop termina)
              const showGanhouTimer = setTimeout(() => {
                console.log('🎉 [JOGO] Mostrando ganhou.png');
                // ✅ CRÍTICO: Usar flushSync para garantir que o estado seja atualizado imediatamente
                flushSync(() => {
                  setShowGanhou(true);
                });
                // ✅ ÁUDIO: Tocar celebração quando ganhou aparece
                if (!isMuted) {
                  playCelebrationSound();
                }
                // ✅ FASE 4: Reset após ganhouPop terminar (5s de animação + margem)
                // O reset será feito via onAnimationEnd, mas manter timer como fallback
                const resetTimer = setTimeout(() => {
                  console.log('🔄 [JOGO] Finalizando ciclo após ganhou (fallback timer)');
                  endCycle();
                }, 5200); // 5s de animação + 200ms de margem
                addTimer(resetTimer);
              }, 1200);
              addTimer(showGanhouTimer);
              
              // Ocultar goool.png após 1.2s (quando ganhou aparece)
              const hideGooolTimer = setTimeout(() => {
                console.log('🔄 [JOGO] Ocultando goool.png');
                setShowGoool(false);
              }, 1200);
              addTimer(hideGooolTimer);
            }
          } else {
            // DEFESA - Mostrar defendeu.png imediatamente
            console.log('🥅 [JOGO] DEFESA detectada');
            console.log('🥅 [JOGO] setando showDefendeu = true');
            // ✅ CRÍTICO: Usar flushSync para garantir que o estado seja atualizado imediatamente
            flushSync(() => {
              setShowDefendeu(true);
            });
            console.log('🥅 [JOGO] showDefendeu setado para true');
            
            // ✅ ÁUDIO EVENT-BASED: Tocar quando overlay aparece
            if (!isMuted) {
              console.log('🔊 [JOGO] Tocando som de defesa do goleiro');
              playDefenseSound();
            }
            toast.info('🥅 Defesa! Tente novamente.');
            
            // ✅ FASE 4: Reset após animação terminar (pop dura 0.8s, usar 2s para segurança)
            const resetTimer = setTimeout(() => {
              console.log('🔄 [JOGO] Finalizando ciclo após defesa');
              endCycle();
            }, 2000);
            addTimer(resetTimer);
          }
          
          // Atualizar estatísticas
          setShotsTaken(prev => prev + 1);
          
          if (capturedIsGoal) {
            setSessionWins(prev => prev + 1);
            setCurrentStreak(prev => {
              const newStreak = prev + 1;
              if (newStreak > bestStreak) {
                setBestStreak(newStreak);
              }
              return newStreak;
            });
            
            if (capturedIsGoldenGoalShot) {
              setTotalGoldenGoals(prev => prev + 1);
            }
          } else {
            setSessionLosses(prev => prev + 1);
            setCurrentStreak(0);
          }
          
          // Atualizar contador global
          setShotsUntilGoldenGoal(gameService.getShotsUntilGoldenGoal());
        
      } else {
        // ✅ FASE 3: Tratamento de erro simplificado
        const errorMsg = result.error || 'Erro ao processar chute';
        console.error('❌ [JOGO] Erro do backend:', errorMsg);
        
        setError(errorMsg);
        toast.error(errorMsg);
        
        // Tocar som de erro (defesa)
        if (!isMuted) {
          playDefenseSound();
        }
        
        // ✅ FASE 4: FINALIZA CICLO
        endCycle();
        return;
      }
      
    } catch (error) {
      // ✅ FASE 3: Tratamento de erro simplificado
      console.error('[GAME] Erro no backend:', error);
      toast.error('Erro ao processar chute');
      
      // Tocar som de erro (defesa)
      if (!isMuted) {
        playDefenseSound();
      }
      
      // ✅ FASE 4: FINALIZA CICLO
      endCycle();
      return;
    }
    // ✅ REMOVIDO: setShooting(false) do finally - será resetado apenas em resetAnimations()
  };
  
  // ✅ FASE 4: RESET VISUAL - Não decide estado, apenas limpa visuais
  const resetVisuals = useCallback(() => {
    console.log('[GAME] Resetando visuais');
    
    // ✅ CRÍTICO: Limpar timers ANTES de resetar estados visuais
    // Isso garante que timers pendentes não tentem atualizar estados já resetados
    clearAllTimers();
    
    // Resetar apenas estados visuais (não gameState)
    setBallPos({ x: 50, y: 90 });
    setTargetStage(null);
    setShowGoool(false);
    setShowDefendeu(false);
    setShowGanhou(false);
    setShowGoldenGoal(false);
    setShowGanhou100(false);
    setGoaliePose("idle");
    setGoalieStagePos({ x: 50, y: 62, rot: 0 });
    
    // ✅ Manter estados antigos por enquanto (serão removidos na FASE 5)
    setIsAnimating(false);
    setShooting(false);
  }, [clearAllTimers]);
  
  // ✅ FASE 4: FINALIZAR CICLO - A chave da estabilidade
  const endCycle = useCallback(() => {
    console.log('[GAME] Fim do ciclo - estados antes do reset:', {
      showGoool,
      showDefendeu,
      showGanhou,
      showGoldenGoal,
      showGanhou100,
      gameState
    });
    
    resetVisuals(); // bola, goleiro, overlays
    setGameState(GAME_STATE.IDLE); // ✅ ÚNICA autoridade que libera input
    
    console.log('[GAME] Ciclo finalizado - gameState agora é IDLE');
  }, [resetVisuals, showGoool, showDefendeu, showGanhou, showGoldenGoal, showGanhou100]);
  
  // ✅ RESET À PROVA DE BATCHING (manter por compatibilidade temporária)
  const resetAnimations = useCallback(() => {
    console.log('🔄 [JOGO] resetAnimations chamado - usando endCycle');
    endCycle();
  }, [endCycle]);
  
  // ✅ FASE 4: TIMEOUT DE SEGURANÇA - Usar gameState como autoridade
  useEffect(() => {
    if (gameState !== GAME_STATE.IDLE) {
      const safetyTimer = setTimeout(() => {
        console.warn('⚠️ [JOGO] Timeout de segurança - finalizando ciclo forçado após 10s');
        endCycle();
      }, 10000); // 10 segundos
      
      return () => clearTimeout(safetyTimer);
    }
  }, [gameState, endCycle]);
  
  // =====================================================
  // FUNÇÕES DE APOSTA
  // =====================================================
  
  const handleBetChange = (newBet) => {
    if (newBet >= 1 && newBet <= 10 && newBet <= balance) {
      setCurrentBet(newBet);
      if (!isMuted) playButtonClick();
    }
  };
  
  // =====================================================
  // FUNÇÕES DE ÁUDIO
  // =====================================================
  
  const toggleAudio = () => {
    // Tocar som antes de mutar (se estiver ativo)
    if (!isMuted) playButtonClick();
    toggleMute();
    console.log('🔊 Toggle Audio:', !isMuted ? 'OFF' : 'ON');
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
    <div className="game-page">
      <div className="game-stage-wrap">
        <div id="stage-root">
          {/* Fundo do estádio - Tamanho e posição originais (100%) */}
          <img 
            src={bgGoalImg} 
            alt="Campo de Futebol" 
            className="scene-bg"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1
            }}
          />
          
          {/* HUD Header */}
          <div className="hud-header">
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
                    <div className="stat-value">{shotsTaken}/10</div>
                  </div>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">🏆</span>
                  <div className="stat-content">
                    <div className="stat-label">VITÓRIAS</div>
                    <div className="stat-value">{sessionWins}</div>
                  </div>
                </div>
              </div>
              
              {/* Apostas e Dashboard */}
              <div className="hud-betting">
                <div className="betting-section">
                  <div className="bet-label">Aposta:</div>
                  <div className="bet-buttons">
                    {betValues.map((value) => (
                      <button
                        key={value}
                        onClick={() => handleBetChange(value)}
                        disabled={balance < value || gameState !== GAME_STATE.IDLE}
                        className={`bet-btn ${currentBet === value ? 'active' : ''} ${balance < value ? 'disabled' : ''}`}
                      >
                        R${value}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!isMuted) playButtonClick();
                    navigate('/dashboard');
                  }}
                  className="btn-dashboard"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
          
          {/* Campo de Jogo - Container interno proporcional */}
          <div style={{ 
            position: 'absolute', 
            inset: 0, 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              height: '100%',
              aspectRatio: '16/9' // Garantir proporção interna
            }}>
              {/* Zonas clicáveis - Abaixadas em 150px (100px + 50px) - Laterais aproximadas 30px do goleiro */}
              {Object.entries(GOAL_ZONES).map(([zone, pos]) => {
                // Calcular offset horizontal para aproximar laterais (TL, TR, BL, BR) em 30px do goleiro
                const isLeft = zone === 'TL' || zone === 'BL';
                const isRight = zone === 'TR' || zone === 'BR';
                const horizontalOffset = isLeft ? 30 : isRight ? -30 : 0; // +30px para esquerda, -30px para direita
                
                return (
                  <button
                    key={zone}
                    onClick={() => {
                      console.log('🖱️ [JOGO] Zona clicada:', zone);
                      handleShoot(zone);
                    }}
                    disabled={gameState !== GAME_STATE.IDLE || balance < currentBet}
                    className={`gs-zone ${gameState !== GAME_STATE.IDLE || balance < currentBet ? 'disabled' : ''}`}
                    style={{
                      position: 'absolute',
                      left: horizontalOffset !== 0 ? `calc(${pos.x}% + ${horizontalOffset}px)` : `${pos.x}%`,
                      top: `calc(${pos.y}% + 150px)`, // Abaixado em 150px (100px + 50px)
                      transform: 'translate(-50%, -50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255, 255, 255, 0.4)',
                      background: gameState !== GAME_STATE.IDLE || balance < currentBet ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                      cursor: gameState !== GAME_STATE.IDLE || balance < currentBet ? 'not-allowed' : 'pointer',
                      zIndex: 5,
                      transition: 'all 0.2s ease'
                    }}
                    title={`Chutar para ${zone}`}
                  />
                );
              })}
              
              {/* Goleiro - USANDO IMAGENS - Proporções responsivas - OTIMIZADO PARA PERFORMANCE */}
              <img
                ref={goalieRef}
                src={currentGoalieImage}
                alt="Goleiro"
                className="gs-goalie"
                style={{
                  position: 'absolute',
                  left: `${goalieStagePos.x}%`,
                  top: `calc(${goalieStagePos.y}% + 10px)`, // Descida em 10px
                  transform: `translate3d(-50%, -50%, 0) rotate(${goalieStagePos.rot}deg)`, // GPU acceleration
                  transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), left 0.5s cubic-bezier(0.4, 0, 0.2, 1), top 0.5s cubic-bezier(0.4, 0, 0.2, 1)', // Aumentado para 0.5s, easing melhorado
                  willChange: 'transform', // Apenas transform (mais eficiente)
                  zIndex: 3,
                  ...goalieSize, // Usar valor memoizado
                  objectFit: 'contain',
                  imageRendering: 'auto' // Melhor qualidade de imagem
                }}
              />
              
              {/* Bola - USANDO IMAGEM - Proporções responsivas - OTIMIZADO PARA PERFORMANCE */}
              <img
                ref={ballRef}
                src={ballImg}
                alt="Bola"
                className="gs-ball"
                style={{
                  position: 'absolute',
                  left: `${ballPos.x}%`,
                  top: `${ballPos.y}%`,
                  transform: 'translate3d(-50%, -50%, 0)', // GPU acceleration
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), left 0.6s cubic-bezier(0.4, 0, 0.2, 1), top 0.6s cubic-bezier(0.4, 0, 0.2, 1)', // Aumentado para 0.6s, easing melhorado
                  willChange: 'transform', // Apenas transform (mais eficiente)
                  zIndex: 4,
                  ...ballSize, // Usar valor memoizado
                  objectFit: 'contain'
                  // ✅ OTIMIZAÇÃO: Removido filter durante animação (muito pesado)
                  // Filter será aplicado via CSS quando não estiver animando
                }}
              />
            </div>
          </div>
          
          {/* DEBUG: Renderizar sempre para teste */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{
              position: 'fixed',
              top: '10px',
              right: '10px',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '10px',
              zIndex: 99999,
              fontSize: '12px',
              fontFamily: 'monospace',
              borderRadius: '8px'
            }}>
              <div>showGoool: {showGoool ? '✅ TRUE' : '❌ false'}</div>
              <div>showDefendeu: {showDefendeu ? '✅ TRUE' : '❌ false'}</div>
              <div>showGanhou: {showGanhou ? '✅ TRUE' : '❌ false'}</div>
              <div>showGoldenGoal: {showGoldenGoal ? '✅ TRUE' : '❌ false'}</div>
              <div>showGanhou100: {showGanhou100 ? '✅ TRUE' : '❌ false'}</div>
            </div>
          )}
          
          {/* DEBUG: Mostrar estados das animações */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{
              position: 'fixed',
              top: '10px',
              right: '10px',
              background: 'rgba(0,0,0,0.9)',
              color: 'white',
              padding: '15px',
              zIndex: 99999,
              fontSize: '12px',
              fontFamily: 'monospace',
              borderRadius: '8px',
              border: '2px solid #ff0'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>🔍 DEBUG ANIMAÇÕES</div>
              <div>showGoool: {showGoool ? '✅ TRUE' : '❌ false'}</div>
              <div>showDefendeu: {showDefendeu ? '✅ TRUE' : '❌ false'}</div>
              <div>showGanhou: {showGanhou ? '✅ TRUE' : '❌ false'}</div>
              <div>showGoldenGoal: {showGoldenGoal ? '✅ TRUE' : '❌ false'}</div>
              <div>showGanhou100: {showGanhou100 ? '✅ TRUE' : '❌ false'}</div>
              <div style={{ marginTop: '10px', fontSize: '10px', color: '#aaa' }}>
                gameState: {gameState}
              </div>
              <div style={{ marginTop: '5px', fontSize: '10px', color: '#aaa' }}>
                shooting: {shooting ? '✅' : '❌'} (será removido)
              </div>
              <div style={{ marginTop: '5px', fontSize: '10px', color: '#aaa' }}>
                isAnimating: {isAnimating ? '✅' : '❌'} (será removido)
              </div>
            </div>
          )}

          {/* Overlays - Renderizar diretamente no body usando Portal para evitar overflow:hidden */}
          {typeof document !== 'undefined' && document.body && (
            <>
              {/* Overlay GOL - USANDO IMAGEM gol_normal.png COM ANIMAÇÃO (fallback para goool.png) */}
              {showGoool && createPortal(
                <img
                  ref={(el) => { overlayRefs.current.goool = el; }}
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
                    width: isMobile ? 'min(80%, 400px)' : isTablet ? 'min(60%, 500px)' : 'min(50%, 600px)',
                    height: 'auto',
                    maxWidth: '600px',
                    animation: 'gooolPop 1.2s ease-out forwards',
                    display: 'block',
                    visibility: 'visible',
                    opacity: 1,
                    willChange: 'transform, opacity'
                  }}
                  onError={(e) => {
                    console.warn('⚠️ [JOGO] Erro ao carregar gol_normal.png, usando fallback goool.png');
                    e.target.src = gooolImg;
                  }}
                  onLoad={() => {
                    console.log('✅ [JOGO] gol_normal.png carregada com sucesso');
                  }}
                  onAnimationEnd={(e) => {
                    if (e.animationName === 'gooolPop') {
                      console.log('✅ [JOGO] Animação gooolPop terminou');
                    }
                  }}
                />,
                document.body
              )}
              
              {/* Overlay GANHOU - USANDO IMAGEM ganhou_5.png COM ANIMAÇÃO (aparece após gol normal, fallback para ganhou.png) */}
              {showGanhou && createPortal(
                <img
                  ref={(el) => { overlayRefs.current.ganhou = el; }}
                  src={ganhou5Img}
                  alt="Ganhou!"
                  className="gs-ganhou"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10001, // Maior que goool para aparecer sobre ele
                    pointerEvents: 'none',
                    width: isMobile ? 'min(70%, 350px)' : isTablet ? 'min(55%, 450px)' : 'min(45%, 550px)',
                    height: 'auto',
                    maxWidth: '550px',
                    animation: 'ganhouPop 5s ease-out forwards',
                    display: 'block',
                    visibility: 'visible',
                    opacity: 1,
                    willChange: 'transform, opacity'
                  }}
                  onError={(e) => {
                    console.warn('⚠️ [JOGO] Erro ao carregar ganhou_5.png, usando fallback ganhou.png');
                    e.target.src = ganhouImg;
                  }}
                  onLoad={() => {
                    console.log('✅ [JOGO] ganhou_5.png carregada com sucesso');
                  }}
                  onAnimationEnd={(e) => {
                    if (e.animationName === 'ganhouPop') {
                      console.log('✅ [JOGO] Animação ganhouPop terminou - finalizando ciclo');
                      endCycle();
                    }
                  }}
                />,
                document.body
              )}
              
              {/* Overlay DEFENDEU - USANDO IMAGEM defendeu.png COM ANIMAÇÃO */}
              {showDefendeu && createPortal(
                <img
                  ref={(el) => { overlayRefs.current.defendeu = el; }}
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
                    width: isMobile ? 'min(80%, 400px)' : isTablet ? 'min(60%, 500px)' : 'min(50%, 600px)',
                    height: 'auto',
                    maxWidth: '600px',
                    animation: 'pop 0.8s ease-out forwards',
                    display: 'block',
                    visibility: 'visible',
                    opacity: 1,
                    willChange: 'transform, opacity'
                  }}
                  onError={(e) => {
                    console.error('❌ [JOGO] Erro ao carregar defendeu.png:', e, 'Path:', defendeuImg);
                  }}
                  onLoad={() => {
                    console.log('✅ [JOGO] defendeu.png carregada com sucesso, src:', defendeuImg);
                  }}
                  onAnimationEnd={(e) => {
                    if (e.animationName === 'pop') {
                      console.log('✅ [JOGO] Animação pop (defendeu) terminou');
                    }
                  }}
                />,
                document.body
              )}
              
              {/* Overlay GOL DE OURO - USANDO IMAGEM gol_de_ouro.png (fallback para golden-goal.png) */}
              {showGoldenGoal && createPortal(
                <img
                  ref={(el) => { overlayRefs.current.goldenGoal = el; }}
                  src={golDeOuroImg}
                  alt="Gol de Ouro!"
                  className="gs-golden-goal"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10001,
                    pointerEvents: 'none',
                    width: isMobile ? 'min(90%, 500px)' : isTablet ? 'min(70%, 600px)' : 'min(60%, 700px)',
                    height: 'auto',
                    maxWidth: '700px',
                    animation: 'ganhouPop 5s ease-out forwards',
                    display: 'block',
                    visibility: 'visible',
                    opacity: 1
                  }}
                  onError={(e) => {
                    console.warn('⚠️ [JOGO] Erro ao carregar gol_de_ouro.png, usando fallback golden-goal.png');
                    e.target.src = goldenGoalImg;
                  }}
                  onLoad={() => {
                    console.log('✅ [JOGO] gol_de_ouro.png carregada com sucesso');
                  }}
                  onAnimationEnd={(e) => {
                    if (e.animationName === 'ganhouPop') {
                      console.log('✅ [JOGO] Animação ganhouPop (golden goal) terminou');
                    }
                  }}
                />,
                document.body
              )}
              
              {/* Overlay GANHOU 100 - USANDO IMAGEM ganhou_100.png COM ANIMAÇÃO (aparece após gol de ouro) */}
              {showGanhou100 && createPortal(
                <img
                  ref={(el) => { overlayRefs.current.ganhou100 = el; }}
                  src={ganhou100Img}
                  alt="Ganhou R$100!"
                  className="gs-ganhou"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10002, // Maior que gol_de_ouro para aparecer sobre ele
                    pointerEvents: 'none',
                    width: isMobile ? 'min(70%, 350px)' : isTablet ? 'min(55%, 450px)' : 'min(45%, 550px)',
                    height: 'auto',
                    maxWidth: '550px',
                    animation: 'ganhouPop 5s ease-out forwards',
                    display: 'block',
                    visibility: 'visible',
                    opacity: 1,
                    willChange: 'transform, opacity'
                  }}
                  onError={(e) => {
                    console.warn('⚠️ [JOGO] Erro ao carregar ganhou_100.png, continuando sem imagem');
                    // Não usar fallback aqui pois é específico para gol de ouro
                  }}
                  onLoad={() => {
                    console.log('✅ [JOGO] ganhou_100.png carregada com sucesso');
                  }}
                  onAnimationEnd={(e) => {
                    if (e.animationName === 'ganhouPop') {
                      console.log('✅ [JOGO] Animação ganhouPop (ganhou_100) terminou - finalizando ciclo');
                      endCycle();
                    }
                  }}
                />,
                document.body
              )}
            </>
          )}
          
          {/* HUD Inferior Esquerdo - Controles */}
          <div className="hud-bottom-left">
            <div className="game-actions">
                <button
                  onClick={() => {
                    if (!isMuted) playButtonClick();
                    console.log('💳 Botão Recarregar clicado');
                    navigate('/pagamentos');
                  }}
                  className="hud-btn primary"
                  disabled={gameState !== GAME_STATE.IDLE}
                  style={{
                    pointerEvents: gameState !== GAME_STATE.IDLE ? 'none' : 'auto',
                    opacity: gameState !== GAME_STATE.IDLE ? 0.5 : 1,
                    cursor: gameState !== GAME_STATE.IDLE ? 'not-allowed' : 'pointer'
                  }}
                >
                  <span className="btn-icon">💳</span>
                  <span>Recarregar</span>
                </button>
            </div>
          </div>
          
          {/* HUD Inferior Direito - Controles e Chat */}
          <div className="hud-bottom-right">
            <div className="control-panel">
              <div className="control-buttons">
                <button
                  onClick={toggleAudio}
                  className="control-btn"
                  title={isMuted ? 'Ativar Áudio' : 'Desativar Áudio'}
                >
                  <span className="btn-icon">{isMuted ? '🔇' : '🔊'}</span>
                </button>
                <button
                  onClick={() => setChatOpen(!chatOpen)}
                  className="control-btn"
                  title={chatOpen ? 'Fechar Chat' : 'Abrir Chat'}
                  style={{
                    background: chatOpen ? 'rgba(35, 195, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    border: chatOpen ? '1px solid #23c381' : '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <span className="btn-icon">💬</span>
                </button>
                <button
                  className="control-btn"
                  title={`Rank: ${rankInfo.title}`}
                  style={{
                    position: 'relative',
                    background: `rgba(255, 255, 255, 0.1)`,
                    border: `1px solid ${rankInfo.color}40`,
                    boxShadow: `0 0 8px ${rankInfo.color}40`
                  }}
                >
                  <span className="btn-icon" style={{ fontSize: '20px' }}>{rankInfo.icon}</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Chat Panel */}
          {chatOpen && (
            <div 
              className="chat-panel" 
              style={{ 
                zIndex: 1000,
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: 'min(350px, calc(100vw - 40px))',
                maxHeight: '400px',
                background: 'rgba(0, 0, 0, 0.9)',
                border: '2px solid #23c381',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                pointerEvents: 'auto'
              }}
            >
              <div className="chat-header" style={{
                background: '#23c381',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '10px 10px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 600
              }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>💬 Chat em Tempo Real</h3>
                <button
                  className="chat-close"
                  onClick={() => setChatOpen(false)}
                  title="Fechar Chat"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '0',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1'
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Chat showHeader={false} />
              </div>
            </div>
          )}
          
          {/* Erro */}
          {error && (
            <div className="gs-error">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jogo;

