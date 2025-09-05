import React, { useState } from "react";
import "./game-shoot.css";

export default function GameShootSimple() {
  const [shooting, setShooting] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 50, y: 90 });
  const [target, setTarget] = useState(null);
  const [result, setResult] = useState(null);
  const [goaliePose, setGoaliePose] = useState("idle");
  const [showGoool, setShowGoool] = useState(false);

  const ZONES = {
    TL: { x: 18, y: 25 },
    TR: { x: 82, y: 25 },
    BL: { x: 22, y: 74 },
    BR: { x: 78, y: 74 },
    MID: { x: 50, y: 50 },
  };

  function handleShoot(zoneKey) {
    if (shooting) return;
    const { x, y } = ZONES[zoneKey];
    setShooting(true);
    setTarget({ key: zoneKey, x, y });
    
    // Simulação simples
    const isGoal = Math.random() < 0.5;
    const goalieDir = isGoal ? "MID" : zoneKey;
    setGoaliePose(goalieDir);
    
    // Move bola
    requestAnimationFrame(() => setBallPos({ x, y }));
    
    setTimeout(() => {
      setResult(isGoal ? "goal" : "save");
      setShowGoool(isGoal);
      setTimeout(() => {
        setBallPos({ x: 50, y: 90 });
        setTarget(null);
        setResult(null);
        setShowGoool(false);
        setGoaliePose("idle");
        setShooting(false);
      }, 1200);
    }, 950);
  }

  return (
    <div className="gs-wrapper">
      <div className="gs-stage">
        {/* Fundo simples */}
        <div className="gs-bg" style={{ 
          background: "linear-gradient(135deg, #0b3a1d 0%, #1a5a2e 100%)",
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%"
        }} />
        
        {/* HUD simples */}
        <div className="gs-hud">
          <div className="hud-left">
            <div className="brand">
              <div className="brand-badge">⚽</div>
              <span>Gol de Ouro</span>
            </div>
          </div>
          <div className="hud-center">
            <div className="stat">
              <span>Saldo</span>
              <strong>R$ 0,00</strong>
            </div>
            <div className="divider" />
            <div className="stat">
              <span>Chutes</span>
              <strong>0/10</strong>
            </div>
          </div>
          <div className="hud-right">
            <button className="hud-btn" disabled={shooting}>
              Nova Aposta
            </button>
          </div>
        </div>

        {/* Zonas clicáveis */}
        {Object.entries(ZONES).map(([key, pos]) => (
          <button
            key={key}
            className={`gs-zone ${shooting ? "disabled" : ""}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onClick={() => handleShoot(key)}
            title={`Chutar ${key}`}
          />
        ))}

        {/* Goleiro simples */}
        <div
          className="gs-goalie"
          style={{
            left: "50%",
            top: "62%",
            width: "200px",
            height: "200px",
            background: goaliePose === "idle" ? "#4a90e2" : "#e74c3c",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          {goaliePose === "idle" ? "🥅" : "🏃"}
        </div>

        {/* Bola simples */}
        <div
          className={`gs-ball ${target ? "moving" : ""}`}
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
            width: "52px",
            height: "52px",
            background: "#f39c12",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px"
          }}
        >
          ⚽
        </div>

        {/* Overlay GOL */}
        {showGoool && (
          <div
            className="gs-goool"
            style={{
              position: "absolute",
              inset: 0,
              margin: "auto",
              width: "min(70%, 720px)",
              height: "200px",
              background: "linear-gradient(45deg, #f39c12, #e74c3c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
              fontWeight: "bold",
              color: "white",
              borderRadius: "20px",
              animation: "pop 0.6s ease-out forwards"
            }}
          >
            GOOOL! 🎉
          </div>
        )}
      </div>
    </div>
  );
}
