// 🎆 SISTEMA DE PARTÍCULAS - GOL DE OURO
// Componente para efeitos visuais e feedback

import React, { useEffect, useRef, useState } from 'react';

const ParticleSystem = ({ 
  type = 'goal', 
  position = { x: 50, y: 50 }, 
  active = false, 
  onComplete = () => {} 
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const [isActive, setIsActive] = useState(active);

  useEffect(() => {
    if (active && !isActive) {
      setIsActive(true);
      createParticles();
    }
  }, [active]);

  useEffect(() => {
    if (isActive) {
      animateParticles();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  const createParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Configurações baseadas no tipo
    const config = getParticleConfig(type);
    
    particlesRef.current = [];
    
    for (let i = 0; i < config.count; i++) {
      const particle = {
        x: position.x * rect.width / 100,
        y: position.y * rect.height / 100,
        vx: (Math.random() - 0.5) * config.velocity,
        vy: (Math.random() - 0.5) * config.velocity - config.gravity,
        life: 1.0,
        decay: Math.random() * 0.02 + 0.01,
        size: Math.random() * config.size + config.minSize,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        type: config.particleType
      };
      particlesRef.current.push(particle);
    }
  };

  const getParticleConfig = (type) => {
    const configs = {
      goal: {
        count: 30,
        velocity: 8,
        gravity: 2,
        size: 4,
        minSize: 2,
        colors: ['#FFD700', '#FFA500', '#FF6B35', '#FFE135'],
        particleType: 'star'
      },
      save: {
        count: 20,
        velocity: 6,
        gravity: 1,
        size: 3,
        minSize: 1,
        colors: ['#00BFFF', '#1E90FF', '#87CEEB', '#B0E0E6'],
        particleType: 'circle'
      },
      miss: {
        count: 15,
        velocity: 4,
        gravity: 3,
        size: 2,
        minSize: 1,
        colors: ['#FF6B6B', '#FF8E8E', '#FFB3B3'],
        particleType: 'circle'
      },
      click: {
        count: 8,
        velocity: 3,
        gravity: 0.5,
        size: 2,
        minSize: 1,
        colors: ['#FFFFFF', '#F0F0F0', '#E0E0E0'],
        particleType: 'circle'
      }
    };
    
    return configs[type] || configs.goal;
  };

  const animateParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Redimensionar canvas se necessário
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeParticles = 0;

    particlesRef.current.forEach((particle, index) => {
      if (particle.life <= 0) return;

      // Atualizar posição
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += particle.decay; // Gravidade
      particle.life -= particle.decay;

      // Desenhar partícula
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;

      if (particle.type === 'star') {
        drawStar(ctx, particle.x, particle.y, particle.size);
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      activeParticles++;
    });

    // Remover partículas mortas
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    if (activeParticles > 0) {
      animationRef.current = requestAnimationFrame(animateParticles);
    } else {
      setIsActive(false);
      onComplete();
    }
  };

  const drawStar = (ctx, x, y, size) => {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
  };

  return (
    <canvas
      ref={canvasRef}
      className="particle-system"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    />
  );
};

export default ParticleSystem;
