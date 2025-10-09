import React, { useRef, useEffect } from 'react';

const GameCanvas = ({ onShoot, gameState }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Configurar canvas
    canvas.width = 800;
    canvas.height = 600;

    // Desenhar campo de futebol
    const drawField = () => {
      // Fundo verde
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Linhas do campo
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      
      // Linha central
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();

      // Círculo central
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, 2 * Math.PI);
      ctx.stroke();

      // Área do gol
      ctx.strokeRect(50, canvas.height / 2 - 100, 100, 200);
      ctx.strokeRect(canvas.width - 150, canvas.height / 2 - 100, 100, 200);
    };

    // Desenhar goleiro
    const drawGoalie = () => {
      const goalieX = gameState.goalieX || canvas.width - 100;
      const goalieY = gameState.goalieY || canvas.height / 2;
      
      ctx.fillStyle = '#FF5722';
      ctx.fillRect(goalieX - 20, goalieY - 30, 40, 60);
      
      // Cabeça
      ctx.fillStyle = '#FFC107';
      ctx.beginPath();
      ctx.arc(goalieX, goalieY - 40, 15, 0, 2 * Math.PI);
      ctx.fill();
    };

    // Desenhar bola
    const drawBall = () => {
      const ballX = gameState.ballX || 100;
      const ballY = gameState.ballY || canvas.height / 2;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ballX, ballY, 10, 0, 2 * Math.PI);
      ctx.fill();
      
      // Padrão da bola
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    // Desenhar tudo
    drawField();
    drawGoalie();
    drawBall();

  }, [gameState]);

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (onShoot) {
      onShoot({ x, y });
    }
  };

  return (
    <div className="game-canvas-container">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="game-canvas"
        style={{
          border: '2px solid #333',
          borderRadius: '8px',
          cursor: 'crosshair',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
      <div className="game-instructions">
        <p>Clique na bola para chutar!</p>
        <p>Objetivo: Fazer gol no goleiro</p>
      </div>
    </div>
  );
};

export default GameCanvas;
