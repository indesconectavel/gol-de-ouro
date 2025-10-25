// components/NotificationCenter.jsx
import React, { useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'

const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationsByType,
    getUnreadNotifications
  } = useNotifications()

  const [activeTab, setActiveTab] = useState('all')
  const [showCenter, setShowCenter] = useState(false)

  // Filtrar notificações por aba
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return getUnreadNotifications()
      case 'achievements':
        return getNotificationsByType('achievement')
      case 'badges':
        return getNotificationsByType('badge')
      case 'level_up':
        return getNotificationsByType('level_up')
      case 'game_result':
        return getNotificationsByType('game_result')
      case 'payment':
        return getNotificationsByType('payment')
      case 'system':
        return getNotificationsByType('system')
      default:
        return notifications
    }
  }

  // Formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Agora mesmo'
    } else if (diffInHours < 24) {
      return `Há ${diffInHours}h`
    } else {
      return date.toLocaleDateString('pt-BR')
    }
  }

  // Obter ícone por tipo
  const getIconByType = (type) => {
    const icons = {
      achievement: '🏆',
      badge: '🎖️',
      level_up: '⬆️',
      game_result: '⚽',
      payment: '💰',
      withdrawal: '💸',
      system: '⚙️',
      promotional: '📢'
    }
    return icons[type] || '🔔'
  }

  // Obter cor por tipo
  const getColorByType = (type) => {
    const colors = {
      achievement: 'text-yellow-400',
      badge: 'text-purple-400',
      level_up: 'text-green-400',
      game_result: 'text-blue-400',
      payment: 'text-green-400',
      withdrawal: 'text-blue-400',
      system: 'text-gray-400',
      promotional: 'text-orange-400'
    }
    return colors[type] || 'text-white'
  }

  // Componente de notificação individual
  const NotificationItem = ({ notification }) => (
    <div 
      className={`p-4 border-b border-white/10 hover:bg-white/5 transition-colors ${
        !notification.read ? 'bg-blue-500/10 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className={`text-2xl ${getColorByType(notification.type)}`}>
          {getIconByType(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium ${notification.read ? 'text-white/80' : 'text-white'}`}>
              {notification.title}
            </h4>
            <span className="text-white/50 text-xs">
              {formatDate(notification.createdAt)}
            </span>
          </div>
          
          <p className={`text-sm mt-1 ${notification.read ? 'text-white/60' : 'text-white/70'}`}>
            {notification.message}
          </p>
          
          {notification.data && (
            <div className="mt-2 text-xs text-white/50">
              {notification.data.details && (
                <p>{notification.data.details}</p>
              )}
              {notification.data.value && (
                <p className="font-bold text-green-400">
                  +{notification.data.value} XP
                </p>
              )}
            </div>
          )}
          
          <div className="flex items-center space-x-2 mt-2">
            {!notification.read && (
              <button
                onClick={() => markAsRead(notification.id)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Marcar como lida
              </button>
            )}
            <button
              onClick={() => deleteNotification(notification.id)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-bold text-white">Central de Notificações</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Marcar todas como lidas
            </button>
          )}
          <button
            onClick={() => setShowCenter(!showCenter)}
            className="text-white/70 hover:text-white"
          >
            {showCenter ? 'Ocultar' : 'Ver todas'}
          </button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
        {[
          { id: 'all', name: 'Todas', count: notifications.length },
          { id: 'unread', name: 'Não lidas', count: unreadCount },
          { id: 'achievements', name: 'Conquistas', count: getNotificationsByType('achievement').length },
          { id: 'badges', name: 'Badges', count: getNotificationsByType('badge').length },
          { id: 'level_up', name: 'Níveis', count: getNotificationsByType('level_up').length },
          { id: 'game_result', name: 'Jogos', count: getNotificationsByType('game_result').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.name}
            {tab.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-slate-900/20' : 'bg-white/20'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista de notificações */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
        {getFilteredNotifications().length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🔔</div>
            <h4 className="text-white/80 font-medium mb-2">
              {activeTab === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação encontrada'}
            </h4>
            <p className="text-white/60 text-sm">
              {activeTab === 'unread' 
                ? 'Todas as suas notificações foram lidas!' 
                : 'Você não tem notificações deste tipo ainda.'
              }
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {getFilteredNotifications().map(notification => (
              <NotificationItem 
                key={notification.id} 
                notification={notification} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
          <div className="text-2xl font-bold text-blue-400">{notifications.length}</div>
          <div className="text-white/70 text-sm">Total</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
          <div className="text-2xl font-bold text-red-400">{unreadCount}</div>
          <div className="text-white/70 text-sm">Não lidas</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {getNotificationsByType('achievement').length}
          </div>
          <div className="text-white/70 text-sm">Conquistas</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {getNotificationsByType('badge').length}
          </div>
          <div className="text-white/70 text-sm">Badges</div>
        </div>
      </div>
    </div>
  )
}

export default NotificationCenter
