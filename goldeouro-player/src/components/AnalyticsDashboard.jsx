import React, { useState, useEffect, useRef } from 'react'
import { useCachedAPI } from '../hooks/useCachedAPI'

const AnalyticsDashboard = () => {
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 0,
    gamesPlayed: 0,
    totalBets: 0,
    revenue: 0
  })
  const [timeRange, setTimeRange] = useState('1h')
  const [isRealTime, setIsRealTime] = useState(true)
  const wsRef = useRef(null)

  const { data: analyticsData, loading } = useCachedAPI(`/api/analytics/${timeRange}`, {
    cacheTTL: 30000, // 30 segundos
    enabled: true
  })

  // WebSocket para dados em tempo real
  useEffect(() => {
    if (isRealTime) {
      const ws = new WebSocket('ws://localhost:3000/analytics')
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket conectado para analytics')
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setRealTimeData(prev => ({
          ...prev,
          ...data
        }))
      }

      ws.onclose = () => {
        console.log('WebSocket desconectado')
      }

      return () => {
        ws.close()
      }
    }
  }, [isRealTime])

  // Métricas em tempo real
  const realTimeMetrics = [
    {
      title: 'Usuários Ativos',
      value: realTimeData.activeUsers,
      icon: '👥',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Jogos Jogados',
      value: realTimeData.gamesPlayed,
      icon: '⚽',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      title: 'Total de Apostas',
      value: realTimeData.totalBets,
      icon: '💰',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    },
    {
      title: 'Receita',
      value: `R$ ${realTimeData.revenue.toFixed(2)}`,
      icon: '📈',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    }
  ]

  // Gráfico de linha simples
  const LineChart = ({ data, title, color = 'blue' }) => {
    const canvasRef = useRef(null)

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas || !data) return

      const ctx = canvas.getContext('2d')
      const width = canvas.width
      const height = canvas.height

      // Limpar canvas
      ctx.clearRect(0, 0, width, height)

      // Configurar gráfico
      const padding = 40
      const chartWidth = width - 2 * padding
      const chartHeight = height - 2 * padding

      // Encontrar valores min/max
      const values = data.map(d => d.value)
      const minValue = Math.min(...values)
      const maxValue = Math.max(...values)
      const range = maxValue - minValue || 1

      // Desenhar eixos
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padding, padding)
      ctx.lineTo(padding, height - padding)
      ctx.lineTo(width - padding, height - padding)
      ctx.stroke()

      // Desenhar linha
      ctx.strokeStyle = color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : '#f59e0b'
      ctx.lineWidth = 2
      ctx.beginPath()

      data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth
        const y = height - padding - ((point.value - minValue) / range) * chartHeight

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Desenhar pontos
      ctx.fillStyle = color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : '#f59e0b'
      data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth
        const y = height - padding - ((point.value - minValue) / range) * chartHeight

        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
      })
    }, [data, color])

    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="w-full h-48"
        />
      </div>
    )
  }

  // Dados de exemplo para gráficos
  const chartData = {
    users: [
      { time: '00:00', value: 45 },
      { time: '04:00', value: 32 },
      { time: '08:00', value: 78 },
      { time: '12:00', value: 156 },
      { time: '16:00', value: 189 },
      { time: '20:00', value: 234 },
      { time: '24:00', value: 198 }
    ],
    revenue: [
      { time: '00:00', value: 1200 },
      { time: '04:00', value: 800 },
      { time: '08:00', value: 2100 },
      { time: '12:00', value: 4500 },
      { time: '16:00', value: 5200 },
      { time: '20:00', value: 6800 },
      { time: '24:00', value: 5900 }
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">📊 Analytics Dashboard</h1>
              <p className="text-white/70">Monitoramento em tempo real do sistema</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isRealTime ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span className="text-white/70">
                  {isRealTime ? 'Tempo Real' : 'Pausado'}
                </span>
              </div>
              <button
                onClick={() => setIsRealTime(!isRealTime)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isRealTime 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isRealTime ? 'Pausar' : 'Ativar'} Tempo Real
              </button>
            </div>
          </div>
        </div>

        {/* Métricas em tempo real */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {realTimeMetrics.map((metric, index) => (
            <div
              key={index}
              className={`${metric.bgColor} backdrop-blur-lg rounded-2xl p-6 border border-white/20`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">{metric.title}</p>
                  <p className={`text-3xl font-bold ${metric.color}`}>
                    {metric.value}
                  </p>
                </div>
                <div className="text-4xl opacity-50">
                  {metric.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <LineChart
            data={chartData.users}
            title="Usuários Ativos"
            color="blue"
          />
          <LineChart
            data={chartData.revenue}
            title="Receita por Hora"
            color="green"
          />
        </div>

        {/* Tabela de eventos recentes */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">📋 Eventos Recentes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4">Tempo</th>
                  <th className="text-left py-3 px-4">Evento</th>
                  <th className="text-left py-3 px-4">Usuário</th>
                  <th className="text-left py-3 px-4">Valor</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { time: '14:32:15', event: 'Nova Aposta', user: 'João Silva', value: 'R$ 10,00', status: 'Sucesso' },
                  { time: '14:31:42', event: 'Gol Marcado', user: 'Maria Santos', value: 'R$ 25,00', status: 'Ganhou' },
                  { time: '14:30:18', event: 'Saque Solicitado', user: 'Pedro Costa', value: 'R$ 50,00', status: 'Pendente' },
                  { time: '14:29:55', event: 'Depósito', user: 'Ana Oliveira', value: 'R$ 100,00', status: 'Processado' },
                  { time: '14:28:33', event: 'Nova Aposta', user: 'Carlos Lima', value: 'R$ 5,00', status: 'Sucesso' }
                ].map((event, index) => (
                  <tr key={index} className="border-b border-white/10">
                    <td className="py-3 px-4 text-white/70">{event.time}</td>
                    <td className="py-3 px-4">{event.event}</td>
                    <td className="py-3 px-4">{event.user}</td>
                    <td className="py-3 px-4">{event.value}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        event.status === 'Sucesso' || event.status === 'Ganhou' || event.status === 'Processado'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
