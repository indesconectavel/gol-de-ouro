// Serviço de Autenticação - Gol de Ouro Player
import api from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.refreshToken = localStorage.getItem('refreshToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  // Login do usuário
  async login(email, password) {
    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, {
        email,
        password
      });

      const { token, refreshToken, user } = response.data;
      
      // Salvar tokens e dados do usuário
      this.setTokens(token, refreshToken);
      this.setUser(user);
      
      return { success: true, user, token };
    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao fazer login' 
      };
    }
  }

  // Registro do usuário
  async register(userData) {
    try {
      const response = await api.post(API_ENDPOINTS.REGISTER, userData);
      
      const { token, refreshToken, user } = response.data;
      
      // Salvar tokens e dados do usuário
      this.setTokens(token, refreshToken);
      this.setUser(user);
      
      return { success: true, user, token };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao criar conta' 
      };
    }
  }

  // Logout do usuário
  logout() {
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Verificar se o usuário está autenticado
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Obter token atual
  getToken() {
    return this.token;
  }

  // Obter dados do usuário
  getUser() {
    return this.user;
  }

  // Salvar tokens
  setTokens(token, refreshToken) {
    this.token = token;
    this.refreshToken = refreshToken;
    
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  }

  // Salvar dados do usuário
  setUser(user) {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Refresh do token
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post(`${API_ENDPOINTS.LOGIN}/refresh`, {
        refreshToken: this.refreshToken
      });

      const { token } = response.data;
      this.token = token;
      localStorage.setItem('token', token);
      
      return token;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      this.logout();
      throw error;
    }
  }

  // Verificar se o token está expirado
  isTokenExpired() {
    if (!this.token) return true;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Obter perfil do usuário
  async getProfile() {
    try {
      const response = await api.get(API_ENDPOINTS.PROFILE);
      
      const user = response.data;
      this.setUser(user);
      return { success: true, user };
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao obter perfil' 
      };
    }
  }

  // Atualizar perfil do usuário
  async updateProfile(userData) {
    try {
      const response = await api.put(API_ENDPOINTS.PROFILE, userData);
      
      const user = response.data;
      this.setUser(user);
      return { success: true, user };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao atualizar perfil' 
      };
    }
  }

  // Alterar senha
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.put(`${API_ENDPOINTS.PROFILE}/password`, {
        currentPassword,
        newPassword
      });
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao alterar senha' 
      };
    }
  }

  // Solicitar redefinição de senha
  async requestPasswordReset(email) {
    try {
      const response = await api.post(`${API_ENDPOINTS.LOGIN}/forgot-password`, {
        email
      });
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao solicitar redefinição:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao solicitar redefinição' 
      };
    }
  }

  // Redefinir senha
  async resetPassword(token, newPassword) {
    try {
      const response = await api.post(`${API_ENDPOINTS.LOGIN}/reset-password`, {
        token,
        newPassword
      });
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao redefinir senha' 
      };
    }
  }
}

// Instância única do serviço
const authService = new AuthService();

export default authService;
