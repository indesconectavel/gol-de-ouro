// PÁGINA GAMESHOOT RESTAURADA - GOL DE OURO
// ====================================================
// Versão híbrida: estrutura completa do backup + integração backend real
// Data: 2025-01-24
// Status: PÁGINA VALIDADA RESTAURADA COM BACKEND REAL

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { createPortal } from 'react-dom';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import "./game-scene.css"; // CSS base escopado só da /game
import "./game-shoot.css"; // Para classes gs-goool e gs-defendeu
import { useResponsiveGameScene } from "../hooks/useResponsiveGameScene"; // Hook responsivo
import ParticleSystem from "../components/ParticleSystem";
import gameService from '../services/gameService';
import useSimpleSound from '../hooks/useSimpleSound';
import useGamification from '../hooks/useGamification';
import Chat from '../components/Chat';

// Importar assets com fallback
import bg from "../assets/bg_goal.jpg";
import ballPng from "../assets/ball.png";
import gooolPng from "../assets/goool.png";
import defendeuPng from "../assets/defendeu.png";
import ganhouPng from "../assets/ganhou.png";
import goldenGoalPng from "../assets/golden-goal.png";

import gIdle from "../assets/goalie_idle.png";
import gTL from "../assets/goalie_dive_tl.png";
import gTR from "../assets/goalie_dive_tr.png";
import gBL from "../assets/goalie_dive_bl.png";
import gBR from "../assets/goalie_dive_br.png";
import gMID from "../assets/goalie_dive_mid.png";

const DIRS = ["TL","TR","C","BL","BR"];

const GOAL_ZONES = {
  TL: { x: 8,  y: 14 },
  TR: { x: 92, y: 14 },
  C:  { x: 50, y: 22 },
  BL: { x: 12, y: 74 },
  BR: { x: 88, y: 74 },
};

function goalieSprite(pose) {
  switch (pose) {
    case "TL": return gTL;
    case "TR": return gTR;
    case "BL": return gBL;
    case "BR": return gBR;
    case "C": return gMID; // "C" usa a imagem do meio (MID)
    default:   return gIdle;
  }
}

