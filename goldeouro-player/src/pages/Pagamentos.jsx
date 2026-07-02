import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import InternalPageLayout from '../components/InternalPageLayout';
import VersionBanner from '../components/VersionBanner';
import apiClient from '../services/apiClient';
import { API_ENDPOINTS } from '../config/api';

const PAYMENT_STATUS_POLLING_INTERVAL_MS = 15000;
const VALOR_POR_CHUTE = 1;

const Pagamentos = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [valorRecarga, setValorRecarga] = useState(10);
  const [pagamentos, setPagamentos] = useState([]);
  const [pagamentoAtual, setPagamentoAtual] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const qrSectionRef = useRef(null);

  const scrollToQrSection = () => {
    requestAnimationFrame(() => {
      qrSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const valoresRecarga = [5, 10, 20, 50, 100, 200];

  const carregarDados = useCallback(async () => {
    try {
      const pagamentosResponse = await apiClient.get(API_ENDPOINTS.PIX_USER, {
        skipCache: true,
      });
      if (pagamentosResponse.data?.success && pagamentosResponse.data?.data) {
        const data = pagamentosResponse.data.data;
        setPagamentos(Array.isArray(data.historico_pagamentos) ? data.historico_pagamentos : (data.payments || []));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const consultarStatusPagamento = async (paymentId) => {
    try {
      if (!paymentId) return null;

      const response = await apiClient.get(`${API_ENDPOINTS.PIX_STATUS}?paymentId=${paymentId}`, {
        skipCache: true,
      });

      if (response.data?.data) {
        if (response.data.data.status === 'approved') {
          toast.success('Pagamento confirmado! Saldo atualizado.');
          if (typeof apiClient.invalidateCache === 'function') {
            apiClient.invalidateCache(API_ENDPOINTS.PROFILE);
          }
          carregarDados();
        }
        return response.data.data;
      }
    } catch (error) {
      console.error('Erro ao consultar status:', error);
    }
    return null;
  };

  useEffect(() => {
    if (!pagamentoAtual?.id) return undefined;
    const status = String(pagamentoAtual.status || 'pending').toLowerCase();
    if (status === 'approved') return undefined;

    const paymentId = pagamentoAtual.payment_id || pagamentoAtual.id;
    const interval = setInterval(async () => {
      const updated = await consultarStatusPagamento(paymentId);
      if (updated?.status === 'approved') {
        setPagamentoAtual((prev) => (prev ? { ...prev, status: 'approved' } : prev));
      }
    }, PAYMENT_STATUS_POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [pagamentoAtual?.id, pagamentoAtual?.status]);

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
        setPagamentoAtual(response.data.data);
        toast.success('Pagamento PIX criado! Escaneie o QR Code ou copie o código abaixo.');
        carregarDados();
        scrollToQrSection();
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
      case 'approved': return 'text-emerald-400 bg-emerald-500/20 border border-emerald-400/40';
      case 'pending': return 'text-amber-400 bg-amber-500/20 border border-amber-400/40';
      case 'rejected': return 'text-red-400 bg-red-500/20 border border-red-400/40';
      default: return 'text-slate-400 bg-slate-500/20 border border-slate-400/40';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return '✓ Confirmado';
      case 'pending': return '⏳ Pendente';
      case 'rejected': return 'Rejeitado';
      default: return 'Desconhecido';
    }
  };

  const getPixPayload = (pagamento) =>
    pagamento?.pix_copy_paste || pagamento?.pix_code || pagamento?.qr_code || '';

  const renderPagamentoAtual = () => {
    if (!pagamentoAtual) return null;

    const pixPayload = getPixPayload(pagamentoAtual);
    const qrImage = pagamentoAtual.qr_code_base64
      ? `data:image/png;base64,${pagamentoAtual.qr_code_base64}`
      : null;
    const isApproved = String(pagamentoAtual.status || 'pending').toLowerCase() === 'approved';

    return (
      <div
        ref={qrSectionRef}
        className="bg-white/5 backdrop-blur-xl rounded-2xl border border-emerald-400/30 shadow-xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Conclua seu pagamento PIX</h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isApproved
                ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-400/40'
                : 'text-amber-400 bg-amber-500/20 border border-amber-400/40'
            }`}
          >
            {isApproved ? '✓ Pagamento confirmado' : '⏳ Aguardando pagamento'}
          </span>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-white mb-1">R$ {valorRecarga.toFixed(2)}</p>
            <p className="text-sm text-white/50">Pagamento instantâneo · crédito automático após confirmação</p>
          </div>

          {!isApproved && qrImage && (
            <div className="flex flex-col items-center mb-6">
              <p className="text-sm text-white/80 mb-3 font-medium">Escaneie o QR Code no app do seu banco</p>
              <img
                src={qrImage}
                alt="QR Code PIX para pagamento"
                className="w-56 h-56 max-w-full rounded-xl border-4 border-white/20 bg-white p-2"
              />
            </div>
          )}

          {!isApproved && pixPayload && (
            <div className="text-center mb-4">
              <p className="text-sm text-white/80 mb-3 font-medium">Ou copie o código PIX Copia e Cola</p>
              <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                <code className="text-xs sm:text-sm font-mono break-all text-white/90 block mb-4 bg-black/20 p-3 rounded-lg text-left">
                  {pixPayload}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(pixPayload);
                    setCopiado(true);
                    setTimeout(() => setCopiado(false), 3000);
                  }}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 font-semibold ${
                    copiado
                      ? 'bg-green-600/90 text-white'
                      : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                  }`}
                >
                  {copiado ? '✓ Código copiado!' : 'Copiar código PIX'}
                </button>
              </div>
            </div>
          )}

          {!isApproved && !pixPayload && pagamentoAtual.init_point && (
            <div className="text-center">
              <p className="text-sm text-white/80 mb-4">Continue o pagamento na página segura de pagamento PIX</p>
              <a
                href={pagamentoAtual.init_point}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-200"
              >
                Continuar pagamento PIX
              </a>
            </div>
          )}

          {!isApproved && (
            <p className="text-center text-xs text-white/50 mt-3">
              O saldo será creditado automaticamente após a confirmação do pagamento.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <InternalPageLayout title="Pagamentos">
    <div className="min-h-screen bg-slate-900/95 flex flex-col">
      <VersionBanner showTime={true} />
      <div className="flex-1">
        <div className="p-6">
          {/* Header - glass */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Pagamentos PIX</h1>
                <p className="text-white/70 mt-1">Recarregue seu saldo para apostar no jogo</p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium border border-white/20"
              >
                ← Voltar
              </button>
            </div>
          </div>

          {renderPagamentoAtual()}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recarga PIX - glass */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Recarregar Saldo</h2>
              
              <div className="grid grid-cols-3 gap-3 mb-4">
                {valoresRecarga.map((valor) => {
                  const isRecomendado = valor === 20;
                  return (
                    <button
                      key={valor}
                      onClick={() => setValorRecarga(valor)}
                      className={`relative p-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                        valorRecarga === valor
                          ? isRecomendado
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50'
                            : 'border-sky-400 bg-sky-500/20 text-sky-200 shadow-lg'
                          : isRecomendado
                            ? 'border-amber-400/60 bg-white/5 text-white hover:bg-amber-500/10'
                            : 'border-white/20 hover:border-white/30 hover:bg-white/10 text-white/90'
                      }`}
                    >
                      {isRecomendado && (
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-slate-900 uppercase tracking-wide">
                          Recomendado
                        </span>
                      )}
                      R$ {valor}
                    </button>
                  );
                })}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Valor personalizado
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={valorRecarga}
                  onChange={(e) => setValorRecarga(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-sky-400 focus:border-sky-400/50 transition-colors"
                  placeholder="Digite o valor"
                />
              </div>

              <button
                onClick={criarPagamentoPix}
                disabled={loading || valorRecarga < 1}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {loading
                  ? 'Gerando pagamento...'
                  : `Garantir ${Math.floor(valorRecarga / VALOR_POR_CHUTE)} chute${
                      Math.floor(valorRecarga / VALOR_POR_CHUTE) === 1 ? '' : 's'
                    }`}
              </button>
            </div>

            {/* Instruções PIX - glass */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Como funciona o PIX</h3>
              <div className="space-y-2 text-sm text-white/80">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-sky-500/30 text-sky-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Escolha o valor desejado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-sky-500/30 text-sky-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Copie o código PIX ou escaneie o QR Code</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-sky-500/30 text-sky-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Pague no seu app bancário</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-sky-500/30 text-sky-200 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                  <span>Seu saldo será creditado automaticamente</span>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico de Pagamentos - glass */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-6 mt-6">
            <h2 className="text-lg font-semibold text-white mb-4">Histórico de Pagamentos</h2>
          
            {pagamentos.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💳</span>
                </div>
                <p className="text-white/70 text-lg">Nenhum pagamento encontrado</p>
                <p className="text-white/50 text-sm mt-1">Seus pagamentos aparecerão aqui</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 font-semibold text-white/90">Data</th>
                      <th className="text-left py-3 px-4 font-semibold text-white/90">Valor</th>
                      <th className="text-left py-3 px-4 font-semibold text-white/90">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos.map((pagamento) => (
                      <tr key={pagamento.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-sm text-white/80">
                          {formatarData(pagamento.created_at)}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-white">
                          R$ {parseFloat(pagamento.amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(pagamento.status)}`}>
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
    </InternalPageLayout>
  );
};

export default Pagamentos;
