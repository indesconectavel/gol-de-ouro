// Pix Status Screen - Gol de Ouro Mobile v2.0.0
// Tela para verificar status de pagamento PIX
// Data: 17/11/2025
// Status: FASE 2 - Importante
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthService';
import GameService from '../services/GameService';

export default function PixStatusScreen({ route, navigation }) {
  const { paymentId } = route.params || {};
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);

  const loadPaymentStatus = async (showLoading = true) => {
    if (!paymentId) {
      setError('ID do pagamento não fornecido');
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const result = await GameService.getPixPaymentStatus(paymentId);

      if (result.success && result.data) {
        setPaymentData(result.data);
        
        // Se pagamento foi aprovado, atualizar saldo do usuário
        if (result.data.status === 'approved' && user) {
          // Atualizar saldo localmente (backend já atualizou)
          const newBalance = parseFloat(user.saldo || 0) + parseFloat(result.data.valor || 0);
          updateUser({ ...user, saldo: newBalance });
        }
      } else {
        setError(result.error || 'Erro ao consultar status do pagamento');
      }
    } catch (err) {
      console.error('❌ [PIX] Erro ao consultar status:', err);
      setError('Erro ao consultar status do pagamento');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPaymentStatus();
    
    // Atualizar status a cada 5 segundos se ainda estiver pendente
    const interval = setInterval(() => {
      if (paymentData?.status === 'pending') {
        loadPaymentStatus(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#4ECDC4';
      case 'pending':
        return '#FFD700';
      case 'cancelled':
      case 'rejected':
        return '#FF6B6B';
      default:
        return '#888';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'pending':
        return 'time-outline';
      case 'cancelled':
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle-outline';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      case 'rejected':
        return 'Rejeitado';
      default:
        return status || 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d']}
          style={styles.background}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Carregando status...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d']}
          style={styles.background}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FFD700" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Status do Pagamento</Text>
            </View>

            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadPaymentStatus()}
              >
                <Text style={styles.retryButtonText}>Tentar Novamente</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.background}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPaymentStatus(false)}
              tintColor="#FFD700"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFD700" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Status do Pagamento</Text>
          </View>

          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusIconContainer}>
              <Ionicons
                name={getStatusIcon(paymentData?.status)}
                size={64}
                color={getStatusColor(paymentData?.status)}
              />
            </View>
            <Text style={styles.statusText}>
              {getStatusText(paymentData?.status)}
            </Text>
            <Text style={styles.paymentId}>
              ID: {paymentData?.payment_id || paymentId}
            </Text>
          </View>

          {/* Payment Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Valor:</Text>
              <Text style={styles.infoValue}>
                R$ {parseFloat(paymentData?.valor || 0).toFixed(2).replace('.', ',')}
              </Text>
            </View>

            {paymentData?.created_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Criado em:</Text>
                <Text style={styles.infoValue}>
                  {new Date(paymentData.created_at).toLocaleString('pt-BR')}
                </Text>
              </View>
            )}

            {paymentData?.approved_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Aprovado em:</Text>
                <Text style={styles.infoValue}>
                  {new Date(paymentData.approved_at).toLocaleString('pt-BR')}
                </Text>
              </View>
            )}

            {paymentData?.expires_at && paymentData?.status === 'pending' && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expira em:</Text>
                <Text style={styles.infoValue}>
                  {new Date(paymentData.expires_at).toLocaleString('pt-BR')}
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          {paymentData?.status === 'pending' && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => loadPaymentStatus(false)}
                disabled={refreshing}
              >
                <LinearGradient
                  colors={['#4ECDC4', '#45B7D1']}
                  style={styles.refreshButtonGradient}
                >
                  {refreshing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={20} color="#fff" />
                      <Text style={styles.refreshButtonText}>Atualizar Status</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={async () => {
                  Alert.alert(
                    'Cancelar Pagamento',
                    'Deseja realmente cancelar este pagamento?',
                    [
                      { text: 'Não', style: 'cancel' },
                      {
                        text: 'Sim',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const result = await GameService.cancelPixPayment(paymentId);
                            if (result.success) {
                              Alert.alert('Sucesso', 'Pagamento cancelado com sucesso');
                              loadPaymentStatus();
                            } else {
                              Alert.alert('Erro', result.error || 'Erro ao cancelar pagamento');
                            }
                          } catch (error) {
                            Alert.alert('Erro', 'Erro ao cancelar pagamento');
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar Pagamento</Text>
              </TouchableOpacity>
            </View>
          )}

          {paymentData?.status === 'approved' && (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#4ECDC4" />
              <Text style={styles.successText}>
                Pagamento aprovado! Seu saldo foi creditado.
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  retryButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#333',
  },
  statusIconContainer: {
    marginBottom: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  paymentId: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  infoContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  infoLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 15,
  },
  refreshButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  refreshButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cancelButton: {
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  successText: {
    color: '#4ECDC4',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
  },
});