export default function GameShoot() {
  const headerRef = useRef(null);
  const navigate = useNavigate();
  
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
  const [totalShots, setTotalShots] = useState(10);
  const [shotsTaken, setShotsTaken] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [currentBet, setCurrentBet] = useState(1);
  const [sessionWins, setSessionWins] = useState(0);
  const [sessionLosses, setSessionLosses] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalGoldenGoals, setTotalGoldenGoals] = useState(0);
  const [globalCounter, setGlobalCounter] = useState(0);
  const [shotsUntilGoldenGoal, setShotsUntilGoldenGoal] = useState(0);
  const [gameInfo, setGameInfo] = useState(null);
  
  // Hook para manter proporção responsiva baseada no print de referência
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  
  // Hook responsivo para carregar CSS específico por resolução
  const { currentResolution, isLoading: cssLoading, currentConfig, isMobile, isTablet, isDesktop } = useResponsiveGameScene();

  const [shooting, setShooting] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 50, y: 90 });
  const [targetStage, setTargetStage] = useState(null);

  const [goaliePose, setGoaliePose] = useState("idle");
  const [goalieStagePos, setGoalieStagePos] = useState({ x: 50, y: 62, rot: 0 });

  const [showGoool, setShowGoool] = useState(false);
  const [showDefendeu, setShowDefendeu] = useState(false);
  const [showGanhou, setShowGanhou] = useState(false);
  const [showGoldenGoal, setShowGoldenGoal] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState(false); // liga/desliga overlay de debug - DESABILITADO PARA PRODUÇÃO
  const [loading, setLoading] = useState(true);

  // Estados para partículas
  const [particles, setParticles] = useState({ active: false, type: 'goal', position: { x: 50, y: 50 } });

  // Estados das zonas de chute
  const [zonePositions, setZonePositions] = useState({});

  // Estados do sistema de apostas
  const [gameStatus, setGameStatus] = useState("playing"); // playing, waiting, full, connecting
  const [queuePosition, setQueuePosition] = useState(0);
  const [queueTotal, setQueueTotal] = useState(10);
  const [multiplier, setMultiplier] = useState(1.0);
  const [estimatedWait, setEstimatedWait] = useState(0);

  // Estado do chat
  const [showChat, setShowChat] = useState(false);
  
  // ✅ OTIMIZAÇÃO: Ref para armazenar timers e limpar no cleanup
  const timersRef = useRef([]);
  
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

  const goalieImg = useMemo(() => goalieSprite(goaliePose), [goaliePose]);

  // Inicializar jogo com backend real
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
        
        console.log('✅ [GAMESHOOT] Jogo inicializado com sucesso');
        console.log(`💰 [GAMESHOOT] Saldo: R$ ${userData.saldo}`);
        console.log(`📊 [GAMESHOOT] Contador global: ${gameInfo.goldenGoal.counter}`);
        
      } else {
        throw new Error(initResult.error || 'Erro ao inicializar jogo');
      }
      
    } catch (error) {
      console.error('❌ [GAMESHOOT] Erro ao inicializar:', error);
      setError('Erro ao carregar dados do jogo');
      toast.error('Erro ao carregar dados do jogo');
    } finally {
      setLoading(false);
      setLoadingBalance(false);
    }
  };

  // Debug: verificar se os assets carregaram
  useEffect(() => {
    console.log("🎮 GameShoot carregando...");
    console.log("📸 Assets:", { bg, ballPng, gooolPng, gIdle, gTL, gTR, gBL, gBR, gMID });
    
    // Ativar escopo só nesta rota
    document.body.setAttribute('data-page', 'game');
    const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    setVh(); 
    window.addEventListener('resize', setVh);
    
    // ResizeObserver para medir header e posicionar ações abaixo do card
    const ro = new ResizeObserver(() => {
      const hdr = headerRef.current;
      if (!hdr) return;
      const rect = hdr.getBoundingClientRect();
      // bottom do header em px relativo à viewport
      document.documentElement.style.setProperty('--hdr-bottom', `${rect.bottom}px`);
    });
    if (headerRef.current) ro.observe(headerRef.current);
    
    // Iniciar música de fundo após 2 segundos
    if (!isMuted) {
      const musicTimer = setTimeout(() => {
        playBackgroundMusic();
      }, 2000);
      addTimer(musicTimer);
    }
    
    // Inicializar jogo
    initializeGame();

    // Cleanup: parar música ao sair do componente
    return () => { 
      ro.disconnect(); 
      window.removeEventListener('resize', setVh); 
      document.body.removeAttribute('data-page'); 
      clearAllTimers();
    };
  }, []);

  function goalToStage({ x, y }) {
    // Usar o novo seletor da estrutura atualizada
    const stage = document.querySelector("#stage-root .playfield");
    if (!stage) {
      // Fallback se o elemento não existir ainda
      return { x: x, y: y };
    }
    const cs = getComputedStyle(stage);
    const gl = parseFloat(cs.getPropertyValue("--goal-left")) || 19.5;
    const gt = parseFloat(cs.getPropertyValue("--goal-top")) || 36.5;
    const gw = parseFloat(cs.getPropertyValue("--goal-width")) || 61;
    const gh = parseFloat(cs.getPropertyValue("--goal-height")) || 33;
    return {
      x: gl + (x / 100) * gw,
      y: gt + (y / 100) * gh,
    };
  }

  function goalieTargetFor(dir) {
    const base = goalToStage(GOAL_ZONES[dir]);
    // Reduzir deslocamento em 20% - calcular posição intermediária
    const centerX = 50; // Posição central do goleiro
    const centerY = 62;
    
    // Redução adicional de 20% para posições laterais (TL, TR, BL, BR)
    const isLateral = dir === "TL" || dir === "TR" || dir === "BL" || dir === "BR";
    const reductionFactor = isLateral ? 0.64 : 0.8; // 0.8 * 0.8 = 0.64 (36% redução total)
    
    const offsetX = (base.x - centerX) * reductionFactor;
    const offsetY = (base.y - centerY) * reductionFactor;
    
    return { 
      x: centerX + offsetX, 
      y: centerY + offsetY, 
      rot: dir==="TL"||dir==="BL" ? -10 : dir==="TR"||dir==="BR" ? 10 : 0 
    };
  }

  async function handleShoot(dir) {
    if (shooting || balance < currentBet) return;
    
    // Feedback sonoro no clique
    if (!isMuted) playButtonClick();
    
    setShooting(true);
    setError("");

    // Tocar som de chute
    if (!isMuted) {
      playKickSound();
    }

    // ✅ CORREÇÃO: Animação do goleiro IMEDIATAMENTE na direção do chute
    const gTarget = goalieTargetFor(dir);
    setGoaliePose(dir); // Pular na direção do chute
    setGoalieStagePos(gTarget); // Atualizar posição diretamente

    // Animação da bola e goleiro - NÃO resetar aqui, será resetado após resultado
    const t = goalToStage(GOAL_ZONES[dir]);
    setTargetStage(t);
    setBallPos({ x: t.x, y: t.y });

    // Validar direção antes de enviar
    if (!['TL', 'TR', 'C', 'BL', 'BR'].includes(dir)) {
      console.error('❌ [GAMESHOOT] Direção inválida:', dir);
      throw new Error('Direção inválida');
    }

    // Validar valor de aposta
    if (![1, 2, 5, 10].includes(currentBet)) {
      console.error('❌ [GAMESHOOT] Valor de aposta inválido:', currentBet);
      throw new Error('Valor de aposta inválido');
    }

    // Validar saldo
    if (balance < currentBet) {
      console.error('❌ [GAMESHOOT] Saldo insuficiente:', balance, '<', currentBet);
      throw new Error('Saldo insuficiente');
    }

    // Log para debug
    console.log('🎯 [GAMESHOOT] Enviando chute:', { direction: dir, amount: currentBet, balance });

    try {
      // Processar chute no backend REAL
      const result = await gameService.processShot(dir, currentBet);
      
      if (result.success) {
        const { shot, user, isGoldenGoal: isGoldenGoalShot } = result;
        const isGoal = shot.isWinner;
        const prize = shot.prize + shot.goldenGoalPrize;
        
        console.log('✅ [GAMESHOOT] Resultado recebido:', { isGoal, isGoldenGoalShot, prize });
        
        // Atualizar estados
        setBalance(user.newBalance);
        setGlobalCounter(user.globalCounter);
        
        // Atualizar estatísticas
        setShotsTaken(s => s+1);
        
        // Ativar partículas baseado no resultado
        const particleType = isGoal ? 'goal' : 'save';
        const particlePosition = isGoal ? { x: 50, y: 30 } : { x: 50, y: 40 };
        setParticles({ active: true, type: particleType, position: particlePosition });
        
        // IMPORTANTE: Capturar valores no momento para evitar closure stale
        const capturedIsGoal = isGoal;
        const capturedIsGoldenGoalShot = isGoldenGoalShot;
        const capturedPrize = prize;
        
        console.log('🎯 [GAMESHOOT] Valores capturados:', { capturedIsGoal, capturedIsGoldenGoalShot });
        
        // Mostrar resultado IMEDIATAMENTE - Lógica simplificada da v6
        if (capturedIsGoal) {
          console.log('⚽ [GAMESHOOT] É GOL!');
            if (capturedIsGoldenGoalShot) {
              // GOL DE OURO
              console.log('🏆 [GAMESHOOT] GOL DE OURO - setando showGoldenGoal = true');
              setShowGoldenGoal(true);
              console.log('🏆 [GAMESHOOT] showGoldenGoal setado para true');
              if (!isMuted) {
                playCelebrationSound();
                const crowdTimer = setTimeout(() => playCrowdSound(), 1000);
                addTimer(crowdTimer);
              }
              toast.success(`🏆 GOL DE OURO! Você ganhou R$ ${capturedPrize}!`);
              
              // Ocultar após 4 segundos
              const hideGoldenTimer = setTimeout(() => {
                console.log('🏆 [GAMESHOOT] Ocultando golden goal');
                setShowGoldenGoal(false);
                resetAnimations();
              }, 4000);
              addTimer(hideGoldenTimer);
            } else {
              // GOL NORMAL - Lógica da v6: mostrar goool.png imediatamente
              console.log('⚽ [GAMESHOOT] GOL NORMAL - setando showGoool = true');
              setShowGoool(true);
              console.log('⚽ [GAMESHOOT] showGoool setado para true');
              
              if (!isMuted) {
                playGoalSound();
                const crowdTimer2 = setTimeout(() => playCrowdSound(), 1500);
                addTimer(crowdTimer2);
              }
              toast.success(`⚽ GOL! Você ganhou R$ ${capturedPrize}!`);
              
              // Mostrar ganhou.png após 1.2s (timing da v6)
              const showGanhouTimer = setTimeout(() => {
                console.log('🎉 [GAMESHOOT] Mostrando ganhou.png');
                setShowGanhou(true);
                if (!isMuted) {
                  playCelebrationSound();
                }
                // Reset após "ganhou" aparecer - 4.2s total (1.2s para aparecer + 3s para exibir)
                const resetTimer = setTimeout(() => {
                  console.log('🔄 [GAMESHOOT] Resetando animações após ganhou');
                  resetAnimations();
                }, 3000);
                addTimer(resetTimer);
              }, 1200);
              addTimer(showGanhouTimer);
              
              // Ocultar goool.png após 1.2s (quando ganhou aparece)
              const hideGooolTimer = setTimeout(() => {
                console.log('🔄 [GAMESHOOT] Ocultando goool.png');
                setShowGoool(false);
              }, 1200);
              addTimer(hideGooolTimer);
            }
            
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
            // DEFESA - Lógica da v6: mostrar defendeu.png imediatamente
            console.log('🥅 [GAMESHOOT] DEFESA - setando showDefendeu = true');
            setShowDefendeu(true);
            console.log('🥅 [GAMESHOOT] showDefendeu setado para true');
            
            if (!isMuted) {
              playDefenseSound();
            }
            toast.info('🥅 Defesa! Tente novamente.');
            
            // Reset após 2 segundos (timing da v6)
            const resetTimer = setTimeout(() => {
              console.log('🔄 [GAMESHOOT] Resetando animações após defesa');
              resetAnimations();
            }, 2000);
            addTimer(resetTimer);
            
            setSessionLosses(prev => prev + 1);
            setCurrentStreak(0);
          }
          
          // Atualizar contador global
          setShotsUntilGoldenGoal(gameService.getShotsUntilGoldenGoal());
        
      } else {
        throw new Error(result.error || 'Erro ao processar chute');
      }
      
    } catch (error) {
      console.error('❌ [GAMESHOOT] Erro ao processar chute:', error);
      setError(error.message);
      toast.error(error.message);
      
      // Tocar som de erro (defesa)
      if (!isMuted) {
        playDefenseSound();
      }
      
      // Resetar animações em caso de erro
      const errorResetTimer = setTimeout(() => {
        resetAnimations();
      }, 1000);
      addTimer(errorResetTimer);
    } finally {
      setShooting(false);
    }
  }

  // ✅ OTIMIZAÇÃO: Memoizar resetAnimations
  const resetAnimations = useCallback(() => {
    console.log('🔄 [GAMESHOOT] resetAnimations chamado - resetando todos os estados');
    setBallPos({ x: 50, y: 90 });
    setTargetStage(null);
    setShowGoool(false);
    setShowDefendeu(false);
    setShowGanhou(false);
    setShowGoldenGoal(false);
    setGoaliePose("idle");
    setGoalieStagePos({ x: 50, y: 62, rot: 0 });
    setShooting(false);
  }, []);

  // Funções do sistema de apostas
  function handleBetChange(newBet) {
    if (newBet >= 1 && newBet <= 10 && newBet <= balance) {
      setCurrentBet(newBet);
      if (!isMuted) playButtonClick();
    }
  }

  function toggleAudio() {
    if (!isMuted) playButtonClick();
    toggleMute();
    console.log('🔊 Toggle Audio:', !isMuted ? 'OFF' : 'ON');
  }

  function toggleChat() {
    setShowChat(!showChat);
    if (!isMuted) playButtonClick();
  }

  function getRankColor() {
    return rankInfo.color;
  }

  // Monitorar tamanho da tela para manter proporção responsiva
  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Atualizar imediatamente
    updateScreenSize();

    // Adicionar listener para redimensionamento
    window.addEventListener('resize', updateScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Calcular posições das zonas de chute após o componente montar
  useEffect(() => {
    if (!loading) {
      const positions = {};
      DIRS.forEach(k => {
        positions[k] = goalToStage(GOAL_ZONES[k]);
      });
      setZonePositions(positions);
    }
  }, [loading]);

  // Loading screen
  if (loading) {
    console.log("🔄 Loading screen ativo");
    return (
      <div className="game-page">
        <div className="game-stage-wrap">
          <div className="game-stage">
            <div id="stage-root" className="stage-root">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexDirection: 'column', 
                gap: '20px',
                height: '100%',
                color: '#fff'
              }}>
                <div style={{ fontSize: '2em' }}>⚽</div>
                <div style={{ fontSize: '1.5em', color: '#eaf6ff' }}>Carregando Gol de Ouro...</div>
                <div style={{ fontSize: '0.9em', color: '#a0a0a0' }}>Preparando o jogo...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log("🎮 Renderizando página do jogo");
  return (
    <>
    <div className="game-page">
      {/* overlay: bloqueia retrato só nesta página */}
      <div className="game-rotate" aria-hidden="true">
        <div className="rotate-card">Gire o dispositivo para o modo horizontal para jogar</div>
      </div>

      {/* ===== CENA ===== */}
      <main className="game-stage-wrap">
        <div className="game-stage">
          <div id="stage-root" className="stage-root">
            <div className="playfield">
              <img src={bg} alt="Gol de Ouro - Estádio" className="scene-bg" />

              {/* Header REAL da cena: logo + métricas + apostas */}
              <div className="hud-header" ref={headerRef}>
                {/* Logo 200px */}
                <div className="brand">
                  <img className="brand-logo" src="/images/Gol_de_Ouro_logo.png" alt="Gol de Ouro" />
                </div>
                
                {/* HUD Principal - Design Glassmorphism */}
                <div className="gs-hud">
                  <div className="hud-center">
                    <div className="stats-grid">
                      <div className="stat-item">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                          <span className="stat-label">Saldo</span>
                          <strong className="stat-value">
                            {loadingBalance ? 'Carregando...' : balance.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
                          </strong>
                        </div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-icon">⚽</div>
                        <div className="stat-content">
                          <span className="stat-label">Chutes</span>
                          <strong className="stat-value">{shotsTaken}/{totalShots}</strong>
                        </div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-icon">🏆</div>
                        <div className="stat-content">
                          <span className="stat-label">Vitórias</span>
                          <strong className="stat-value">{sessionWins}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="hud-right">
                    <div className="betting-section">
                      <div className="bet-controls">
                        <span className="bet-label">Aposta:</span>
                        <div className="bet-buttons">
                          {[1, 2, 5, 10].map(amount => (
                            <button
                              key={amount}
                              className={`bet-btn ${currentBet === amount ? 'active' : ''} ${amount > balance ? 'disabled' : ''}`}
                              onClick={() => handleBetChange(amount)}
                              disabled={amount > balance || shooting}
                            >
                              R${amount}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BARRA DE AÇÕES SOBRE O CAMPO (mesma altura em ambos os lados) */}
              <div className="hud-actions">
                <div className="hud-left">
                  <button className="btn-partida" onClick={() => navigate('/dashboard')}>Dashboard</button>
                </div>
                <div className="hud-right">
                  <button className="btn-dashboard" onClick={() => {
                    if (!isMuted) playButtonClick();
                    navigate('/pagamentos');
                  }}>Recarregar</button>
                </div>
              </div>

              {/* RODAPÉ DA CENA */}
              <div className="hud-footer">
                <div className="hud-bottom-left">
                  <button 
                    className="btn-queue hud-btn primary" 
                    onClick={() => {
                      if (!isMuted) playButtonClick();
                      navigate('/pagamentos');
                    }}
                    disabled={shooting}
                  >
                    <span className="btn-icon">💳</span>
                    Recarregar
                  </button>
                </div>
                <div className="hud-bottom-right">
                  <div className="hud-cluster">
                    <button className="control-btn" onClick={toggleAudio} title={isMuted ? "Ativar Áudio" : "Desativar Áudio"}>
                      <span className="btn-icon">{isMuted ? "🔇" : "🔊"}</span>
                    </button>
                    <button className="control-btn" onClick={toggleChat} title="Chat">
                      <span className="btn-icon">💬</span>
                    </button>
                    <div className="rank-display" title={`Rank: ${rankInfo.title}`}>
                      <span className="rank-icon">{rankInfo.icon}</span>
                    </div>
                  </div>
                </div>
              </div>

                {/* Chat */}
                {showChat && (
                  <div className="chat-panel" style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isMobile ? '90%' : isTablet ? '60%' : '40%',
                    maxWidth: '500px',
                    height: '70%',
                    maxHeight: '600px',
                    background: 'rgba(0, 0, 0, 0.9)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div className="chat-header" style={{
                      padding: '15px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: 'white', fontWeight: 600 }}>💬 Chat em Tempo Real</span>
                      <button 
                        onClick={toggleChat}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          fontSize: '20px',
                          cursor: 'pointer',
                          padding: '0 10px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <Chat showHeader={false} />
                    </div>
                  </div>
                )}

                {/* Zonas */}
                {DIRS.map((k) => {
                  const s = zonePositions[k] || { x: 50, y: 50 }; // Fallback se não calculado ainda
                  return (
                    <button
                      key={k}
                      className={`gs-zone ${shooting ? "disabled" : ""}`}
                      style={{ left: `${s.x}%`, top: `${s.y}%` }}
                      onClick={() => handleShoot(k)}
                      disabled={shooting || balance < currentBet}
                      title={`Chutar ${k}`}
                    />
                  );
                })}

                {/* Goleiro */}
                <img
                  src={goalieImg}
                  alt="Goleiro"
                  className="gs-goalie"
                  style={{
                    left: `${goalieStagePos.x}%`,
                    top: `${goalieStagePos.y}%`,
                    transform: `translate(-50%,-50%) rotate(${goalieStagePos.rot}deg)`,
                    transition: 'left 0.5s cubic-bezier(0.4, 0, 0.2, 1), top 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s ease',
                    willChange: 'transform',
                  }}
                />

                {/* Bola */}
                <img src={ballPng} alt="Bola"
                  className={`gs-ball ${targetStage ? "moving" : ""}`}
                  style={{ 
                    left: `${ballPos.x}%`, 
                    top: `${ballPos.y}%`,
                    transition: 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1), top 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform',
                  }}
                />

                {/* Erro */}
                {error && <div className="gs-error">⚠ {error}</div>}

                {/* Sistema de Partículas */}
                <ParticleSystem
                  type={particles.type}
                  position={particles.position}
                  active={particles.active}
                  onComplete={() => setParticles({ active: false, type: 'goal', position: { x: 50, y: 50 } })}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
      
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
          <div style={{ marginTop: '10px', fontSize: '10px', color: '#aaa' }}>
            shooting: {shooting ? '✅' : '❌'}
          </div>
        </div>
      )}

      {/* Overlays - Renderizar diretamente no body usando Portal para evitar overflow:hidden */}
      {typeof document !== 'undefined' && document.body && (
        <>
          {/* Overlay GOL - USANDO IMAGEM goool.png COM ANIMAÇÃO */}
          {showGoool && createPortal(
            <img
              src={gooolPng}
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
            />,
            document.body
          )}

          {/* Overlay GANHOU - USANDO IMAGEM ganhou.png COM ANIMAÇÃO */}
          {showGanhou && createPortal(
            <img
              src={ganhouPng}
              alt="Ganhou!"
              className="gs-ganhou"
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10001,
                pointerEvents: 'none',
                width: isMobile ? 'min(70%, 350px)' : isTablet ? 'min(55%, 450px)' : 'min(45%, 550px)',
                height: 'auto',
                maxWidth: '550px',
                animation: 'ganhouPop 3s ease-out forwards',
                display: 'block',
                visibility: 'visible',
                opacity: 1
              }}
            />,
            document.body
          )}

          {/* Overlay DEFENDEU - USANDO IMAGEM defendeu.png COM ANIMAÇÃO */}
          {showDefendeu && createPortal(
            <img
              src={defendeuPng}
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
                opacity: 1
              }}
            />,
            document.body
          )}

          {/* Overlay GOL DE OURO */}
          {showGoldenGoal && createPortal(
            <img
              src={goldenGoalPng}
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
            />,
            document.body
          )}
        </>
      )}
    </>
  );
}
