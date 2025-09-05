import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, Title, Paragraph } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    totalGames: 0,
    bestScore: 0,
    rank: 0,
  });

  const [recentGames, setRecentGames] = useState([]);

  useEffect(() => {
    // Simular carregamento de dados do usuário
    loadUserData();
  }, []);

  const loadUserData = async () => {
    // Simular dados do usuário
    setUserStats({
      level: 5,
      xp: 1250,
      totalGames: 47,
      bestScore: 95,
      rank: 12,
    });

    setRecentGames([
      { id: 1, score: 85, zone: 'center', date: '2025-09-05' },
      { id: 2, score: 92, zone: 'left', date: '2025-09-04' },
      { id: 3, score: 78, zone: 'right', date: '2025-09-04' },
    ]);
  };

  const getLevelProgress = () => {
    const currentLevel = userStats.level;
    const xpForCurrentLevel = Math.pow(currentLevel, 2) * 100;
    const xpForNextLevel = Math.pow(currentLevel + 1, 2) * 100;
    const progress = (userStats.xp / xpForNextLevel) * 100;
    return Math.min(progress, 100);
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.header}
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Bem-vindo ao</Text>
          <Text style={styles.appTitle}>Gol de Ouro</Text>
          <Text style={styles.subtitle}>Seu jogo de futebol favorito!</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.level}</Text>
            <Text style={styles.statLabel}>Nível</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.totalGames}</Text>
            <Text style={styles.statLabel}>Jogos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.bestScore}</Text>
            <Text style={styles.statLabel}>Melhor</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>#{userStats.rank}</Text>
            <Text style={styles.statLabel}>Ranking</Text>
          </View>
        </View>

        <View style={styles.levelProgress}>
          <Text style={styles.levelText}>Nível {userStats.level}</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${getLevelProgress()}%` }
              ]} 
            />
          </View>
          <Text style={styles.xpText}>{userStats.xp} XP</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => navigation.navigate('Game')}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.playButtonGradient}
          >
            <Ionicons name="play" size={32} color="#000" />
            <Text style={styles.playButtonText}>JOGAR AGORA</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Card style={styles.recentGamesCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Jogos Recentes</Title>
            {recentGames.map((game) => (
              <View key={game.id} style={styles.gameItem}>
                <View style={styles.gameInfo}>
                  <Text style={styles.gameScore}>{game.score} pontos</Text>
                  <Text style={styles.gameZone}>Zona: {game.zone}</Text>
                </View>
                <Text style={styles.gameDate}>{game.date}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.achievementsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Conquistas</Title>
            <View style={styles.achievementItem}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.achievementText}>Primeiro Gol</Text>
            </View>
            <View style={styles.achievementItem}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.achievementText}>Centurião</Text>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  appTitle: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 14,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 5,
  },
  levelProgress: {
    marginTop: 10,
  },
  levelText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  xpText: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right',
  },
  content: {
    padding: 20,
  },
  playButton: {
    marginBottom: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  playButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  recentGamesCard: {
    backgroundColor: '#2d2d2d',
    marginBottom: 20,
    borderRadius: 15,
  },
  achievementsCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 15,
  },
  cardTitle: {
    color: '#FFD700',
    fontSize: 18,
    marginBottom: 15,
  },
  gameItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  gameInfo: {
    flex: 1,
  },
  gameScore: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameZone: {
    color: '#ccc',
    fontSize: 12,
  },
  gameDate: {
    color: '#999',
    fontSize: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  achievementText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
  },
});
