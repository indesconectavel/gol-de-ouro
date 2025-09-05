import React, { useState, useEffect } from 'react'

const PremiumFeatures = () => {
  const [isPremium, setIsPremium] = useState(false)
  const [premiumTier, setPremiumTier] = useState('basic')
  const [features, setFeatures] = useState([])

  const premiumTiers = {
    basic: {
      name: 'Básico',
      price: 9.90,
      features: [
        'Apostas ilimitadas',
        'Estatísticas básicas',
        'Suporte por email',
        'Sem anúncios'
      ],
      color: 'blue'
    },
    pro: {
      name: 'Pro',
      price: 19.90,
      features: [
        'Tudo do Básico',
        'Relatórios avançados',
        'Notificações push',
        'Suporte prioritário',
        'Temas exclusivos',
        'Multiplicadores especiais'
      ],
      color: 'purple'
    },
    vip: {
      name: 'VIP',
      price: 39.90,
      features: [
        'Tudo do Pro',
        'Chat exclusivo',
        'Sistema de referências',
        'Cashback de 5%',
        'Acesso antecipado a novos jogos',
        'Gerente de conta dedicado'
      ],
      color: 'gold'
    }
  }

  // Verificar status premium
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const response = await fetch('/api/user/premium-status')
        if (response.ok) {
          const data = await response.json()
          setIsPremium(data.isPremium)
          setPremiumTier(data.tier)
        }
      } catch (error) {
        console.error('Erro ao verificar status premium:', error)
      }
    }

    checkPremiumStatus()
  }, [])

  // Ativar plano premium
  const activatePremium = async (tier) => {
    try {
      const response = await fetch('/api/premium/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tier })
      })

      if (response.ok) {
        const data = await response.json()
        setIsPremium(true)
        setPremiumTier(tier)
        alert(`Plano ${premiumTiers[tier].name} ativado com sucesso!`)
      }
    } catch (error) {
      console.error('Erro ao ativar plano premium:', error)
      alert('Erro ao ativar plano premium. Tente novamente.')
    }
  }

  // Cancelar plano premium
  const cancelPremium = async () => {
    try {
      const response = await fetch('/api/premium/cancel', {
        method: 'POST'
      })

      if (response.ok) {
        setIsPremium(false)
        setPremiumTier('basic')
        alert('Plano premium cancelado com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao cancelar plano premium:', error)
      alert('Erro ao cancelar plano premium. Tente novamente.')
    }
  }

  const getTierColor = (tier) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      gold: 'from-yellow-500 to-yellow-600'
    }
    return colors[tier] || colors.blue
  }

  const getTierBorderColor = (tier) => {
    const colors = {
      blue: 'border-blue-400',
      purple: 'border-purple-400',
      gold: 'border-yellow-400'
    }
    return colors[tier] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            ⭐ Funcionalidades Premium
          </h1>
          <p className="text-xl text-white/70 mb-6">
            Desbloqueie todo o potencial do Gol de Ouro
          </p>
          {isPremium && (
            <div className="inline-flex items-center px-6 py-3 bg-green-500/20 border border-green-400 rounded-full">
              <span className="text-green-400 font-semibold">
                ✅ Plano {premiumTiers[premiumTier].name} Ativo
              </span>
            </div>
          )}
        </div>

        {/* Planos Premium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {Object.entries(premiumTiers).map(([tierKey, tier]) => (
            <div
              key={tierKey}
              className={`relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 ${
                tierKey === premiumTier ? getTierBorderColor(tier.color) : 'border-white/20'
              } ${tierKey === 'pro' ? 'scale-105' : ''}`}
            >
              {tierKey === 'pro' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                    MAIS POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <div className="text-4xl font-bold text-white mb-2">
                  R$ {tier.price}
                  <span className="text-lg text-white/70">/mês</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-white/80">
                    <span className="text-green-400 mr-3">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => activatePremium(tierKey)}
                disabled={isPremium && tierKey === premiumTier}
                className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all ${
                  isPremium && tierKey === premiumTier
                    ? 'bg-gray-500 cursor-not-allowed'
                    : `bg-gradient-to-r ${getTierColor(tier.color)} hover:shadow-lg hover:scale-105`
                }`}
              >
                {isPremium && tierKey === premiumTier
                  ? 'Plano Ativo'
                  : `Assinar ${tier.name}`
                }
              </button>
            </div>
          ))}
        </div>

        {/* Funcionalidades Premium Ativas */}
        {isPremium && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              🎯 Suas Funcionalidades Premium
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-6">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-semibold text-white mb-2">Relatórios Avançados</h3>
                <p className="text-white/70 text-sm">
                  Acesse relatórios detalhados sobre seu desempenho e estatísticas
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <div className="text-3xl mb-3">🔔</div>
                <h3 className="text-lg font-semibold text-white mb-2">Notificações Push</h3>
                <p className="text-white/70 text-sm">
                  Receba notificações sobre novos jogos e promoções
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <div className="text-3xl mb-3">🎨</div>
                <h3 className="text-lg font-semibold text-white mb-2">Temas Exclusivos</h3>
                <p className="text-white/70 text-sm">
                  Personalize sua experiência com temas premium
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="text-lg font-semibold text-white mb-2">Chat Exclusivo</h3>
                <p className="text-white/70 text-sm">
                  Converse com outros jogadores premium em tempo real
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <div className="text-3xl mb-3">👥</div>
                <h3 className="text-lg font-semibold text-white mb-2">Sistema de Referências</h3>
                <p className="text-white/70 text-sm">
                  Convide amigos e ganhe recompensas por cada indicação
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="text-lg font-semibold text-white mb-2">Cashback</h3>
                <p className="text-white/70 text-sm">
                  Receba 5% de cashback em todas as suas apostas
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Gerenciar Assinatura */}
        {isPremium && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">
              ⚙️ Gerenciar Assinatura
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={cancelPremium}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Cancelar Assinatura
              </button>
              <button
                onClick={() => window.open('/api/premium/invoice', '_blank')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Baixar Fatura
              </button>
              <button
                onClick={() => window.open('/api/premium/support', '_blank')}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Suporte Premium
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PremiumFeatures
