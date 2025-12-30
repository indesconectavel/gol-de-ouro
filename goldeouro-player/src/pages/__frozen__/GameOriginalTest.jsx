import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './game-shoot.css'

// Importar imagens dos assets
import gooolImg from '../assets/goool.png'
import defendeuImg from '../assets/defendeu.png'
import bgGoalImg from '../assets/bg_goal.jpg'
import ballImg from '../assets/ball.png'

const GameOriginalTest = () => {
  const navigate = useNavigate()
  const [shooting, setShooting] = useState(false)
  const [ballPos, setBallPos] = useState({ x: 50, y: 90 })
  const [goaliePose, setGoaliePose] = useState("idle")
  const [goalieStagePos, setGoalieStagePos] = useState({ x: 50, y: 62, rot: 0 })
  const [showGoool, setShowGoool] = useState(false)
  const [showDefendeu, setShowDefendeu] = useState(false)
  const [balance, setBalance] = useState(100.00)

  const GOAL_ZONES = {
    "TL": { x: 20, y: 20 },
    "TR": { x: 80, y: 20 },
    "C": { x: 50, y: 15 },
    "BL": { x: 20, y: 40 },
    "BR": { x: 80, y: 40 }
  }

  function goalToStage({ x, y }) {
    return { x, y }
  }

  function goalieTargetFor(dir) {
    const base = goalToStage(GOAL_ZONES[dir])
    const centerX = 50
    const centerY = 62
    const isLateral = dir === "TL" || dir === "TR" || dir === "BL" || dir === "BR"
    const reductionFactor = isLateral ? 0.64 : 0.8
    const offsetX = (base.x - centerX) * reductionFactor
    const offsetY = (base.y - centerY) * reductionFactor
    return { 
      x: centerX + offsetX, 
      y: centerY + offsetY, 
      rot: dir==="TL"||dir==="BL" ? -10 : dir==="TR"||dir==="BR" ? 10 : 0 
    }
  }

  const handleShoot = async (dir) => {
    if (shooting) return
    setShooting(true)
    
    const t = goalToStage(GOAL_ZONES[dir])
    requestAnimationFrame(() => setBallPos({ x: t.x, y: t.y }))
    
    // Simulação
    const isGoal = Math.random() < 0.5
    const goalieDirection = isGoal ? "C" : dir
    const gTarget = goalieTargetFor(goalieDirection)
    
    setGoaliePose(goalieDirection)
    requestAnimationFrame(() => setGoalieStagePos(gTarget))
    
    setTimeout(() => {
      if (isGoal) {
        setShowGoool(true)
      } else {
        setShowDefendeu(true)
      }
      
      setTimeout(() => {
        resetAnimations()
      }, 3000)
    }, 950)
  }

  const resetAnimations = () => {
    setBallPos({ x: 50, y: 90 })
    setShowGoool(false)
    setShowDefendeu(false)
    setGoaliePose("idle")
    setGoalieStagePos({ x: 50, y: 62, rot: 0 })
    setShooting(false)
  }

  return (
    <div className="gs-wrapper">
      <div className="gs-stage" style={{ backgroundImage: `url(${bgGoalImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {/* HUD */}
        <div className="gs-hud">
          <div className="hud-left">
            <div className="brand">
              <div className="brand-logo">⚽</div>
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
                  <strong className="stat-value">R$ {balance.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="hud-right">
            <button className="hud-btn secondary" onClick={() => navigate('/dashboard')}>
              <span className="btn-icon">📊</span>
              <span className="btn-text">Dashboard</span>
            </button>
          </div>
        </div>

        {/* Zonas clicáveis */}
        {Object.entries(GOAL_ZONES).map(([zone, pos]) => (
          <button
            key={zone}
            className={`gs-zone ${shooting ? "disabled" : ""}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onClick={() => handleShoot(zone)}
            title={`Chutar ${zone}`}
          />
        ))}

        {/* Goleiro */}
        <div
          className="gs-goalie"
          style={{
            left: `${goalieStagePos.x}%`,
            top: `${goalieStagePos.y}%`,
            transform: `translate(-50%, -50%) rotate(${goalieStagePos.rot}deg)`,
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
          🥅
        </div>

        {/* Bola - USANDO IMAGEM */}
        <img
          src={ballImg}
          alt="Bola"
          className="gs-ball"
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
            transform: 'translate(-50%, -50%)',
            width: '52px',
            height: '52px',
            transition: 'left 0.9s cubic-bezier(.18,.76,.2,1), top 0.9s cubic-bezier(.18,.76,.2,1)',
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.5))',
            zIndex: 7
          }}
        />

        {/* GOL overlay - USANDO IMAGEM goool.png */}
        {showGoool && (
          <img
            src={gooolImg}
            alt="Gol!"
            className="gs-goool"
            style={{
              position: 'absolute',
              inset: 0,
              margin: 'auto',
              width: 'min(49%, 504px)',
              zIndex: 8,
              pointerEvents: 'none'
            }}
          />
        )}

        {/* DEFENDEU overlay - USANDO IMAGEM defendeu.png */}
        {showDefendeu && (
          <img
            src={defendeuImg}
            alt="Defendeu!"
            className="gs-defendeu"
            style={{
              position: 'absolute',
              inset: 0,
              margin: 'auto',
              width: '200px',
              height: '200px',
              zIndex: 8,
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
    </div>
  )
}

export default GameOriginalTest

