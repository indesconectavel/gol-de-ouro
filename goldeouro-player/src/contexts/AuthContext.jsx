import React, { createContext, useContext, useState, useEffect } from 'react'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'

const AuthContext = createContext()

const normalizeAuthUser = (userData) => {
  if (!userData || typeof userData !== 'object') return null

  return {
    ...userData,
    username: userData.username || userData.nome || null,
    nome: userData.nome || userData.username || null,
    saldo: typeof userData.saldo === 'number' ? userData.saldo : 0,
    tipo: userData.tipo || 'jogador',
    total_apostas: userData.total_apostas ?? 0,
    total_ganhos: userData.total_ganhos ?? 0,
    total_gols_de_ouro: userData.total_gols_de_ouro ?? 0
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    console.warn('useAuth chamado fora do AuthProvider - retornando contexto padrão')
    return {
      user: null,
      loading: false,
      error: null,
      login: () => Promise.resolve({ success: false, error: 'AuthProvider não inicializado' }),
      register: () => Promise.resolve({ success: false, error: 'AuthProvider não inicializado' }),
      logout: () => {},
      isAuthenticated: false
    }
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Verificar se usuário está logado ao carregar
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      // Verificar se token é válido
      apiClient.get(API_ENDPOINTS.PROFILE, { skipCache: true })
        .then(response => {
          // Backend retorna { success, data: { id, email, username, ... } }; manter user no mesmo shape de login/cadastro
          const userData = response.data?.data ? response.data.data : response.data
          setUser(normalizeAuthUser(userData))
        })
        .catch((error) => {
          console.log('🔒 Token inválido ou expirado:', error.response?.status)
          localStorage.removeItem('authToken')
          localStorage.removeItem('userData')
          setUser(null)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
        email,
        password
      })
      
      const { token, user: userData } = response.data
      localStorage.setItem('authToken', token)
      setUser(normalizeAuthUser(userData))
      
      return { success: true, user: userData }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao fazer login'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password, acceptedTerms, isAdultConfirmed) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.post(API_ENDPOINTS.REGISTER, {
        username: name,
        email,
        password,
        acceptedTerms,
        isAdultConfirmed
      })
      
      const { token, user: userData } = response.data
      
      // Fazer login automático após registro
      localStorage.setItem('authToken', token)
      setUser(normalizeAuthUser(userData))
      
      return { success: true, data: response.data, user: userData }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao registrar'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    setUser(null)
    setError(null)
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

