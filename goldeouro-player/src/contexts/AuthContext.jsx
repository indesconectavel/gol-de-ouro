import React, { createContext, useContext, useState, useEffect } from 'react'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
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
      apiClient.get(API_ENDPOINTS.PROFILE)
        .then(response => {
          setUser(response.data)
        })
        .catch(() => {
          localStorage.removeItem('authToken')
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
      setUser(userData)
      
      return { success: true, user: userData }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao fazer login'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const register = async (name, email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.post(API_ENDPOINTS.REGISTER, {
        name,
        email,
        password
      })
      
      return { success: true, data: response.data }
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

