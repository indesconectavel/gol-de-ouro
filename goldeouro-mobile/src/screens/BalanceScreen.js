// Balance Screen - Gol de Ouro Mobile v2.0.0
// Tela de saldo e extrato
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

export default function BalanceScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(null);
  const [statement, setStatement] = useState([]);
  const [error, setError] = useState(null);

  const loadData = async (showLoading = true) => {
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
      // Carregar saldo e extrato em paralelo
      const [balanceResult, statementResult] = await Promise.all([
        GameService.getBalance(user.id),
        GameService.getStatement(user.id, 50, 0),
      ]);

      if (balanceResult.success && balanceResult.data) {
        setBalance(balanceResult.data);
        // Atualizar saldo do usuário se diferente
        if (balanceResult.data.saldo !== undefined && user.saldo !== balanceResult.data.saldo) {
          updateUser({ ...user, saldo: balanceResult.data.saldo });
        }
      }

      if (statementResult.success && statementResult.data) {
        setStatement(Array.isArray(statementResult.data) ? statementResult.data : []);
      }
    } catch (err) {
      console.error('❌ [BALANCE] Erro ao carregar dados:', err);
      setError('Erro ao carregar saldo e extrato');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const getTransactionIcon = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'credito':
      case 'deposito':
      case 'premio':
        return 'arrow-down-circle';
      case 'debito':
      case 'saque':
      case 'aposta':
        return 'arrow-up-circle';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'credito':
      case 'deposito':
      case 'premio':
        return '#4ECDC4';
      case 'debito':
      case 'saque':
      case 'aposta':
        return '#FF6B6B';
      default:
        return '#888';
    }
  };

  const formatCurrency = (value) => {
    return parseFloat(value || 0).toFixed(2).replace('.', ',');
  };

  const renderTransactionItem = ({ item }) => {
    const tipo = item.tipo || item.type || 'desconhecido';
    const valor = parseFloat(item.valor || item.amount || 0);
    const isCredit = tipo.toLowerCase().includes('credito') || 
                     tipo.toLowerCase().includes('deposito') || 
                     tipo.toLowerCase().includes('premio');

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIconContainer, { backgroundColor: getTransactionColor(tipo) + '20' }]}>
            <Ionicons
              name={getTransactionIcon(tipo)}
              size={24}
              color={getTransactionColor(tipo)}
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDescription}>
              {item.descricao || item.description || tipo}
            </Text>
            <Text style={styles.transactionDate}>
              {new Date(item.created_at || item.data || Date.now()).toLocaleDateString('pt-BR')} às{' '}
              {new Date(item.created_at || item.data || Date.now()).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionValue,
            { color: isCredit ? '#4ECDC4' : '#FF6B6B' }
          ]}>
            {isCredit ? '+' : '-'}R$ {formatCurrency(valor)}
          </Text>
        </View>
      </View>
    );
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
            <Text style={styles.loadingText}>Carregando saldo...</Text>
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
          <Text style={styles.headerTitle}>Saldo e Extrato</Text>
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
              onPress={() => loadData()}
            >
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Saldo Disponível</Text>
              <Text style={styles.balanceValue}>
                R$ {formatCurrency(balance?.saldo || user?.saldo || 0)}
              </Text>
              {balance?.saldo_anterior !== undefined && (
                <Text style={styles.balanceChange}>
                  Saldo anterior: R$ {formatCurrency(balance.saldo_anterior)}
                </Text>
              )}
            </View>

            {/* Statement */}
            <View style={styles.statementHeader}>
              <Text style={styles.statementTitle}>Extrato</Text>
              <Text style={styles.statementCount}>
                {statement.length} {statement.length === 1 ? 'transação' : 'transações'}
              </Text>
            </View>

            {statement.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color="#888" />
                <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
              </View>
            ) : (
              <FlatList
                data={statement}
                renderItem={renderTransactionItem}
                keyExtractor={(item, index) => item.id?.toString() || item.transacao_id?.toString() || index.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => loadData(false)}
                    tintColor="#FFD700"
                  />
                }
              />
            )}
          </>
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
  balanceCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 25,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  balanceLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 10,
  },
  balanceValue: {
    color: '#FFD700',
    fontSize: 36,
    fontWeight: 'bold',
  },
  balanceChange: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  statementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  statementTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statementCount: {
    color: '#888',
    fontSize: 14,
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
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    color: '#888',
    fontSize: 12,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

