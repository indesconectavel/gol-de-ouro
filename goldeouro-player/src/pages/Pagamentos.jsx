import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSidebar } from '../contexts/SidebarContext';
import Logo from '../components/Logo';
import Navigation from '../components/Navigation';
import VersionBanner from '../components/VersionBanner';
import apiClient from '../services/apiClient';
import { API_ENDPOINTS } from '../config/api';

const Pagamentos = () => {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [loading, setLoading] = useState(false);
  const [loadingDados, setLoadingDados] = useState(true);
  const [valorRecarga, setValorRecarga] = useState(200);
  const [pagamentos, setPagamentos] = useState([]);
  const [pagamentoAtual, setPagamentoAtual] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [erroDados, setErroDados] = useState(null);
  const pixCopiaColaRef = useRef(null);

  // Valores pré-definidos para recarga (presets)
  const valoresRecarga = [1, 5, 10, 25, 50, 100];

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoadingDados(true);
      setErroDados(null);
      const pagamentosResponse = await apiClient.get(API_ENDPOINTS.PIX_USER);
      const data = pagamentosResponse.data?.data;
      setPagamentos(data?.payments || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErroDados('Erro ao carregar histórico. Tente novamente.');
      setPagamentos([]);
    } finally {
      setLoadingDados(false);
    }
  };

  const criarPagamentoPix = async () => {
    if (valorRecarga < 1) {
      toast.error('Valor mínimo de recarga é R$ 1,00');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');

      const response = await apiClient.post('/api/payments/pix/criar', {
        amount: valorRecarga,
        description: `Recarga de saldo - R$ ${valorRecarga.toFixed(2)}`
      });

      if (response.data.success) {
        // O backend retorna os dados em .data
        setPagamentoAtual(response.data.data);
        toast.success('Pagamento PIX criado com sucesso!');
        carregarDados(); // Recarregar dados
        // Scroll suave até o bloco PIX Copia e Cola após o próximo paint
        setTimeout(() => {
          pixCopiaColaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else {
        toast.error(response.data.message || 'Erro ao criar pagamento PIX');
      }
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      toast.error('Erro ao criar pagamento PIX');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Rejeitado';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner de Versão */}
      <VersionBanner showTime={true} />
      
      <Navigation />
      
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="p-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pagamentos PIX</h1>
                <p className="text-gray-600 mt-1">Recarregue seu saldo para apostar no jogo</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  ← Voltar
                </button>
              </div>
            </div>
          </div>

          {/* PIX Copia e Cola - no topo quando existir pagamento ativo */}
          {pagamentoAtual && (
            <div ref={pixCopiaColaRef} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Pagamento PIX Criado</h2>
                <span className="px-3 py-1 rounded-full text-xs font-medium text-yellow-700 bg-yellow-100">
                  Pendente
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-center mb-6">
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    R$ {valorRecarga.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    ID: {pagamentoAtual.id}
                  </p>
                </div>

                {(pagamentoAtual?.pix_code || pagamentoAtual?.qr_code || pagamentoAtual?.pix_copy_paste) && (
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-green-600 mb-4">
                      ✅ Código PIX Gerado com Sucesso!
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 font-medium">
                      Copie o código abaixo e cole no seu app bancário:
                    </p>
                    <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                      <code className="text-sm font-mono break-all text-gray-800 block mb-4 bg-gray-50 p-3 rounded">
                        {pagamentoAtual.pix_code || pagamentoAtual.qr_code || pagamentoAtual.pix_copy_paste}
                      </code>
                      <button
                        onClick={() => {
                          const pixCode = pagamentoAtual.pix_code || pagamentoAtual.qr_code || pagamentoAtual.pix_copy_paste;
                          navigator.clipboard.writeText(pixCode);
                          setCopiado(true);
                          setTimeout(() => setCopiado(false), 3000);
                        }}
                        className={`px-6 py-3 rounded-lg transition-colors font-semibold shadow-sm ${
                          copiado
                            ? 'bg-green-700 text-white'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {copiado ? '✅ Código Copiado!' : '📋 Copiar Código PIX'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Cole este código no seu app bancário para completar o pagamento
                    </p>
                  </div>
                )}

                {!pagamentoAtual.pix_code && !pagamentoAtual.qr_code && !pagamentoAtual.pix_copy_paste && (
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-blue-600 mb-4">
                      📧 PIX Enviado por Email!
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 font-medium">
                      O código PIX foi enviado para seu email. Verifique sua caixa de entrada.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                      <p className="text-sm text-blue-800">
                        💡 Se não recebeu o email, verifique a pasta de spam ou lixeira.
                      </p>
                    </div>
                  </div>
                )}

                {!pagamentoAtual.pix_code && !pagamentoAtual.qr_code_base64 && pagamentoAtual.init_point && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Clique no botão abaixo para realizar o pagamento PIX:
                    </p>
                    <a
                      href={pagamentoAtual.init_point}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      🏦 Pagar com PIX - Mercado Pago
                    </a>
                    <p className="text-xs text-gray-500 mt-2">
                      Você será redirecionado para o Mercado Pago
                    </p>
                  </div>
                )}

              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recarga PIX */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recarregar Saldo</h2>
              
              {/* Valores pré-definidos */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {valoresRecarga.map((valor) => (
                  <button
                    key={valor}
                    onClick={() => setValorRecarga(valor)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 font-medium ${
                      valorRecarga === valor
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    R$ {valor}
                  </button>
                ))}
              </div>

              {/* Valor customizado */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor personalizado
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={valorRecarga}
                  onChange={(e) => setValorRecarga(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Digite o valor"
                />
              </div>

              <button
                onClick={criarPagamentoPix}
                disabled={loading || valorRecarga < 1}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Criando Pagamento...' : `💳 Recarregar R$ ${valorRecarga.toFixed(2)}`}
              </button>
            </div>

            {/* Instruções PIX */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Como funciona o PIX</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Escolha o valor desejado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Copie o código PIX ou escaneie o QR Code</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Pague no seu app bancário</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>Seu saldo será creditado automaticamente</span>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico de Pagamentos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Pagamentos</h2>
            {erroDados && (
              <div className="mb-4 p-3 bg-amber-100 border border-amber-300 rounded-lg text-amber-800 text-sm">
                {erroDados}
                <button type="button" onClick={() => carregarDados()} className="ml-2 font-medium underline">Tentar novamente</button>
              </div>
            )}
            {loadingDados ? (
              <div className="text-center py-12 text-gray-500">Carregando...</div>
            ) : pagamentos.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💳</span>
                </div>
                <p className="text-gray-500 text-lg">Nenhum pagamento encontrado</p>
                <p className="text-gray-400 text-sm mt-1">Seus pagamentos aparecerão aqui</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Valor</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos.map((pagamento) => (
                      <tr key={pagamento.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {pagamento.created_at ? formatarData(pagamento.created_at) : '—'}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-800">
                          R$ {(Number(pagamento.amount) || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pagamento.status)}`}>
                            {getStatusText(pagamento.status)}
                          </span>
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
    </div>
  );
};

export default Pagamentos;
