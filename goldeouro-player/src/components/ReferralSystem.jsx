import React, { useState, useEffect } from 'react'

const ReferralSystem = () => {
  const [referralCode, setReferralCode] = useState('')
  const [referrals, setReferrals] = useState([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0
  })

  // Carregar dados de referência
  useEffect(() => {
    const loadReferralData = async () => {
      try {
        const response = await fetch('/api/referrals/data')
        if (response.ok) {
          const data = await response.json()
          setReferralCode(data.referralCode)
          setReferrals(data.referrals)
          setReferralStats(data.stats)
        }
      } catch (error) {
        console.error('Erro ao carregar dados de referência:', error)
      }
    }

    loadReferralData()
  }, [])

  // Gerar novo código de referência
  const generateReferralCode = async () => {
    try {
      const response = await fetch('/api/referrals/generate', {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setReferralCode(data.code)
      }
    } catch (error) {
      console.error('Erro ao gerar código de referência:', error)
    }
  }

  // Copiar código de referência
  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode)
    alert('Código copiado para a área de transferência!')
  }

  // Compartilhar referência
  const shareReferral = (platform) => {
    const shareUrl = `${window.location.origin}/register?ref=${referralCode}`
    const shareText = `Junte-se ao Gol de Ouro e ganhe R$ 10,00 de bônus! Use o código: ${referralCode}`

    let shareLink = ''
    switch (platform) {
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
        break
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
        break
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        break
      default:
        shareLink = shareUrl
    }

    window.open(shareLink, '_blank')
  }

  // Formatar data
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            👥 Sistema de Referências
          </h1>
          <p className="text-xl text-white/70">
            Convide amigos e ganhe recompensas por cada indicação!
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {referralStats.totalReferrals}
            </div>
            <div className="text-white/70">Total de Indicações</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {referralStats.activeReferrals}
            </div>
            <div className="text-white/70">Indicações Ativas</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              R$ {referralStats.totalEarnings.toFixed(2)}
            </div>
            <div className="text-white/70">Total Ganho</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              R$ {referralStats.pendingEarnings.toFixed(2)}
            </div>
            <div className="text-white/70">Pendente</div>
          </div>
        </div>

        {/* Código de Referência */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            🎯 Seu Código de Referência
          </h2>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={referralCode}
                readOnly
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-xl font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyReferralCode}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
              >
                📋 Copiar
              </button>
              <button
                onClick={generateReferralCode}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
              >
                🔄 Gerar Novo
              </button>
            </div>
          </div>

          <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 mb-6">
            <h3 className="text-yellow-400 font-bold mb-2">💰 Como Funciona:</h3>
            <ul className="text-white/80 space-y-1">
              <li>• Você ganha <strong>R$ 10,00</strong> por cada amigo que se cadastrar</li>
              <li>• Seu amigo ganha <strong>R$ 10,00</strong> de bônus de boas-vindas</li>
              <li>• Você ganha <strong>5%</strong> de todas as apostas do seu amigo</li>
              <li>• Não há limite de indicações!</li>
            </ul>
          </div>
        </div>

        {/* Compartilhar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            📱 Compartilhar
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => shareReferral('whatsapp')}
              className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              <span>📱</span>
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => shareReferral('telegram')}
              className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              <span>✈️</span>
              <span>Telegram</span>
            </button>
            <button
              onClick={() => shareReferral('facebook')}
              className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              <span>📘</span>
              <span>Facebook</span>
            </button>
            <button
              onClick={() => shareReferral('twitter')}
              className="flex items-center justify-center space-x-2 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              <span>🐦</span>
              <span>Twitter</span>
            </button>
          </div>
        </div>

        {/* Lista de Indicações */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">
            📋 Suas Indicações
          </h2>
          
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-white/70 text-lg">
                Nenhuma indicação ainda. Compartilhe seu código e comece a ganhar!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">Data</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Apostas</th>
                    <th className="text-left py-3 px-4">Ganho</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="border-b border-white/10">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{referral.avatar}</span>
                          <span>{referral.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white/70">
                        {formatDate(referral.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          referral.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {referral.status === 'active' ? 'Ativo' : 'Pendente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white/70">
                        {referral.totalBets}
                      </td>
                      <td className="py-3 px-4 text-green-400 font-semibold">
                        R$ {referral.earnings.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReferralSystem
