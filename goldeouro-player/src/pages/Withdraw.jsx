import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import InternalPageLayout from '../components/InternalPageLayout'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'
import apiClient from '../services/apiClient'
import { API_ENDPOINTS } from '../config/api'

const Withdraw = () => {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    amount: '',
    pixKey: '',
    pixType: 'cpf',
    cpfCnpj: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [withdrawalHistory, setWithdrawalHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState(null)
  const navigate = useNavigate()
  const minWithdrawAmount = 10
  const withdrawFee = 2
  const [profileData, setProfileData] = useState({
    nome: '',
    email: '',
    cpf_cnpj: ''
  })

  const mapPixTypeToBackend = (pixType) => {
    switch (pixType) {
      case 'phone':
        return 'telefone'
      case 'random':
        return 'aleatoria'
      default:
        return pixType
    }
  }

  const mapStatusLabel = (status) => {
    switch (String(status || '').toLowerCase()) {
      case 'processado':
      case 'concluido':
      case 'completed':
        return 'Processado'
      case 'pendente':
      case 'pending':
      case 'processando':
      case 'aguardando_confirmacao':
        return 'Pendente'
      case 'cancelado':
      case 'cancelled':
      case 'rejeitado':
      case 'falhou':
        return 'Cancelado'
      default:
        return 'Pendente'
    }
  }

  const sanitizeDoc = (value) => String(value || '').replace(/\D/g, '')
  const docLooksValid = (value) => {
    const digits = sanitizeDoc(value)
    return digits.length === 11 || digits.length === 14
  }
  const requiresDocByPixType = (pixType) => ['email', 'phone', 'random'].includes(String(pixType || '').toLowerCase())

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
        const data = response.data.data || {}
        setBalance(data.saldo || 0)
        setProfileData({
          nome: data.nome || data.username || '',
          email: data.email || '',
          cpf_cnpj: sanitizeDoc(data.cpf_cnpj)
        })
        setFormData((prev) => ({
          ...prev,
          cpfCnpj: sanitizeDoc(data.cpf_cnpj)
        }))
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

      const response = await apiClient.get(`${API_ENDPOINTS.WITHDRAW}/history`)
      if (response.data?.success) {
        const rawHistory = response.data?.data?.saques || []
        const normalizedHistory = rawHistory.map((row) => ({
          id: row.id,
          amount: Number(row.amount ?? row.valor ?? 0),
          method: 'PIX',
          pixKey: row.pix_key || '-',
          status: mapStatusLabel(row.status),
          date: row.created_at
            ? new Date(row.created_at).toLocaleString('pt-BR')
            : '-'
        }))
        setWithdrawalHistory(normalizedHistory)
      } else {
        setHistoryError(response.data?.message || 'Erro ao carregar histórico de saques')
        setWithdrawalHistory([])
      }
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

      const needsDoc = requiresDocByPixType(formData.pixType)
      if (needsDoc) {
        if (!docLooksValid(formData.cpfCnpj)) {
          throw new Error('Para solicitar saque com essa chave Pix, cadastre seu CPF ou CNPJ.')
        }

        const nextDoc = sanitizeDoc(formData.cpfCnpj)
        const currentDoc = sanitizeDoc(profileData.cpf_cnpj)
        if (nextDoc !== currentDoc) {
          if (!profileData.nome || !profileData.email) {
            throw new Error('Não foi possível atualizar CPF/CNPJ no perfil. Atualize seu perfil e tente novamente.')
          }
          const profilePayload = {
            nome: profileData.nome,
            email: profileData.email,
            cpf_cnpj: nextDoc
          }
          const profileRes = await apiClient.put(API_ENDPOINTS.PROFILE, profilePayload)
          if (!profileRes.data?.success) {
            throw new Error(profileRes.data?.message || 'Falha ao atualizar CPF/CNPJ no perfil.')
          }
          setProfileData((prev) => ({ ...prev, cpf_cnpj: nextDoc }))
        }
      }

      const payload = {
        valor: amount,
        chave_pix: formData.pixKey,
        tipo_chave: mapPixTypeToBackend(formData.pixType)
      }
      const response = await apiClient.post(`${API_ENDPOINTS.WITHDRAW}/request`, payload)

      if (response.data?.success) {
        const serverAmount = Number(response.data?.data?.amount ?? amount)
        setShowSuccess(true)

        // Atualizar saldo local
        setBalance(prev => Math.max(0, prev - serverAmount))

        // Recarregar histórico
        await loadWithdrawalHistory()

        // Resetar formulário após sucesso
        setTimeout(() => {
          setFormData((prev) => ({ ...prev, amount: '', pixKey: '', pixType: 'cpf' }))
          setShowSuccess(false)
        }, 3000)
      } else {
        throw new Error(response.data?.message || 'Erro ao processar saque')
      }
    } catch (err) {
      console.error('Erro ao processar saque:', err)
      setError(err?.response?.data?.message || err.message || 'Erro ao processar saque')
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
    switch(status) {
      case 'Processado': return 'text-green-400 bg-green-400/20'
      case 'Pendente': return 'text-yellow-400 bg-yellow-400/20'
      case 'Cancelado': return 'text-red-400 bg-red-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Processado': return '✅'
      case 'Pendente': return '⏳'
      case 'Cancelado': return '❌'
      default: return '❓'
    }
  }

  // Loading state
  if (loading) {
    return (
      <InternalPageLayout title="Saque">
        <div className="flex-1 relative overflow-hidden p-4">
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner />
          </div>
        </div>
      </InternalPageLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <InternalPageLayout title="Saque">
        <div className="flex-1 relative overflow-hidden p-4">
          <div className="max-w-4xl mx-auto">
            <ErrorMessage message={error} onRetry={loadUserData} />
          </div>
        </div>
      </InternalPageLayout>
    )
  }

  return (
    <InternalPageLayout title="Saque">
    <div
        className="flex-1 relative overflow-hidden p-4"
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
            <p className="text-white/70 text-sm">Valor mínimo para saque: R$ {minWithdrawAmount.toFixed(2)}</p>
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
                  min={minWithdrawAmount}
                  max={balance}
                  step="0.01"
                  required
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-white/70 text-sm">
                  Valor mínimo: R$ {minWithdrawAmount.toFixed(2)}
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

            {requiresDocByPixType(formData.pixType) && (
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  CPF ou CNPJ do Titular
                </label>
                <input
                  type="text"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({ ...formData, cpfCnpj: sanitizeDoc(e.target.value) })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-lg"
                  placeholder="Somente números (11 ou 14 dígitos)"
                  required
                />
                <p className="text-white/60 text-xs mt-1">
                  Obrigatório para saque com chave Pix e-mail, telefone ou aleatória.
                </p>
              </div>
            )}

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
                    <span className="text-white font-medium">R$ {withdrawFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/20 pt-2">
                    <span className="text-white font-bold">Valor a receber:</span>
                    <span className="text-green-400 font-bold">
                      R$ {(parseFloat(formData.amount || 0) - withdrawFee).toFixed(2)}
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
                <li>• Taxa de processamento: R$ {withdrawFee.toFixed(2)}</li>
                <li>• Valor mínimo para saque: R$ {minWithdrawAmount.toFixed(2)}</li>
                <li>• Verifique se os dados estão corretos</li>
                <li>• O valor será creditado na conta PIX informada</li>
              </ul>
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.amount || !formData.pixKey || (requiresDocByPixType(formData.pixType) && !docLooksValid(formData.cpfCnpj))}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
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

          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : historyError ? (
            <ErrorMessage message={historyError} onRetry={loadWithdrawalHistory} />
          ) : withdrawalHistory.length === 0 ? (
            <EmptyState
              title="Nenhum saque encontrado"
              description="Seu histórico de saques aparecerá aqui."
            />
          ) : (
            <div className="space-y-3">
              {withdrawalHistory.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between bg-white/10 backdrop-blur-lg rounded-lg p-4 hover:bg-white/20 transition-colors border border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      withdrawal.status === 'Processado' ? 'bg-green-400' :
                        withdrawal.status === 'Pendente' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                    <div>
                      <p className="text-white font-medium">R$ {withdrawal.amount.toFixed(2)}</p>
                      <p className="text-white/70 text-sm">{withdrawal.method} • {withdrawal.pixKey}</p>
                      <p className="text-white/50 text-xs">{withdrawal.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-lg ${getStatusColor(withdrawal.status)}`}>
                      <span>{getStatusIcon(withdrawal.status)}</span>
                      <span>{withdrawal.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </InternalPageLayout>
  )
}

export default Withdraw