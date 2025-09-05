const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout'
    },
    GAME: {
      JOIN_QUEUE: '/api/games/fila/entrar',
      LEAVE_QUEUE: '/api/games/fila/sair',
      QUEUE_STATUS: '/api/games/fila/status',
      TAKE_SHOT: '/api/games/chutar',
      GAME_STATUS: '/api/games/status'
    },
    USER: {
      PROFILE: '/api/user/profile',
      BALANCE: '/api/user/balance',
      HISTORY: '/api/user/history'
    },
    PAYMENT: {
      WITHDRAW: '/api/payment/withdraw',
      DEPOSIT: '/api/payment/deposit',
      HISTORY: '/api/payment/history'
    }
  }
}

export default API_CONFIG
