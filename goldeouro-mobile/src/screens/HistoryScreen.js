// History Screen - Gol de Ouro Mobile v2.0.0
// Tela de histórico de partidas/chutes
// Data: 17/11/2025
// Status: FASE 3 - Necessária
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

export default function HistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shots, setShots] = useState([]);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    goals: 0,
    misses: 0,
    totalBets: 0,
    totalPrizes: 0,
    winRate: 0,
  });

  const loadHistory = async (showLoading = true) => {
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
      const result = await GameService.getShotHistory(50);

      if (result.success && result.data) {
        const shotsData = Array.isArray(result.data) ? result.data : [];
        setShots(shotsData);

        // Calcular estatísticas
        const total = shotsData.length;
        const goals = shotsData.filter(s => s.resultado === 'goal' || s.result === 'goal').length;
        const misses = total - goals;
        const totalBets = shotsData.reduce((sum, s) => sum + parseFloat(s.valor_aposta || s.amount || s.bet_amount || 0), 0);
        const totalPrizes = shotsData.reduce((sum, s) => {
          const premio = parseFloat(s.premio || s.prize || 0);
          const premioGolDeOuro = parseFloat(s.premio_gol_de_ouro || s.golden_goal_prize || 0);
          return sum + premio + premioGolDeOuro;
        }, 0);
        const winRate = total > 0 ? (goals / total) * 100 : 0;

        setStats({
          total,
          goals,
          misses,
          totalBets,
          totalPrizes,
          winRate,
        });
      } else {
        setError(result.error || 'Erro ao carregar histórico');
      }
    } catch (err) {
      console.error('❌ [HISTORY] Erro ao carregar histórico:', err);
      setError('Erro ao carregar histórico de chutes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const formatCurrency = (value) => {
    return parseFloat(value || 0).toFixed(2).replace('.', ',');
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'goal':
        return 'football';
      case 'miss':
        return 'close-circle';
      default:
        return 'help-circle-outline';
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'goal':
        return '#4ECDC4';
      case 'miss':
        return '#FF6B6B';
      default:
        return '#888';
    }
  };

  const getResultText = (result) => {
    switch (result) {
      case 'goal':
        return 'Gol';
      case 'miss':
        return 'Defesa';
      default:
        return result || 'Desconhecido';
    }
  };

  const getDirectionName = (direction) => {
    const directions = {
      1: 'Sup. Esquerda',
      2: 'Sup. Direita',
      3: 'Centro',
      4: 'Inf. Esquerda',
      5: 'Inf. Direita',
    };
    return directions[direction] || `Direção ${direction}`;
  };

  const renderShotItem = ({ item }) => {
    const result = item.resultado || item.result || 'miss';
    const isGoal = result === 'goal';
    const isGolDeOuro = item.is_gol_de_ouro || item.is_golden_goal || false;
    const valor = parseFloat(item.valor_aposta || item.amount || item.bet_amount || 0);
    const premio = parseFloat(item.premio || item.prize || 0);
    const premioGolDeOuro = parseFloat(item.premio_gol_de_ouro || item.golden_goal_prize || 0);
    const totalPremio = premio + premioGolDeOuro;
    const direction = item.direcao || item.direction;
    const timestamp = item.created_at || item.timestamp || item.data;

    return (
      <View style={styles.shotItem}>
        <View style={styles.shotItemLeft}>
          <View style={[styles.resultIconContainer, { backgroundColor: getResultColor(result) + '20' }]}>
            <Ionicons
              name={getResultIcon(result)}
              size={24}
              color={getResultColor(result)}
            />
          </View>
          <View style={styles.shotItemInfo}>
            <View style={styles.shotItemHeader}>
              <Text style={styles.shotResult}>
                {isGolDeOuro ? '🏆 GOL DE OURO!' : getResultText(result)}
              </Text>
              {direction && (
                <Text style={styles.shotDirection}>
                  {getDirectionName(direction)}
                </Text>
              )}
            </View>
            <Text style={styles.shotDate}>
              {new Date(timestamp).toLocaleDateString('pt-BR')} às{' '}
              {new Date(timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
        <View style={styles.shotItemRight}>
          <View style={styles.shotValues}>
            <Text style={styles.shotBet}>
              Aposta: R$ {formatCurrency(valor)}
            </Text>
            {isGoal && totalPremio > 0 && (
              <Text style={styles.shotPrize}>
                Prêmio: R$ {formatCurrency(totalPremio)}
              </Text>
            )}
          </View>
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
          <Text style={styles.headerTitle}>Histórico de Chutes</Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadHistory()}
            >
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Stats Card */}
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#4ECDC4' }]}>{stats.goals}</Text>
                  <Text style={styles.statLabel}>Gols</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#FF6B6B' }]}>{stats.misses}</Text>
                  <Text style={styles.statLabel}>Defesas</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#FFD700' }]}>
                    {stats.winRate.toFixed(1)}%
                  </Text>
                  <Text style={styles.statLabel}>Taxa</Text>
                </View>
              </View>
              <View style={styles.statsFooter}>
                <Text style={styles.statsFooterText}>
                  Total apostado: R$ {formatCurrency(stats.totalBets)}
                </Text>
                <Text style={styles.statsFooterText}>
                  Total ganho: R$ {formatCurrency(stats.totalPrizes)}
                </Text>
              </View>
            </View>

            {/* Shots List */}
            {shots.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="football-outline" size={64} color="#888" />
                <Text style={styles.emptyText}>Nenhum chute encontrado</Text>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => navigation.navigate('Game')}
                >
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.playButtonGradient}
                  >
                    <Ionicons name="football" size={20} color="#000" />
                    <Text style={styles.playButtonText}>Jogar Agora</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={shots}
                renderItem={renderShotItem}
                keyExtractor={(item, index) => item.id?.toString() || item.chute_id?.toString() || index.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => loadHistory(false)}
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
  statsCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
  },
  statsFooter: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsFooterText: {
    color: '#ccc',
    fontSize: 12,
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
  playButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  playButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  shotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  shotItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shotItemInfo: {
    flex: 1,
  },
  shotItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  shotResult: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  shotDirection: {
    color: '#888',
    fontSize: 12,
  },
  shotDate: {
    color: '#888',
    fontSize: 12,
  },
  shotItemRight: {
    alignItems: 'flex-end',
  },
  shotValues: {
    alignItems: 'flex-end',
  },
  shotBet: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
  },
  shotPrize: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

