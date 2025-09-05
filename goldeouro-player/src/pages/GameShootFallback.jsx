import React, { useEffect, useMemo, useState } from "react";
import "./game-shoot.css";

const DIRS = ["TL","TR","MID","BL","BR"];

const GOAL_ZONES = {
  TL: { x: 8,  y: 14 },
  TR: { x: 92, y: 14 },
  MID:{ x: 50, y: 22 },
  BL: { x: 12, y: 74 },
  BR: { x: 88, y: 74 },
};

function goalieEmoji(pose) {
  switch (pose) {
    case "TL": return "🏃‍♂️";
    case "TR": return "🏃‍♂️";
    case "BL": return "🏃‍♂️";
    case "BR": return "🏃‍♂️";
    case "MID": return "🏃‍♂️";
    default:   return "🧍‍♂️";
  }
}

export default function GameShootFallback() {
  const [balance, setBalance] = useState(0);
  const [totalShots, setTotalShots] = useState(10);
  const [shotsTaken, setShotsTaken] = useState(0);

  const [shooting, setShooting] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 50, y: 90 });
  const [targetStage, setTargetStage] = useState(null);

  const [goaliePose, setGoaliePose] = useState("idle");
  const [goalieStagePos, setGoalieStagePos] = useState({ x: 50, y: 62, rot: 0 });

  const [showGoool, setShowGoool] = useState(false);
  const [showDefendeu, setShowDefendeu] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState(true);

  const goalieEmoji = useMemo(() => goalieEmoji(goaliePose), [goaliePose]);

  function goalToStage({ x, y }) {
    const stage = document.querySelector(".gs-stage");
    if (!stage) return { x: 50, y: 50 };
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
    const offsetX = (base.x - centerX) * 0.8; // 80% do deslocamento original
    const offsetY = (base.y - centerY) * 0.8;
    
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
      resetAfter();
    }, 950);
  }

  function resetAfter(){
    setTimeout(() => {
      setBallPos({ x: 50, y: 90 });
      setTargetStage(null);
      setShowGoool(false);
      setShowDefendeu(false);
      setGoaliePose("idle");
      setGoalieStagePos({ x: 50, y: 62, rot: 0 });
      setShooting(false);
    }, 1200);
  }

  return (
    <div className="gs-wrapper">
      <div className="gs-stage" style={{ background: 'linear-gradient(135deg, #0b3a1d, #1a5a2e)' }}>
        {/* HUD */}
        <div className="gs-hud">
          <div className="hud-left">
            <div className="brand">
              <div className="brand-logo" style={{ 
                width: '48px', 
                height: '48px', 
                background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: '24px',
                color: '#000',
                fontWeight: 'bold'
              }}>⚽</div>
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
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <span className="stat-label">Precisão</span>
                  <strong className="stat-value">{shotsTaken > 0 ? Math.round((shotsTaken - Math.random() * shotsTaken) / shotsTaken * 100) : 0}%</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="hud-right">
            <div className="hud-actions">
              <button className="hud-btn primary" disabled={shooting} onClick={() => { /* abrir modal aposta */ }}>
                <span className="btn-icon">🎮</span>
                Nova Aposta
              </button>
              <button className="hud-btn secondary" onClick={()=>setDebug(d=>!d)}>
                <span className="btn-icon">{debug?"👁️":"👁️‍🗨️"}</span>
                {debug?"Ocultar":"Mostrar"} Debug
              </button>
            </div>
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
        <div
          className="gs-goalie"
          style={{
            left: `${goalieStagePos.x}%`,
            top: `${goalieStagePos.y}%`,
            transform: `translate(-50%,-50%) rotate(${goalieStagePos.rot}deg)`,
            fontSize: '3em',
            display: 'grid',
            placeItems: 'center',
            width: '80px',
            height: '80px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.3)'
          }}
        >
          {goalieEmoji}
        </div>

        {/* Bola */}
        <div
          className={`gs-ball ${targetStage ? "moving" : ""}`}
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
            fontSize: '2em',
            display: 'grid',
            placeItems: 'center',
            width: '50px',
            height: '50px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: '50%',
            border: '2px solid #333'
          }}
        >
          ⚽
        </div>

        {/* GOL overlay */}
        {showGoool && (
          <div className="gs-goool" style={{ 
            fontSize: '2.8em', 
            color: '#ffd700', 
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            display: 'grid',
            placeItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: '15px'
          }}>
            GOOOL! 🎉
          </div>
        )}

        {/* DEFENDEU overlay */}
        {showDefendeu && (
          <div className="gs-defendeu" style={{ 
            fontSize: '2.8em', 
            color: '#ff6b6b', 
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            display: 'grid',
            placeItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: '15px'
          }}>
            DEFENDEU! 🧤
          </div>
        )}

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
