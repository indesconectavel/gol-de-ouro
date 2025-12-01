import React, { useState, useEffect, useRef } from 'react'
import { connectChatWebSocket } from '../config/websocket'

const Chat = () => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [users, setUsers] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Conectar ao WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = connectChatWebSocket()
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Chat WebSocket conectado')
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'message':
            setMessages(prev => [...prev, data.message])
            break
          case 'user_joined':
            setUsers(prev => [...prev, data.user])
            break
          case 'user_left':
            setUsers(prev => prev.filter(user => user.id !== data.userId))
            break
          case 'typing':
            setTypingUsers(prev => {
              const filtered = prev.filter(user => user.id !== data.user.id)
              return [...filtered, data.user]
            })
            break
          case 'stop_typing':
            setTypingUsers(prev => prev.filter(user => user.id !== data.userId))
            break
          case 'users_list':
            setUsers(data.users)
            break
        }
      }

      ws.onclose = () => {
        console.log('Chat WebSocket desconectado')
        setIsConnected(false)
        // Tentar reconectar após 3 segundos
        setTimeout(connectWebSocket, 3000)
      }

      ws.onerror = (error) => {
        console.error('Erro no Chat WebSocket:', error)
      }
    }

    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Enviar mensagem
  const sendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !isConnected) return

    const message = {
      id: Date.now(),
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      user: {
        id: 'current-user',
        name: 'Você',
        avatar: '👤'
      }
    }

    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        message
      }))
    }

    setNewMessage('')
    stopTyping()
  }

  // Enviar indicador de digitação
  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'typing'
      }))

      // Parar indicador de digitação após 2 segundos
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping()
      }, 2000)
    }
  }

  // Parar indicador de digitação
  const stopTyping = () => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({
        type: 'stop_typing'
      }))
    }
  }

  // Formatar timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="h-full flex flex-col bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
      {/* Header do Chat */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">💬 Chat em Tempo Real</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm text-white/70">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          <div className="text-sm text-white/70">
            {users.length} usuário{users.length !== 1 ? 's' : ''} online
          </div>
        </div>
      </div>

      {/* Lista de Usuários Online */}
      <div className="p-4 border-b border-white/20">
        <div className="flex flex-wrap gap-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center space-x-2 bg-white/5 rounded-full px-3 py-1"
            >
              <span className="text-sm">{user.avatar}</span>
              <span className="text-sm text-white/80">{user.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.user.id === 'current-user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.user.id === 'current-user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm">{message.user.avatar}</span>
                <span className="text-sm font-medium">{message.user.name}</span>
                <span className="text-xs opacity-70">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}

        {/* Indicador de digitação */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-white/10 text-white px-4 py-2 rounded-2xl">
              <div className="flex items-center space-x-2">
                <span className="text-sm">
                  {typingUsers.map(user => user.name).join(', ')} está{typingUsers.length > 1 ? 'm' : ''} digitando...
                </span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-white/70 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <div className="p-4 border-t border-white/20">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!isConnected || !newMessage.trim()}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}

export default Chat
