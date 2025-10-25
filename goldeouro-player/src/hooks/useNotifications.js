// hooks/useNotifications.js
import { useState, useEffect } from 'react'
import apiClient from '../services/apiClient'

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [permission, setPermission] = useState('default')

  // Tipos de notificação
  const notificationTypes = {
    ACHIEVEMENT: 'achievement',
    BADGE: 'badge',
    LEVEL_UP: 'level_up',
    GAME_RESULT: 'game_result',
    PAYMENT: 'payment',
    WITHDRAWAL: 'withdrawal',
    SYSTEM: 'system',
    PROMOTIONAL: 'promotional'
  }

  // Carregar notificações
  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/user/notifications')
      
      if (response.data.success) {
        setNotifications(response.data.data.notifications || [])
        setUnreadCount(response.data.data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  // Marcar como lida
  const markAsRead = async (notificationId) => {
    try {
      const response = await apiClient.put(`/api/user/notifications/${notificationId}/read`)
      
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true, readAt: new Date().toISOString() }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      const response = await apiClient.put('/api/user/notifications/read-all')
      
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notif => ({ 
            ...notif, 
            read: true, 
            readAt: new Date().toISOString() 
          }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }

  // Deletar notificação
  const deleteNotification = async (notificationId) => {
    try {
      const response = await apiClient.delete(`/api/user/notifications/${notificationId}`)
      
      if (response.data.success) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    }
  }

  // Solicitar permissão para notificações push
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Este navegador não suporta notificações')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      
      if (permission === 'granted') {
        // Registrar service worker para notificações push
        await registerServiceWorker()
        return true
      }
      
      return false
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      return false
    }
  }

  // Registrar service worker
  const registerServiceWorker = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registrado:', registration)
        
        // Solicitar subscription para push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
        })
        
        // Enviar subscription para o servidor
        await apiClient.post('/api/user/notifications/subscribe', {
          subscription: subscription
        })
        
        return true
      }
    } catch (error) {
      console.error('Erro ao registrar service worker:', error)
    }
    return false
  }

  // Enviar notificação local
  const sendLocalNotification = (title, options = {}) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        ...options
      })
    }
  }

  // Filtrar notificações por tipo
  const getNotificationsByType = (type) => {
    return notifications.filter(notif => notif.type === type)
  }

  // Obter notificações não lidas
  const getUnreadNotifications = () => {
    return notifications.filter(notif => !notif.read)
  }

  // Obter notificações recentes (últimas 24h)
  const getRecentNotifications = () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return notifications.filter(notif => 
      new Date(notif.createdAt) > oneDayAgo
    )
  }

  useEffect(() => {
    loadNotifications()
    
    // Verificar permissão atual
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    permission,
    notificationTypes,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestPermission,
    sendLocalNotification,
    getNotificationsByType,
    getUnreadNotifications,
    getRecentNotifications
  }
}

export default useNotifications
