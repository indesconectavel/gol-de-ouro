import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'
import VersionBanner from '../components/VersionBanner'
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem!')
      return
    }
    if (!acceptTerms) {
      setError('Você deve aceitar os termos de uso!')
      return
    }
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres!')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const result = await register(formData.name, formData.email, formData.password)
      
      if (result.success) {
        // Registro bem-sucedido - fazer login automático
        navigate('/dashboard')
      } else {
        setError(result.error || 'Erro ao criar conta')
      }
    } catch (error) {
      setError('Erro interno. Tente novamente.')
      console.error('Erro no registro:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{
           backgroundImage: 'url(/images/Gol_de_Ouro_Bg01.jpg)',
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundRepeat: 'no-repeat'
         }}>
      {/* Banner de Versão */}
      <VersionBanner showTime={true} />
      
      {/* Overlay escuro para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black/60"></div>
      

      {/* Formulário de Registro */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <Logo size="xlarge" className="mx-auto mb-4" animated={true} />
            <p className="text-white/70 text-lg">Crie sua conta</p>
          </div>

          {/* Exibir erro se houver */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-white/50">👤</span>
                </div>
                <input
                  type="text"
                  name="username"
                  data-testid="username-input"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-white/50">📧</span>
                </div>
                <input
                  type="email"
                  name="email"
                  data-testid="email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="seu@e-mail.com"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-white/50">🔒</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  data-testid="password-input"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <span className="text-white/50">
                    {showPassword ? '🙈' : '👁️'}
                  </span>
                </button>
              </div>
              
              {/* Indicador de força da senha */}
              <PasswordStrengthIndicator password={formData.password} />
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-white/50">🔒</span>
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  data-testid="confirm-password-input"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Confirme sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <span className="text-white/50">
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </span>
                </button>
              </div>
            </div>

            {/* Termos */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 text-yellow-400 bg-white/10 border-white/20 rounded focus:ring-yellow-400 focus:ring-2"
                required
              />
              <label className="ml-2 text-white/70 text-sm">
                Aceito os{' '}
                <button
                  type="button"
                  onClick={() => navigate('/terms')}
                  className="text-yellow-400 hover:text-yellow-300 underline"
                >
                  Termos de Uso
                </button>{' '}
                e{' '}
                <button
                  type="button"
                  onClick={() => navigate('/privacy')}
                  className="text-yellow-400 hover:text-yellow-300 underline"
                >
                  Política de Privacidade
                </button>
              </label>
            </div>

            {/* Botão de Registro */}
            <button
              type="submit"
              data-testid="submit-button"
              disabled={isSubmitting}
              className={`w-full font-bold py-3 px-6 rounded-lg transition-all duration-200 transform ${
                isSubmitting 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 hover:scale-105'
              } text-white`}
            >
              {isSubmitting ? '⏳ Criando conta...' : '⚽ Criar Conta'}
            </button>
          </form>

          {/* Link para Login */}
          <div className="mt-6 text-center">
            <p className="text-white/70">
              Já tem uma conta?{' '}
              <button
                onClick={() => navigate('/')}
                className="text-green-400 hover:text-green-300 font-medium"
              >
                Faça login aqui
              </button>
            </p>
          </div>

          {/* Links Legais */}
          <div className="mt-4 text-center">
            <p className="text-white/50 text-xs">
              Ao criar uma conta, você concorda com nossos{' '}
              <button
                onClick={() => navigate('/terms')}
                className="text-green-400 hover:text-green-300 underline"
              >
                Termos de Uso
              </button>
              {' '}e{' '}
              <button
                onClick={() => navigate('/privacy')}
                className="text-green-400 hover:text-green-300 underline"
              >
                Política de Privacidade
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register