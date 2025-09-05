import React, { useState, useEffect } from 'react'
import { useCachedAPI } from '../hooks/useCachedAPI'

const AdvancedReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [selectedReport, setSelectedReport] = useState('performance')
  const [reportData, setReportData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const { data: reportsData, loading } = useCachedAPI(`/api/reports/${selectedPeriod}`, {
    cacheTTL: 300000, // 5 minutos
    enabled: true
  })

  const reportTypes = [
    { id: 'performance', name: 'Performance', icon: '📊' },
    { id: 'financial', name: 'Financeiro', icon: '💰' },
    { id: 'user', name: 'Usuários', icon: '👥' },
    { id: 'game', name: 'Jogos', icon: '⚽' },
    { id: 'technical', name: 'Técnico', icon: '🔧' }
  ]

  const periodOptions = [
    { id: '1d', name: 'Últimas 24h' },
    { id: '7d', name: 'Últimos 7 dias' },
    { id: '30d', name: 'Últimos 30 dias' },
    { id: '90d', name: 'Últimos 90 dias' },
    { id: 'custom', name: 'Personalizado' }
  ]

  // Gerar relatório
  const generateReport = async (type, period) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          period,
          format: 'json'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Exportar relatório
  const exportReport = (format) => {
    if (!reportData) return

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-${selectedReport}-${selectedPeriod}.${format}`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Renderizar gráfico de performance
  const renderPerformanceChart = () => {
    if (!reportData?.performance) return null

    const { performance } = reportData
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-4">📊 Performance do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{performance.uptime}%</div>
            <div className="text-white/70">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">{performance.avgResponseTime}ms</div>
            <div className="text-white/70">Tempo de Resposta</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">{performance.throughput}</div>
            <div className="text-white/70">Requisições/min</div>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar relatório financeiro
  const renderFinancialReport = () => {
    if (!reportData?.financial) return null

    const { financial } = reportData
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-4">💰 Relatório Financeiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Receitas</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/70">Apostas</span>
                <span className="text-green-400">R$ {financial.revenue.bets.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Depósitos</span>
                <span className="text-green-400">R$ {financial.revenue.deposits.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-2">
                <span className="text-white font-semibold">Total</span>
                <span className="text-green-400 font-bold">R$ {financial.revenue.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Despesas</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/70">Prêmios</span>
                <span className="text-red-400">R$ {financial.expenses.prizes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Saques</span>
                <span className="text-red-400">R$ {financial.expenses.withdrawals.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-2">
                <span className="text-white font-semibold">Total</span>
                <span className="text-red-400 font-bold">R$ {financial.expenses.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-yellow-500/20 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-white font-semibold">Lucro Líquido</span>
            <span className={`text-2xl font-bold ${financial.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              R$ {financial.profit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-2">📊 Relatórios Avançados</h1>
          <p className="text-white/70">Análise detalhada do sistema Gol de Ouro</p>
        </div>

        {/* Controles */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Tipo de Relatório
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {reportTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Período
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {periodOptions.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={() => generateReport(selectedReport, selectedPeriod)}
                disabled={isLoading}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                {isLoading ? 'Gerando...' : 'Gerar Relatório'}
              </button>
            </div>
          </div>
        </div>

        {/* Relatórios */}
        {reportData && (
          <div className="space-y-6">
            {selectedReport === 'performance' && renderPerformanceChart()}
            {selectedReport === 'financial' && renderFinancialReport()}
            
            {/* Ações de exportação */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">📤 Exportar Relatório</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => exportReport('json')}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Exportar JSON
                </button>
                <button
                  onClick={() => exportReport('csv')}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Exportar CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedReports
