// Pix History Screen - Gol de Ouro Mobile v2.0.0
// Tela de histórico de pagamentos PIX
// Data: 17/11/2025
// Status: FASE 2 - Importante
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthService';
import GameService from '../services/GameService';

export default function PixHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);

  const loadPayments = async (showLoading = true) => {
    if (!user?.id) {
      setError('Usuário não autenticado');
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
      const result = await GameService.listPixPayments(user.id, 50, 0);

      if (result.success && result.data) {
        setPayments(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.error || 'Erro ao carregar histórico');
      }
    } catch (err) {
      console.error('❌ [PIX] Erro ao carregar histórico:', err);
      setError('Erro ao carregar histórico de pagamentos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [user?.id]);

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

  const renderPaymentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.paymentItem}
      onPress={() => {
        navigation.navigate('PixStatus', { paymentId: item.payment_id });
      }}
    >
      <View style={styles.paymentItemLeft}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
        <View style={styles.paymentItemInfo}>
          <Text style={styles.paymentValue}>
            R$ {parseFloat(item.valor || 0).toFixed(2).replace('.', ',')}
          </Text>
          <Text style={styles.paymentDate}>
            {new Date(item.created_at).toLocaleDateString('pt-BR')} às{' '}
            {new Date(item.created_at).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
      <View style={styles.paymentItemRight}>
        <Ionicons
          name={getStatusIcon(item.status)}
          size={24}
          color={getStatusColor(item.status)}
        />
        <Text style={[styles.paymentStatus, { color: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d']}
          style={styles.background}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Carregando histórico...</Text>
          </View>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Histórico PIX</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('PixCreate')}
            style={styles.addButton}
          >
            <Ionicons name="add-circle" size={28} color="#FFD700" />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadPayments()}
            >
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#888" />
            <Text style={styles.emptyText}>Nenhum pagamento encontrado</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('PixCreate')}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.createButtonGradient}
              >
                <Ionicons name="qr-code" size={20} color="#000" />
                <Text style={styles.createButtonText}>Criar Pagamento PIX</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={payments}
            renderItem={renderPaymentItem}
            keyExtractor={(item) => item.payment_id?.toString() || item.id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadPayments(false)}
                tintColor="#FFD700"
              />
            }
          />
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  addButton: {
    marginLeft: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  createButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  createButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  paymentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  paymentItemInfo: {
    flex: 1,
  },
  paymentValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paymentDate: {
    color: '#888',
    fontSize: 12,
  },
  paymentItemRight: {
    alignItems: 'flex-end',
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

