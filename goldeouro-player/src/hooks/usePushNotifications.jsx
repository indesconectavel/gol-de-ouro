import { useState, useEffect, useCallback } from 'react'

const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState('default')
  const [subscription, setSubscription] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Verificar suporte a notificações
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      return permission === 'granted'
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      return false
    }
  }, [isSupported])

  // Registrar service worker
  const registerServiceWorker = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register('/push-sw.js')
      console.log('Service Worker registrado:', registration)
      return registration
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error)
      return null
    }
  }, [])

  // Criar subscription para push
  const createSubscription = useCallback(async () => {
    if (!isSupported || permission !== 'granted') return null

    try {
      const registration = await registerServiceWorker()
      if (!registration) return null

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
      })

      setSubscription(subscription)
      return subscription
    } catch (error) {
      console.error('Erro ao criar subscription:', error)
      return null
    }
  }, [isSupported, permission, registerServiceWorker])

  // Enviar subscription para o servidor
  const sendSubscriptionToServer = useCallback(async (subscription) => {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      })

      if (response.ok) {
        console.log('Subscription enviada para o servidor')
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao enviar subscription:', error)
      return false
    }
  }, [])

  // Configurar notificações push
  const setupPushNotifications = useCallback(async () => {
    setIsLoading(true)

    try {
      // Solicitar permissão
      const hasPermission = await requestPermission()
      if (!hasPermission) {
        throw new Error('Permissão negada para notificações')
      }

      // Criar subscription
      const subscription = await createSubscription()
      if (!subscription) {
        throw new Error('Falha ao criar subscription')
      }

      // Enviar para o servidor
      const sent = await sendSubscriptionToServer(subscription)
      if (!sent) {
        throw new Error('Falha ao enviar subscription para o servidor')
      }

      return true
    } catch (error) {
      console.error('Erro ao configurar notificações:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [requestPermission, createSubscription, sendSubscriptionToServer])

  // Cancelar subscription
  const unsubscribe = useCallback(async () => {
    if (!subscription) return false

    try {
      await subscription.unsubscribe()
      setSubscription(null)
      
      // Notificar servidor
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      })

      return true
    } catch (error) {
      console.error('Erro ao cancelar subscription:', error)
      return false
    }
  }, [subscription])

  // Enviar notificação de teste
  const sendTestNotification = useCallback(async () => {
    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error)
      return false
    }
  }, [])

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    setupPushNotifications,
    unsubscribe,
    sendTestNotification
  }
}

export default usePushNotifications
