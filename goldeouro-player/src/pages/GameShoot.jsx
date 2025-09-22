import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./game-scene.css"; // CSS base escopado só da /game
import { useResponsiveGameScene } from "../hooks/useResponsiveGameScene"; // Hook responsivo
import audioManager from "../utils/audioManager";
import musicManager from "../utils/musicManager";
import ParticleSystem from "../components/ParticleSystem";
import apiClient from "../services/apiClient";

// Importar assets com fallback
import bg from "../assets/bg_goal.jpg";
import ballPng from "../assets/ball.png";
import gooolPng from "../assets/goool.png";
import defendeuPng from "../assets/defendeu.png";
import ganhouPng from "../assets/ganhou.png";

import gIdle from "../assets/goalie_idle.png";
import gTL from "../assets/goalie_dive_tl.png";
import gTR from "../assets/goalie_dive_tr.png";
import gBL from "../assets/goalie_dive_bl.png";
import gBR from "../assets/goalie_dive_br.png";
import gMID from "../assets/goalie_dive_mid.png";

const DIRS = ["TL","TR","MID","BL","BR"];

const GOAL_ZONES = {
  TL: { x: 8,  y: 14 },
  TR: { x: 92, y: 14 },
  MID:{ x: 50, y: 22 },
  BL: { x: 12, y: 74 },
  BR: { x: 88, y: 74 },
};

function goalieSprite(pose) {
  switch (pose) {
    case "TL": return gTL;
    case "TR": return gTR;
    case "BL": return gBL;
    case "BR": return gBR;
    case "MID": return gMID;
    default:   return gIdle;
  }
}

