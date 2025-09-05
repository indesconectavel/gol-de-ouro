import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Pagamentos = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saldo, setSaldo] = useState(0);
  const [valorRecarga, setValorRecarga] = useState(10);
  const [pagamentos, setPagamentos] = useState([]);
  const [pagamentoAtual, setPagamentoAtual] = useState(null);

  // Valores pré-definidos para recarga
  const valoresRecarga = [10, 25, 50, 100, 200, 500];

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Carregar saldo do usuário
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://goldeouro-backend.onrender.com'}/usuario/perfil`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSaldo(data.balance || 0);
      }

      // Carregar histórico de pagamentos
      const userId = localStorage.getItem('userId');
      if (userId) {
        const pagamentosResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://goldeouro-backend.onrender.com'}/api/payments/pix/usuario/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (pagamentosResponse.ok) {
          const pagamentosData = await pagamentosResponse.json();
          setPagamentos(pagamentosData.data.payments || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const criarPagamentoPix = async () => {
    if (valorRecarga < 1) {
      toast.error('Valor mínimo de recarga é R$ 1,00');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://goldeouro-backend.onrender.com'}/api/payments/pix/criar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: parseInt(userId),
          amount: valorRecarga,
          description: `Recarga de saldo - R$ ${valorRecarga.toFixed(2)}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPagamentoAtual(data.data);
        toast.success('Pagamento PIX criado com sucesso!');
        carregarDados(); // Recarregar dados
      } else {
        toast.error(data.message || 'Erro ao criar pagamento PIX');
      }
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      toast.error('Erro ao criar pagamento PIX');
    } finally {
      setLoading(false);
    }
  };

  const consultarStatusPagamento = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://goldeouro-backend.onrender.com'}/api/payments/pix/status/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data.status === 'approved') {
          toast.success('Pagamento aprovado! Saldo atualizado.');
          carregarDados();
        }
        return data.data;
      }
    } catch (error) {
      console.error('Erro ao consultar status:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Pagamentos PIX</h1>
              <p className="text-gray-600 mt-2">Recarregue seu saldo para apostar no jogo</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Saldo Atual */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Saldo Atual</h2>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                R$ {saldo.toFixed(2)}
              </div>
              <p className="text-gray-600">Disponível para apostas</p>
            </div>
          </div>

          {/* Recarga PIX */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recarregar Saldo</h2>
            
            {/* Valores pré-definidos */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {valoresRecarga.map((valor) => (
                <button
                  key={valor}
                  onClick={() => setValorRecarga(valor)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    valorRecarga === valor
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  R$ {valor}
                </button>
              ))}
            </div>

            {/* Valor customizado */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor personalizado
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={valorRecarga}
                onChange={(e) => setValorRecarga(parseFloat(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite o valor"
              />
            </div>

            <button
              onClick={criarPagamentoPix}
              disabled={loading || valorRecarga < 1}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Criando Pagamento...' : `Recarregar R$ ${valorRecarga.toFixed(2)}`}
            </button>
          </div>
        </div>

        {/* Pagamento Atual */}
        {pagamentoAtual && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pagamento PIX Criado</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-center mb-4">
                <p className="text-lg font-semibold text-gray-800">
                  Valor: R$ {pagamentoAtual.amount}
                </p>
                <p className="text-sm text-gray-600">
                  Status: <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(pagamentoAtual.status)}`}>
                    {getStatusText(pagamentoAtual.status)}
                  </span>
                </p>
              </div>

              {pagamentoAtual.qr_code && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Escaneie o QR Code com seu app PIX:</p>
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img 
                      src={`data:image/png;base64,${pagamentoAtual.qr_code}`} 
                      alt="QR Code PIX"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                </div>
              )}

              {pagamentoAtual.pix_code && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Ou copie o código PIX:</p>
                  <div className="bg-white p-3 rounded border flex items-center">
                    <code className="flex-1 text-sm font-mono break-all">
                      {pagamentoAtual.pix_code}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pagamentoAtual.pix_code);
                        toast.success('Código PIX copiado!');
                      }}
                      className="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 text-center">
                <button
                  onClick={() => consultarStatusPagamento(pagamentoAtual.payment_id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Verificar Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Histórico de Pagamentos */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Histórico de Pagamentos</h2>
          
          {pagamentos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum pagamento encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Valor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentos.map((pagamento) => (
                    <tr key={pagamento.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatarData(pagamento.created_at)}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-800">
                        R$ {parseFloat(pagamento.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(pagamento.status)}`}>
                          {getStatusText(pagamento.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => consultarStatusPagamento(pagamento.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Verificar
                        </button>
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
  );
};

export default Pagamentos;
