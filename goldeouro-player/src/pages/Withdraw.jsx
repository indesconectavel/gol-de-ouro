import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Navigation from '../components/Navigation'
import { useSidebar } from '../contexts/SidebarContext'
import paymentService from '../services/paymentService'
import withdrawService from '../services/withdrawService'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'

const Withdraw = () => {
  const { isCollapsed } = useSidebar()
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    amount: '',
    pixKey: '',
    pixType: 'cpf'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [withdrawalHistory, setWithdrawalHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState(null)
  const navigate = useNavigate()

  // Carregar dados iniciais
  useEffect(() => {
    loadUserData()
    loadWithdrawalHistory()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Buscar saldo real do usuário
      const response = await apiClient.get(API_ENDPOINTS.PROFILE)
      if (response.data.success) {
        setBalance(response.data.data.saldo || 0)
      } else {
             setBalance(0) // Fallback
      }
      
    } catch (err) {
      console.error('Erro ao carregar dados do usuário:', err)
      setError('Erro ao carregar dados do usuário')
             setBalance(0) // Fallback
    } finally {
      setLoading(false)
    }
  }

  const loadWithdrawalHistory = async () => {
    try {
      setHistoryLoading(true)
      setHistoryError(null)

      const saques = await withdrawService.getWithdrawHistory()
      setWithdrawalHistory(Array.isArray(saques) ? saques : [])
    } catch (err) {
      console.error('Erro ao carregar histórico de saques:', err)
      setHistoryError('Erro ao carregar histórico de saques')
      setWithdrawalHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const pixTypes = [
    { value: 'cpf', label: 'CPF', icon: '🆔', placeholder: '000.000.000-00' },
    { value: 'email', label: 'E-mail', icon: '📧', placeholder: 'seu@email.com' },
    { value: 'phone', label: 'Telefone', icon: '📱', placeholder: '(00) 00000-0000' },
    { value: 'random', label: 'Chave Aleatória', icon: '🔑', placeholder: 'Chave aleatória' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Validar formulário
      if (!formData.amount || !formData.pixKey) {
        throw new Error('Todos os campos são obrigatórios')
      }

      const amount = parseFloat(formData.amount)
      if (amount <= 0) {
        throw new Error('Valor deve ser maior que zero')
      }

      if (amount > balance) {
        throw new Error('Saldo insuficiente')
      }

      // Solicitar saque via endpoint real
      const result = await withdrawService.requestWithdraw({
        valor: amount,
        chave_pix: formData.pixKey,
        tipo_chave: formData.pixType
      })

      if (result.success) {
        setShowSuccess(true)
        await loadWithdrawalHistory()
        await loadUserData()
        setTimeout(() => {
          setFormData({ amount: '', pixKey: '', pixType: 'cpf' })
          setShowSuccess(false)
        }, 3000)
      } else {
        throw new Error(result.message || 'Erro ao processar saque')
      }
      
    } catch (err) {
      console.error('Erro ao processar saque:', err)
      setError(err.message || 'Erro ao processar saque')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAmountChange = (value) => {
    const numValue = parseFloat(value)
    if (numValue > balance) {
      setFormData({...formData, amount: balance.toString()})
    } else {
      setFormData({...formData, amount: value})
    }
  }

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'processado') return 'text-green-400 bg-green-400/20'
    if (s === 'pendente' || s === 'processando' || s === 'aguardando_confirmacao') return 'text-yellow-400 bg-yellow-400/20'
    if (s === 'cancelado' || s === 'falhou') return 'text-red-400 bg-red-400/20'
    return 'text-gray-400 bg-gray-400/20'
  }

  const getStatusIcon = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'processado') return '✅'
    if (s === 'pendente' || s === 'processando' || s === 'aguardando_confirmacao') return '⏳'
    if (s === 'cancelado' || s === 'falhou') return '❌'
    return '❓'
  }

  const formatWithdrawStatus = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'processado') return 'Processado'
    if (s === 'pendente' || s === 'processando' || s === 'aguardando_confirmacao') return 'Pendente'
    if (s === 'cancelado' || s === 'falhou') return 'Cancelado'
    return status || 'Pendente'
  }

  const formatWithdrawDate = (createdAt) => {
    if (!createdAt) return '—'
    try {
      const d = new Date(createdAt)
      return isNaN(d.getTime()) ? createdAt : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    } catch {
      return createdAt
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex">
        <Navigation />
        <div className={`flex-1 relative overflow-hidden p-4 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-72'}`}>
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex">
        <Navigation />
        <div className={`flex-1 relative overflow-hidden p-4 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-72'}`}>
          <div className="max-w-4xl mx-auto">
            <ErrorMessage message={error} onRetry={loadUserData} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Menu de Navegação */}
      <Navigation />
      
      {/* Conteúdo Principal */}
      <div 
        className={`flex-1 relative overflow-hidden p-4 transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-72'}`}
        style={{
          backgroundImage: 'url(/images/Gol_de_Ouro_Bg02.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Overlay escuro para melhorar legibilidade */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      {/* Conteúdo principal */}
      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white/70 hover:text-white text-2xl transition-colors bg-white/10 backdrop-blur-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-white/20"
          >
            ←
          </button>
          <div className="flex items-center space-x-3">
            <Logo size="medium" style={{ width: '150px', height: '150px' }} />
            <h1 className="text-2xl font-bold text-white">Solicitar Saque</h1>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Saldo Disponível - Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20 shadow-2xl">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-2xl">💰</span>
              <h2 className="text-white/80 text-lg font-medium">Saldo Disponível</h2>
            </div>
            <p className="text-4xl font-bold text-yellow-400 mb-2">R$ {balance.toFixed(2)}</p>
            <p className="text-white/70 text-sm">Valor mínimo para saque: R$ {paymentService.getConfig().minAmount.toFixed(2)}</p>
            {paymentService.isSandboxMode() && (
              <p className="text-yellow-400 text-sm mt-2">🔧 Modo Sandbox Ativo</p>
            )}
          </div>
        </div>

        {/* Formulário de Saque - Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20 shadow-2xl">
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-2xl">💸</span>
            <h3 className="text-xl font-bold text-white">Dados do Saque</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Exibir erro se houver */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-red-400">❌</span>
                  <p className="text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Valor */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Valor do Saque
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-white/50">R$</span>
                </div>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-lg"
                  placeholder="0,00"
                  min="10"
                  max={balance}
                  step="0.01"
                  required
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-white/70 text-sm">
                  Valor mínimo: R$ 10,00
                </p>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, amount: balance.toString()})}
                  className="text-yellow-400 text-sm hover:text-yellow-300 transition-colors"
                >
                  Usar saldo total
                </button>
              </div>
            </div>

            {/* Tipo de PIX */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Tipo de Chave PIX
              </label>
              <div className="grid grid-cols-2 gap-2">
                {pixTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({...formData, pixType: type.value, pixKey: ''})}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 backdrop-blur-lg ${
                      formData.pixType === type.value
                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                        : 'border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/20'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">{type.icon}</div>
                      <div className="text-sm font-medium">{type.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chave PIX */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Chave PIX
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-white/50">
                    {pixTypes.find(t => t.value === formData.pixType)?.icon}
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.pixKey}
                  onChange={(e) => setFormData({...formData, pixKey: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-lg"
                  placeholder={pixTypes.find(t => t.value === formData.pixType)?.placeholder}
                  required
                />
              </div>
            </div>

            {/* Resumo do Saque */}
            {formData.amount && (
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-4 backdrop-blur-lg">
                <h4 className="text-green-400 font-bold mb-2">📋 Resumo do Saque</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Valor solicitado:</span>
                    <span className="text-white font-medium">R$ {parseFloat(formData.amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Taxa de processamento:</span>
                    <span className="text-white font-medium">R$ 2,00</span>
                  </div>
                  <div className="flex justify-between border-t border-white/20 pt-2">
                    <span className="text-white font-bold">Valor a receber:</span>
                    <span className="text-green-400 font-bold">
                      R$ {(parseFloat(formData.amount || 0) - 2).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Informações */}
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 backdrop-blur-lg">
              <h4 className="text-blue-400 font-bold mb-2 flex items-center">
                <span className="mr-2">ℹ️</span>
                Informações Importantes
              </h4>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• O saque será processado em até 24 horas</li>
                <li>• Taxa de processamento: R$ 2,00</li>
                <li>• Valor mínimo para saque: R$ 10,00</li>
                <li>• Verifique se os dados estão corretos</li>
                <li>• O valor será creditado na conta PIX informada</li>
              </ul>
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.amount || !formData.pixKey}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed backdrop-blur-lg border border-green-400/50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processando...</span>
                </div>
              ) : (
                '💸 Solicitar Saque'
              )}
            </button>
          </form>

          {/* Modal de Sucesso - Glassmorphism */}
          {showSuccess && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md mx-4 text-center border border-white/20 shadow-2xl">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-white mb-2">Saque Solicitado!</h3>
                <p className="text-white/80 mb-4">
                  Sua solicitação foi enviada com sucesso. Você receberá o valor em até 24 horas.
                </p>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 backdrop-blur-lg border border-green-400/50"
                >
                  Entendi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Histórico de Saques - Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-2xl">📊</span>
            <h3 className="text-xl font-bold text-white">Histórico de Saques</h3>
          </div>
          
          <div className="space-y-3">
            {withdrawalHistory.map((withdrawal) => {
              const amount = withdrawal.valor ?? withdrawal.amount ?? 0
              const pixKey = withdrawal.pix_key ?? withdrawal.chave_pix ?? '—'
              const displayStatus = formatWithdrawStatus(withdrawal.status)
              const dateStr = formatWithdrawDate(withdrawal.created_at)
              return (
                <div key={withdrawal.id} className="flex items-center justify-between bg-white/10 backdrop-blur-lg rounded-lg p-4 hover:bg-white/20 transition-colors border border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      displayStatus === 'Processado' ? 'bg-green-400' :
                      displayStatus === 'Pendente' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                    <div>
                      <p className="text-white font-medium">R$ {Number(amount).toFixed(2)}</p>
                      <p className="text-white/70 text-sm">{withdrawal.pix_type || 'PIX'} • {pixKey}</p>
                      <p className="text-white/50 text-xs">{dateStr}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-lg ${getStatusColor(withdrawal.status)}`}>
                      <span>{getStatusIcon(withdrawal.status)}</span>
                      <span>{displayStatus}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default Withdraw