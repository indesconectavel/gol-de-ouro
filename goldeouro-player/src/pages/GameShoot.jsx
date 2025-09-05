import React, { useEffect, useMemo, useState } from "react";
import "./game-shoot.css";

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
  const [balance, setBalance] = useState(0);
  const [totalShots, setTotalShots] = useState(10);
  const [shotsTaken, setShotsTaken] = useState(0);
  
  // Hook para manter proporção responsiva baseada no print de referência
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  const [shooting, setShooting] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 50, y: 90 });
  const [targetStage, setTargetStage] = useState(null);

  const [goaliePose, setGoaliePose] = useState("idle");
  const [goalieStagePos, setGoalieStagePos] = useState({ x: 50, y: 62, rot: 0 });

  const [showGoool, setShowGoool] = useState(false);
  const [showDefendeu, setShowDefendeu] = useState(false);
  const [showGanhou, setShowGanhou] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState(true); // liga/desliga overlay de debug
  const [loading, setLoading] = useState(true);

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

  const goalieImg = useMemo(() => goalieSprite(goaliePose), [goaliePose]);

  // Debug: verificar se os assets carregaram
  useEffect(() => {
    console.log("🎮 GameShoot carregando...");
    console.log("📸 Assets:", { bg, ballPng, gooolPng, gIdle, gTL, gTR, gBL, gBR, gMID });
    
    // Simular carregamento
    setTimeout(() => {
      setLoading(false);
      console.log("✅ GameShoot carregado!");
    }, 100);
  }, []);

  function goalToStage({ x, y }) {
    const stage = document.querySelector(".gs-stage");
    const cs = getComputedStyle(stage);
    const gl = parseFloat(cs.getPropertyValue("--goal-left"));
    const gt = parseFloat(cs.getPropertyValue("--goal-top"));
    const gw = parseFloat(cs.getPropertyValue("--goal-width"));
    const gh = parseFloat(cs.getPropertyValue("--goal-height"));
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
      
      // Se marcou gol, mostrar imagem "ganhou.png" após o "goool.png" desaparecer
      if (isGoal) {
        setTimeout(() => {
          setShowGanhou(true);
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
          }, 5000); // 5 segundos para exibir "ganhou"
        }, 1200); // Aparece após o "goool.png" desaparecer (1.2s = duração da animação gooolPop)
      } else {
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
    setAudioEnabled(!audioEnabled);
    // Aplicar controle de áudio global
    if (typeof window !== 'undefined') {
      const audioElements = document.querySelectorAll('audio, video');
      audioElements.forEach(el => {
        el.muted = !audioEnabled;
        el.volume = audioEnabled ? 0.5 : 0; // Volume fixo em 50%
      });
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
      // Simulando que você sempre é admin para ver o botão de debug
      const isYou = true; // Altere para false se não quiser ver o botão
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

  // Loading screen
  if (loading) {
    return (
      <div className="gs-wrapper">
        <div className="gs-stage" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '2em' }}>⚽</div>
          <div style={{ fontSize: '1.5em', color: '#eaf6ff' }}>Carregando Gol de Ouro...</div>
          <div style={{ fontSize: '0.9em', color: '#a0a0a0' }}>Preparando o jogo...</div>
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

  return (
    <div className={`gs-wrapper ${getResponsiveClass()}`}>
      <div className="gs-stage">
        <img src={bg} alt="Gol de Ouro - Estádio" className="gs-bg" />

        {/* HUD Principal - Design Glassmorphism */}
        <div className="gs-hud">
          <div className="hud-left">
            <div className="brand">
              <img src="/images/Gol_de_Ouro_logo.png" alt="Gol de Ouro" className="brand-logo" />
              <div className="brand-info">
                <span className="brand-name">Gol de Ouro</span>
                <span className="brand-subtitle">Futebol Virtual</span>
              </div>
            </div>
          </div>
          
          <div className="hud-center">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <span className="stat-label">Saldo</span>
                  <strong className="stat-value">{balance.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</strong>
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

        {/* Status da Partida - Centralizado abaixo do cabeçalho */}
        <div className="game-status-header">
          <div className="status-card" style={{ backgroundColor: getStatusColor() }}>
            <span className="status-message">{getStatusMessage()}</span>
            {gameStatus === "waiting" && (
              <span className="wait-time">⏱️ ~{estimatedWait}s</span>
            )}
          </div>
        </div>

        {/* HUD Inferior Esquerdo - Controles de Partida */}
        <div className="hud-bottom-left">
          <div className="game-actions">
            {gameStatus === "playing" ? (
              <button 
                className="hud-btn primary" 
                onClick={handleJoinQueue}
                disabled={shooting || balance < currentBet}
              >
                <span className="btn-icon">🎮</span>
                Entrar na Fila
              </button>
            ) : (
              <button 
                className="hud-btn secondary" 
                onClick={handleLeaveQueue}
              >
                <span className="btn-icon">🚪</span>
                Sair da Fila
              </button>
            )}
          </div>
        </div>

        {/* HUD Lateral Esquerda - Debug (apenas para admin) */}
        {isAdmin && (
          <div className="hud-left-debug">
            <button className="debug-btn" onClick={()=>setDebug(d=>!d)} title="Debug (Admin)">
              <span className="btn-icon">{debug?"👁️":"👁️‍🗨️"}</span>
              <span className="debug-text">{debug?"Ocultar":"Mostrar"} Debug</span>
            </button>
          </div>
        )}

        {/* HUD Inferior Direito - Controles Simplificados */}
        <div className="hud-bottom-right">
          <div className="control-panel">
            <div className="control-buttons">
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
              {/* Debug button - Desabilitado mas pronto para uso */}
              {/* {isAdmin && (
                <button className="control-btn" onClick={()=>setDebug(d=>!d)} title="Debug (Admin)">
                  <span className="btn-icon">{debug?"👁️":"👁️‍🗨️"}</span>
                </button>
              )} */}
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
          </div>
        </div>


        {/* Zonas */}
        {DIRS.map((k) => {
          const s = goalToStage(GOAL_ZONES[k]);
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
              const s = goalToStage(pos);
              return <div key={k} className="dbg-point" style={{ left:`${s.x}%`, top:`${s.y}%` }}>{k}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}