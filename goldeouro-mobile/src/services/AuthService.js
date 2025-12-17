// ✅ HARDENING FINAL: Migrado para SecureStore e Refresh Token
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // ✅ HARDENING FINAL: Carregar tokens do SecureStore
  const loadStoredAuth = async () => {
    try {
      // Migrar tokens antigos do AsyncStorage para SecureStore (se existirem)
      const oldToken = await AsyncStorage.getItem('authToken');
      if (oldToken) {
        await SecureStore.setItemAsync('accessToken', oldToken);
        await AsyncStorage.removeItem('authToken');
      }

      // Carregar do SecureStore
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const storedUser = await AsyncStorage.getItem('userData');
      
      if (accessToken && storedUser) {
        setToken(accessToken);
        setUser(JSON.parse(storedUser));
        
        // Tentar renovar token se refresh token existir
        if (refreshToken) {
          try {
            await refreshAccessToken(refreshToken);
          } catch (error) {
            console.log('Token expirado, usuário precisa fazer login novamente');
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar autenticação:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ HARDENING FINAL: Renovar access token usando refresh token
  const refreshAccessToken = async (refreshTokenToUse = null) => {
    try {
      const refreshTokenValue = refreshTokenToUse || await SecureStore.getItemAsync('refreshToken');
      if (!refreshTokenValue) {
        throw new Error('Refresh token não encontrado');
      }

      const response = await axios.post('https://goldeouro-backend-v2.fly.dev/api/auth/refresh', {
        refreshToken: refreshTokenValue
      });

      const { token: newAccessToken, accessToken } = response.data;
      const finalToken = accessToken || newAccessToken;

      await SecureStore.setItemAsync('accessToken', finalToken);
      setToken(finalToken);

      return { success: true, token: finalToken };
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      // Se refresh falhar, limpar tudo
      await logout();
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Chamada para API de produção
      const response = await axios.post('https://goldeouro-backend-v2.fly.dev/api/auth/login', {
        email,
        password,
      });

      // ✅ HARDENING FINAL: Armazenar tokens no SecureStore
      const { token: authToken, accessToken, refreshToken, user: userData } = response.data;
      const finalAccessToken = accessToken || authToken;

      // Armazenar tokens seguros no SecureStore
      await SecureStore.setItemAsync('accessToken', finalAccessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      }
      
      // Armazenar dados do usuário no AsyncStorage (não sensível)
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      setToken(finalAccessToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao fazer login' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      
      // Chamada para API de produção
      const response = await axios.post('https://goldeouro-backend-v2.fly.dev/api/auth/register', {
        name,
        email,
        password,
      });

      // ✅ HARDENING FINAL: Armazenar tokens no SecureStore
      const { token: authToken, accessToken, refreshToken, user: userData } = response.data;
      const finalAccessToken = accessToken || authToken;

      // Armazenar tokens seguros no SecureStore
      await SecureStore.setItemAsync('accessToken', finalAccessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      }
      
      // Armazenar dados do usuário no AsyncStorage (não sensível)
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      setToken(finalAccessToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao criar conta' 
      };
    } finally {
      setLoading(false);
    }
  };

  // ✅ HARDENING FINAL: Limpar tokens do SecureStore
  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await AsyncStorage.removeItem('userData');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      
      // Chamada para API de produção
      const response = await axios.put(
        'https://goldeouro-backend-v2.fly.dev/api/auth/profile',
        profileData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedUser = response.data.user;
      
      // Atualizar dados locais
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erro ao atualizar perfil' 
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshAccessToken, // ✅ HARDENING FINAL: Expor método de refresh
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