export default function GameShoot() {
  const headerRef = useRef(null);
  const [balance, setBalance] = useState(0);
  const [totalShots, setTotalShots] = useState(10);
  const [shotsTaken, setShotsTaken] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  
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
  const [currentBet, setCurrentBet] = useState(1);
  const [sessionWins, setSessionWins] = useState(0);
  const [sessionLosses, setSessionLosses] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [estimatedWait, setEstimatedWait] = useState(0);

  // Estados das funcionalidades futuras
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [gameTime, setGameTime] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalGames, setTotalGames] = useState(0);
  const [rank, setRank] = useState("Novato");
  const [achievements, setAchievements] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [theme, setTheme] = useState("night"); // night, day
  const [isAdmin, setIsAdmin] = useState(false); // Verificar se é administrador
  const navigate = useNavigate();

  const goalieImg = useMemo(() => goalieSprite(goaliePose), [goaliePose]);

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
    
    // Iniciar música de fundo do gameplay em modo ativo
    musicManager.playGameplayMusic();
    
    // Simular carregamento
    setTimeout(() => {
      setLoading(false);
      console.log("✅ GameShoot carregado!");
    }, 100);

    // Cleanup: parar música ao sair do componente
    return () => { 
      ro.disconnect(); 
      window.removeEventListener('resize', setVh); 
      document.body.removeAttribute('data-page'); 
      musicManager.stopMusic(); 
    };
  }, []);

  // Carregar saldo do usuário (simulado em desenvolvimento)
  useEffect(() => {
    const carregarSaldo = async () => {
      try {
        // Em desenvolvimento, usar saldo simulado
        if (import.meta.env.MODE === 'development') {
          setBalance(150); // Saldo simulado para desenvolvimento
          setLoadingBalance(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        try {
          const response = await apiClient.get('/usuario/perfil');
          setBalance(response.data.balance || 0);
        } catch (error) {
          console.error('Erro ao carregar saldo:', response.statusText);
        }
      } catch (error) {
        console.error('Erro ao carregar saldo:', error);
      } finally {
        setLoadingBalance(false);
      }
    };

    carregarSaldo();
  }, [navigate]);

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
    if (shooting) return;
    setShooting(true);
    setError("");

    // Tocar som de chute
    audioManager.playKickSound();

    const t = goalToStage(GOAL_ZONES[dir]);
    setTargetStage(t);
    requestAnimationFrame(() => setBallPos({ x: t.x, y: t.y }));

    // Simulação (trocar pelo backend depois)
    const isGoal = Math.random() < 0.5;
    const goalieDirection = isGoal
      ? (DIRS.filter(k=>k!==dir))[Math.floor(Math.random()*4)]
      : dir;
    const gTarget = goalieTargetFor(goalieDirection);

    setGoaliePose(goalieDirection);
    requestAnimationFrame(() => setGoalieStagePos(gTarget));

    setTimeout(() => {
      setShowGoool(isGoal);
      setShowDefendeu(!isGoal);
      setShotsTaken(s => s+1);
      
      // Ativar partículas baseado no resultado
      const particleType = isGoal ? 'goal' : 'save';
      const particlePosition = isGoal ? { x: 50, y: 30 } : { x: 50, y: 40 };
      setParticles({ active: true, type: particleType, position: particlePosition });
      
      // Tocar som baseado no resultado
      if (isGoal) {
        audioManager.play('goal');
        setTimeout(() => {
          setShowGanhou(true);
          audioManager.play('victory');
          // Reset após "ganhou" aparecer - 4.2s total (1.2s para aparecer + 3s para exibir)
          setTimeout(() => {
            setBallPos({ x: 50, y: 90 });
            setTargetStage(null);
            setShowGoool(false);
            setShowDefendeu(false);
            setShowGanhou(false);
            setGoaliePose("idle");
            setGoalieStagePos({ x: 50, y: 62, rot: 0 });
            setShooting(false);
          }, 3000); // 3 segundos para exibir "ganhou"
        }, 1200); // Aparece após o "goool.png" desaparecer (1.2s = duração da animação gooolPop)
      } else {
        audioManager.play('save');
        musicManager.playDefenseSound(); // Som específico de defesa
        // Para defesa, usar timing normal
        resetAfter();
      }
    }, 950);
  }

  function resetAfter(){
    // Timing apenas para defesa (2 segundos)
    setTimeout(() => {
      setBallPos({ x: 50, y: 90 });
      setTargetStage(null);
      setShowGoool(false);
      setShowDefendeu(false);
      setShowGanhou(false);
      setGoaliePose("idle");
      setGoalieStagePos({ x: 50, y: 62, rot: 0 });
      setShooting(false);
    }, 2000);
  }

  // Funções do sistema de apostas
  function handleBetChange(newBet) {
    if (newBet >= 1 && newBet <= 10 && newBet <= balance) {
      setCurrentBet(newBet);
    }
  }

  function handleJoinQueue() {
    if (balance >= currentBet && gameStatus === "playing") {
      setGameStatus("waiting");
      setQueuePosition(Math.floor(Math.random() * 8) + 1); // Simular posição na fila
      setEstimatedWait(Math.floor(Math.random() * 30) + 10); // 10-40 segundos
    }
  }

  function handleLeaveQueue() {
    setGameStatus("playing");
    setQueuePosition(0);
    setEstimatedWait(0);
  }

  function simulateQueueUpdate() {
    if (gameStatus === "waiting") {
      const newPosition = Math.max(0, queuePosition - Math.floor(Math.random() * 2));
      setQueuePosition(newPosition);
      
      if (newPosition === 0) {
        setGameStatus("playing");
        setShotsTaken(0);
        setBalance(prev => prev - currentBet);
        setMultiplier(1.0);
      }
    }
  }

  // Simular atualizações da fila
  useEffect(() => {
    const interval = setInterval(simulateQueueUpdate, 2000);
    return () => clearInterval(interval);
  }, [gameStatus, queuePosition]);

  function getStatusMessage() {
    switch (gameStatus) {
      case "waiting": return `Aguardando Jogadores... (${queuePosition}/${queueTotal})`;
      case "full": return "Partida Cheia - Tente novamente";
      case "connecting": return "Conectando ao servidor...";
      default: return "Partida Ativa";
    }
  }

  function getStatusColor() {
    switch (gameStatus) {
      case "waiting": return "#fbbf24";
      case "full": return "#ef4444";
      case "connecting": return "#3b82f6";
      default: return "#10b981";
    }
  }

  // Funções das funcionalidades futuras
  function toggleAudio() { 
    const newAudioState = !audioEnabled;
    setAudioEnabled(newAudioState);
    
    console.log('🔊 Toggle Audio:', newAudioState ? 'ON' : 'OFF');
    
    // Controlar áudio do jogo
    if (newAudioState) {
      audioManager.enable(); // Ativar áudio
      musicManager.resume(); // Resumir música de fundo
    } else {
      audioManager.disable(); // Desativar áudio
      musicManager.stopMusic(); // Parar música de fundo
    }
    
    // Aplicar controle de áudio global - MUTAR TODOS OS ÁUDIOS
    if (typeof window !== 'undefined') {
      // Mutar todos os elementos de áudio e vídeo
      const audioElements = document.querySelectorAll('audio, video');
      audioElements.forEach(el => {
        el.muted = !newAudioState;
        if (newAudioState) {
          el.volume = 0.5; // Volume padrão quando ativado
        } else {
          el.volume = 0; // Volume zero quando mutado
        }
      });
      
      // Mutar contexto de áudio Web Audio API
      if (audioManager.audioContext) {
        const gainNode = audioManager.audioContext.createGain();
        gainNode.gain.value = newAudioState ? 1 : 0;
      }
      
      // Mutar música de fundo específica
      if (musicManager.currentMusic) {
        musicManager.currentMusic.muted = !newAudioState;
        musicManager.currentMusic.volume = newAudioState ? musicManager.volume : 0;
      }
    }
  }
  
  // Função adjustVolume removida - controle de volume simplificado

  function toggleTheme() {
    setTheme(theme === "night" ? "day" : "night");
  }

  function toggleChat() {
    setShowChat(!showChat);
  }
  
  // Verificar se é administrador (simulação - em produção viria do backend)
  useEffect(() => {
    const checkAdminStatus = () => {
      // DESABILITADO PARA PRODUÇÃO - Debug não deve aparecer
      const isYou = false; // Sempre false em produção
      setIsAdmin(isYou);
    };
    checkAdminStatus();
  }, []);

  function getRankColor() {
    switch (rank) {
      case "Novato": return "#ffffff";
      case "Bronze": return "#cd7f32";
      case "Prata": return "#c0c0c0";
      case "Ouro": return "#ffd700";
      case "Diamante": return "#b9f2ff";
      case "Mestre": return "#8b5cf6";
      default: return "#ffffff";
    }
  }

  function getAccuracyColor() {
    if (accuracy >= 80) return "#10b981";
    if (accuracy >= 60) return "#f59e0b";
    return "#ef4444";
  }

  // Simular cronômetro do jogo
  useEffect(() => {
    const timer = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simular atualização de precisão
  useEffect(() => {
    if (shotsTaken > 0) {
      const newAccuracy = Math.round((shotsTaken - Math.random() * shotsTaken * 0.3) / shotsTaken * 100);
      setAccuracy(newAccuracy);
    }
  }, [shotsTaken]);

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

  // Determinar classe de responsividade baseada no tamanho da tela
  const getResponsiveClass = () => {
    if (screenSize.width >= 1920) return 'desktop-large';
    if (screenSize.width >= 1440) return 'desktop-medium';
    if (screenSize.width >= 1200) return 'desktop-small';
    if (screenSize.width >= 1024) return 'tablet-large';
    if (screenSize.width >= 768) return 'tablet-medium';
    if (screenSize.width >= 480) return 'mobile-large';
    return 'mobile-small';
  };

    console.log("🎮 Renderizando página do jogo");
  return (
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
                              disabled={amount > balance}
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
                  <button className="btn-partida" onClick={handleJoinQueue}>Em Jogo</button>
                </div>
                <div className="hud-right">
                  <button className="btn-dashboard" onClick={() => navigate('/dashboard')}>Jogador</button>
                </div>
              </div>

              {/* Indicador de resolução para debug */}
              {debug && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  zIndex: 9999,
                  fontFamily: 'monospace'
                }}>
                  <div>Resolução: {currentResolution}</div>
                  <div>CSS: {cssLoading ? 'Carregando...' : 'Carregado'}</div>
                  <div>Goleiro: scale({currentConfig.goalie.scale})</div>
                  <div>Bola: scale({currentConfig.ball.scale})</div>
                </div>
              )}

              {/* RODAPÉ DA CENA */}
              <div className="hud-footer">
                <div className="hud-bottom-left">
                  {gameStatus === "playing" ? (
                    <button 
                      className="btn-queue hud-btn primary" 
                      onClick={handleJoinQueue}
                      disabled={shooting || balance < currentBet}
                    >
                      <span className="btn-icon">🎮</span>
                      Entrar na Fila
                    </button>
                  ) : (
                    <button 
                      className="btn-queue hud-btn secondary" 
                      onClick={handleLeaveQueue}
                    >
                      <span className="btn-icon">🚪</span>
                      Sair da Fila
                    </button>
                  )}
                </div>
                <div className="hud-bottom-right">
                  <div className="hud-cluster">
                    <button className="control-btn" onClick={toggleAudio} title={audioEnabled ? "Desativar Áudio" : "Ativar Áudio"}>
                      <span className="btn-icon">{audioEnabled ? "🔊" : "🔇"}</span>
                    </button>
                    <button className="control-btn" onClick={toggleChat} title="Chat">
                      <span className="btn-icon">💬</span>
                    </button>
                    <div className="rank-display" title={`Rank: ${rank}`}>
                      <span className="rank-icon">🏅</span>
                      <span className="rank-text" style={{ color: getRankColor() }}>{rank}</span>
                    </div>
                  </div>
                </div>
              </div>

                {/* Chat */}
                {showChat && (
                  <div className="chat-panel">
                    <div className="chat-header">
                      <span>Chat do Jogo</span>
                      <button className="chat-close" onClick={toggleChat}>×</button>
                    </div>
                    <div className="chat-messages">
                      <div className="chat-message">
                        <span className="chat-user">Sistema:</span>
                        <span className="chat-text">Bem-vindo ao Gol de Ouro!</span>
                      </div>
                    </div>
                    <div className="chat-input">
                      <input type="text" placeholder="Digite sua mensagem..." />
                      <button className="chat-send">Enviar</button>
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
                  }}
                />

                {/* Bola */}
                <img src={ballPng} alt="Bola"
                  className={`gs-ball ${targetStage ? "moving" : ""}`}
                  style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
                />

                {/* GOL overlay */}
                {showGoool && <img src={gooolPng} alt="GOOOL!" className="gs-goool" />}

                {/* GANHOU overlay - aparece após o goool.png */}
                {showGanhou && <img src={ganhouPng} alt="VOCÊ GANHOU!" className="gs-ganhou" />}

                {/* DEFENDEU overlay */}
                {showDefendeu && <img src={defendeuPng} alt="DEFENDEU!" className="gs-defendeu" />}

                {/* Erro */}
                {error && <div className="gs-error">⚠ {error}</div>}

                {/* Debug overlay */}
                {debug && (
                  <div className="gs-debug">
                    <div className="goal-box" />
                    {Object.entries(GOAL_ZONES).map(([k,pos])=>{
                      const s = zonePositions[k] || { x: 50, y: 50 };
                      return <div key={k} className="dbg-point" style={{ left:`${s.x}%`, top:`${s.y}%` }}>{k}</div>;
                    })}
                  </div>
                )}

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
  );
}