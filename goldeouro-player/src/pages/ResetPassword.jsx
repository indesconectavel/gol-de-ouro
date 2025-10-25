import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import VersionBanner from '../components/VersionBanner';
import apiClient from '../services/apiClient';
import { API_ENDPOINTS } from '../config/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Token de recuperação não encontrado');
      return;
    }
    setToken(tokenParam);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validações
    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres!');
      return;
    }

    if (!token) {
      setError('Token de recuperação inválido!');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post(API_ENDPOINTS.RESET_PASSWORD, {
        token: token,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setIsSuccess(true);
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(response.data.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      setError(error.response?.data?.message || 'Erro interno. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-yellow-900 to-green-800 flex items-center justify-center p-4">
        {/* Banner de Versão */}
        <VersionBanner 
          version="v1.2.0" 
          deployDate="25/10/2025" 
          deployTime="08:50"
          showTime={true}
        />
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Senha Alterada!</h1>
          <p className="text-white/70 mb-6">
            Sua senha foi alterada com sucesso. Você será redirecionado para o login em alguns segundos.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-yellow-900 to-green-800 flex items-center justify-center p-4">
      {/* Banner de Versão */}
      <VersionBanner 
        version="v1.2.0" 
        deployDate="25/10/2025" 
        deployTime="08:50"
        showTime={true}
      />
      
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-green-900" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Nova Senha</h1>
          <p className="text-white/70">
            Digite sua nova senha para continuar
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nova Senha */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-white/50">🔒</span>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                required
                className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="Mínimo 6 caracteres"
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

          {/* Confirmar Nova Senha */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-white/50">🔒</span>
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
                className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="Confirme sua nova senha"
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

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full bg-yellow-400 text-green-900 font-semibold py-3 px-4 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-900 mr-2"></div>
                Alterando senha...
              </>
            ) : (
              '🔐 Alterar Senha'
            )}
          </button>

          {/* Back to Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
