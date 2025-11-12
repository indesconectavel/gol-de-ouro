import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'
import VersionBanner from '../components/VersionBanner'
import musicManager from '../utils/musicManager'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()
  const { login, loading, error } = useAuth()

  // Iniciar música de fundo apenas na página de login
  useEffect(() => {
    // Verificar se já existe música tocando para evitar duplicação
    if (!musicManager.isPlaying) {
      musicManager.playPageMusic();
    }
    
    // Cleanup: parar música ao sair do componente
    return () => {
      musicManager.stopMusic();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const result = await login(formData.email, formData.password)
    if (result.success) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Banner de Versão */}
      <VersionBanner showTime={true} />
      {/* Background com fallback */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/Gol_de_Ouro_Bg01.jpg), linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>
      
      {/* Overlay escuro para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black/40"></div>
      

      {/* Formulário de Login */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 slide-in-up">
          {/* Logo */}
          <div className="text-center mb-8">
            <Logo size="xlarge" className="mx-auto mb-4" animated={true} />
            <p className="text-white/70">Faça login para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Exibir erro se houver */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}
            
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
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                                          className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        placeholder="Sua senha"
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
            </div>

            {/* Lembrar de mim */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-yellow-400 bg-white/10 border-white/20 rounded focus:ring-yellow-400 focus:ring-2"
                />
                <span className="ml-2 text-white/70 text-sm">Lembrar de mim</span>
              </label>
              <a href="/forgot-password" className="text-yellow-400 text-sm hover:text-yellow-300">
                Esqueceu a senha?
              </a>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="group-hover:animate-bounce inline-block mr-2">⚽</span>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Link para Registro */}
          <div className="mt-6 text-center">
            <p className="text-white/70">
              Não tem uma conta?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-yellow-400 hover:text-yellow-300 font-medium"
              >
                Cadastre-se aqui
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login