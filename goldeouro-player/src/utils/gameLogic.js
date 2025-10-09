// Lógica do jogo Gol de Ouro
export class GameLogic {
  constructor() {
    this.state = {
      ballX: 100,
      ballY: 300,
      goalieX: 700,
      goalieY: 300,
      score: 0,
      attempts: 0,
      gameStarted: false,
      gameEnded: false,
      power: 0,
      angle: 0,
      isShooting: false
    };
    
    this.goalWidth = 200;
    this.goalHeight = 100;
    this.canvasWidth = 800;
    this.canvasHeight = 600;
  }

  // Iniciar jogo
  startGame() {
    this.state.gameStarted = true;
    this.state.gameEnded = false;
    this.state.score = 0;
    this.state.attempts = 0;
    this.resetBall();
    this.resetGoalie();
  }

  // Resetar posição da bola
  resetBall() {
    this.state.ballX = 100;
    this.state.ballY = this.canvasHeight / 2;
    this.state.isShooting = false;
  }

  // Resetar posição do goleiro
  resetGoalie() {
    this.state.goalieX = 700;
    this.state.goalieY = this.canvasHeight / 2;
  }

  // Calcular potência do chute
  calculatePower(mouseX, mouseY) {
    const ballX = this.state.ballX;
    const ballY = this.state.ballY;
    
    const distance = Math.sqrt(
      Math.pow(mouseX - ballX, 2) + Math.pow(mouseY - ballY, 2)
    );
    
    // Potência máxima de 100
    const power = Math.min(distance / 2, 100);
    return Math.round(power);
  }

  // Calcular ângulo do chute
  calculateAngle(mouseX, mouseY) {
    const ballX = this.state.ballX;
    const ballY = this.state.ballY;
    
    const angle = Math.atan2(mouseY - ballY, mouseX - ballX);
    return angle;
  }

  // Executar chute
  shoot(mouseX, mouseY) {
    if (this.state.isShooting || this.state.gameEnded) return;

    this.state.isShooting = true;
    this.state.attempts++;
    
    const power = this.calculatePower(mouseX, mouseY);
    const angle = this.calculateAngle(mouseX, mouseY);
    
    this.state.power = power;
    this.state.angle = angle;

    // Animar movimento da bola
    this.animateBall(power, angle);
  }

  // Animar movimento da bola
  animateBall(power, angle) {
    const startX = this.state.ballX;
    const startY = this.state.ballY;
    
    const velocityX = Math.cos(angle) * (power / 10);
    const velocityY = Math.sin(angle) * (power / 10);
    
    const gravity = 0.2;
    let currentX = startX;
    let currentY = startY;
    let currentVelocityY = velocityY;
    
    const animate = () => {
      currentX += velocityX;
      currentY += currentVelocityY;
      currentVelocityY += gravity;
      
      this.state.ballX = currentX;
      this.state.ballY = currentY;
      
      // Verificar se a bola saiu da tela
      if (currentX > this.canvasWidth || currentY > this.canvasHeight) {
        this.state.isShooting = false;
        this.resetBall();
        return;
      }
      
      // Verificar se fez gol
      if (this.checkGoal(currentX, currentY)) {
        this.state.score++;
        this.state.isShooting = false;
        this.resetBall();
        this.resetGoalie();
        return;
      }
      
      // Verificar se o goleiro defendeu
      if (this.checkGoalieDefense(currentX, currentY)) {
        this.state.isShooting = false;
        this.resetBall();
        this.resetGoalie();
        return;
      }
      
      // Continuar animação
      if (this.state.isShooting) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  // Verificar se fez gol
  checkGoal(ballX, ballY) {
    const goalX = this.canvasWidth - 50;
    const goalY = this.canvasHeight / 2;
    
    // Verificar se a bola está na área do gol
    const inGoalX = ballX >= goalX - 25 && ballX <= goalX + 25;
    const inGoalY = ballY >= goalY - this.goalHeight / 2 && ballY <= goalY + this.goalHeight / 2;
    
    return inGoalX && inGoalY;
  }

  // Verificar se o goleiro defendeu
  checkGoalieDefense(ballX, ballY) {
    const goalieX = this.state.goalieX;
    const goalieY = this.state.goalieY;
    
    const distance = Math.sqrt(
      Math.pow(ballX - goalieX, 2) + Math.pow(ballY - goalieY, 2)
    );
    
    // Se a bola está próxima do goleiro
    return distance < 50;
  }

  // Mover goleiro
  moveGoalie(direction) {
    if (this.state.gameEnded) return;
    
    const moveSpeed = 5;
    if (direction === 'up') {
      this.state.goalieY = Math.max(50, this.state.goalieY - moveSpeed);
    } else if (direction === 'down') {
      this.state.goalieY = Math.min(this.canvasHeight - 50, this.state.goalieY + moveSpeed);
    }
  }

  // Obter estado do jogo
  getState() {
    return { ...this.state };
  }

  // Verificar se o jogo terminou
  isGameOver() {
    return this.state.attempts >= 10 || this.state.score >= 5;
  }

  // Finalizar jogo
  endGame() {
    this.state.gameEnded = true;
    this.state.gameStarted = false;
  }

  // Obter pontuação final
  getFinalScore() {
    return {
      score: this.state.score,
      attempts: this.state.attempts,
      accuracy: this.state.attempts > 0 ? (this.state.score / this.state.attempts) * 100 : 0
    };
  }
}

// Funções utilitárias
export const gameUtils = {
  // Gerar posição aleatória do goleiro
  randomGoaliePosition: (canvasHeight) => {
    return Math.random() * (canvasHeight - 100) + 50;
  },

  // Calcular dificuldade baseada na pontuação
  calculateDifficulty: (score) => {
    return Math.min(score * 0.1, 0.8);
  },

  // Gerar efeito de partículas
  createParticles: (x, y, color = '#FFD700') => {
    return Array.from({ length: 10 }, () => ({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1,
      color: color
    }));
  },

  // Verificar colisão entre dois objetos
  checkCollision: (obj1, obj2) => {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.radius + obj2.radius);
  }
};

export default GameLogic;
