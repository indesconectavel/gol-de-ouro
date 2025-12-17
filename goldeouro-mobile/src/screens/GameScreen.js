// ✅ HARDENING FINAL: GameScreen adaptado para REST API
// Sistema de jogo usa REST API exclusivamente (/api/games/shoot)
// Removido código de WebSocket/fila/partidas

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GameService from '../services/GameService';
import { useAuth } from '../services/AuthService';

const zones = [
  { id: 1, name: 'Esquerda', color: '#FF6B6B' },
  { id: 2, name: 'Centro-Esquerda', color: '#4ECDC4' },
  { id: 3, name: 'Centro', color: '#45B7D1' },
  { id: 4, name: 'Centro-Direita', color: '#96CEB4' },
  { id: 5, name: 'Direita', color: '#FFEAA7' },
];

const betAmounts = [1, 2, 5, 10];

export default function GameScreen() {
  const { user, token } = useAuth();
  const [selectedZone, setSelectedZone] = useState(3); // Centro por padrão
  const [selectedAmount, setSelectedAmount] = useState(1);
  const [isShooting, setIsShooting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);

  const handleShoot = async () => {
    if (!user || !token) {
      Alert.alert('Erro', 'Você precisa estar logado para jogar');
      return;
    }

    if (isShooting) return;

    setIsShooting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // ✅ HARDENING FINAL: Usar REST API exclusivamente
      const result = await GameService.shoot(selectedZone, selectedAmount);

      if (result.success && result.data?.data) {
        const shootData = result.data.data;
        const isGoal = shootData.result === 'goal';
        const premio = shootData.premio || 0;
        const premioGolDeOuro = shootData.premioGolDeOuro || 0;

        setLastResult({
          isGoal,
          premio,
          premioGolDeOuro,
          loteProgress: shootData.loteProgress,
          isLoteComplete: shootData.isLoteComplete
        });

        // Adicionar ao histórico
        setGameHistory(prev => [{
          id: Date.now(),
          zone: selectedZone,
          amount: selectedAmount,
          result: isGoal ? 'Gol!' : 'Errou',
          premio: premio + premioGolDeOuro,
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 10));

        // Feedback visual
        if (isGoal) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(
            '⚽ GOL!',
            `Parabéns! Você ganhou R$ ${(premio + premioGolDeOuro).toFixed(2)}${premioGolDeOuro > 0 ? ' (incluindo Gol de Ouro!)' : ''}`
          );
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Errou', 'Tente novamente!');
        }
      } else {
        Alert.alert('Erro', result.error || 'Erro ao realizar chute');
      }
    } catch (error) {
      console.error('Erro ao chutar:', error);
      Alert.alert('Erro', 'Erro ao realizar chute. Tente novamente.');
    } finally {
      setIsShooting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Saldo</Text>
            <Text style={styles.balanceValue}>R$ {user?.saldo?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        {/* Zonas do Gol */}
        <View style={styles.zonesContainer}>
          <Text style={styles.zonesTitle}>Escolha a zona do gol:</Text>
          <View style={styles.zonesGrid}>
            {zones.map((zone) => (
              <TouchableOpacity
                key={zone.id}
                style={[
                  styles.zoneButton,
                  {
                    backgroundColor: selectedZone === zone.id ? zone.color : 'rgba(255,255,255,0.1)',
                    borderColor: selectedZone === zone.id ? zone.color : 'rgba(255,255,255,0.3)',
                  }
                ]}
                onPress={() => setSelectedZone(zone.id)}
                disabled={isShooting}
              >
                <Text style={styles.zoneButtonText}>{zone.name}</Text>
                <Text style={styles.zoneButtonId}>{zone.id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Valores de Aposta */}
        <View style={styles.betContainer}>
          <Text style={styles.betTitle}>Valor da aposta:</Text>
          <View style={styles.betGrid}>
            {betAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.betButton,
                  {
                    backgroundColor: selectedAmount === amount ? '#FFD700' : 'rgba(255,255,255,0.1)',
                    borderColor: selectedAmount === amount ? '#FFD700' : 'rgba(255,255,255,0.3)',
                  }
                ]}
                onPress={() => setSelectedAmount(amount)}
                disabled={isShooting}
              >
                <Text style={styles.betButtonText}>R$ {amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botão de Chute */}
        <View style={styles.shootContainer}>
          <TouchableOpacity
            style={styles.shootButton}
            onPress={handleShoot}
            disabled={isShooting || !user}
          >
            <LinearGradient
              colors={isShooting ? ['#666', '#888'] : ['#FF6B6B', '#FF8E8E']}
              style={styles.shootButtonGradient}
            >
              {isShooting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="football" size={24} color="#fff" />
                  <Text style={styles.shootButtonText}>CHUTAR</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Último Resultado */}
        {lastResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Último Resultado:</Text>
            <Text style={[
              styles.resultText,
              { color: lastResult.isGoal ? '#4ECDC4' : '#FF6B6B' }
            ]}>
              {lastResult.isGoal ? '⚽ GOL!' : '❌ Errou'}
            </Text>
            {lastResult.isGoal && (
              <Text style={styles.premioText}>
                Prêmio: R$ {(lastResult.premio + lastResult.premioGolDeOuro).toFixed(2)}
                {lastResult.premioGolDeOuro > 0 && ' 🏆 Gol de Ouro!'}
              </Text>
            )}
            {lastResult.loteProgress && (
              <Text style={styles.loteProgressText}>
                Lote: {lastResult.loteProgress.current}/{lastResult.loteProgress.total}
              </Text>
            )}
          </View>
        )}

        {/* Histórico */}
        {gameHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Histórico Recente</Text>
            {gameHistory.slice(0, 5).map((game) => (
              <View key={game.id} style={styles.historyItem}>
                <Text style={styles.historyResult}>{game.result}</Text>
                <Text style={styles.historyDetails}>
                  Zona {game.zone} • R$ {game.amount} • {game.premio > 0 ? `R$ ${game.premio.toFixed(2)}` : '-'}
                </Text>
              </View>
            ))}
          </View>
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
    padding: 20,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  balanceValue: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
  },
  zonesContainer: {
    marginBottom: 30,
  },
  zonesTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  zonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  zoneButton: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  zoneButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  zoneButtonId: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  betContainer: {
    marginBottom: 30,
  },
  betTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  betGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  betButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  betButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shootContainer: {
    marginBottom: 30,
  },
  shootButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  shootButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  shootButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  resultContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  resultTitle: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 10,
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  premioText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  loteProgressText: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 5,
  },
  historyContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 15,
  },
  historyTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  historyResult: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyDetails: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
});
