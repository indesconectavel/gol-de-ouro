import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, Title, Paragraph } from 'react-native-paper';

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [userRank, setUserRank] = useState(12);

  const periods = [
    { id: 'daily', name: 'Diário' },
    { id: 'weekly', name: 'Semanal' },
    { id: 'monthly', name: 'Mensal' },
    { id: 'alltime', name: 'Todos os Tempos' },
  ];

  useEffect(() => {
    loadLeaderboard();
  }, [selectedPeriod]);

  const loadLeaderboard = async () => {
    // Simular dados do ranking
    const mockData = [
      { id: 1, name: 'Pelé', score: 9850, level: 15, avatar: null, isCurrentUser: false },
      { id: 2, name: 'Messi', score: 9720, level: 14, avatar: null, isCurrentUser: false },
      { id: 3, name: 'Ronaldo', score: 9650, level: 14, avatar: null, isCurrentUser: false },
      { id: 4, name: 'Neymar', score: 9520, level: 13, avatar: null, isCurrentUser: false },
      { id: 5, name: 'Maradona', score: 9480, level: 13, avatar: null, isCurrentUser: false },
      { id: 6, name: 'Zidane', score: 9320, level: 12, avatar: null, isCurrentUser: false },
      { id: 7, name: 'Ronaldinho', score: 9180, level: 12, avatar: null, isCurrentUser: false },
      { id: 8, name: 'Kaká', score: 9050, level: 11, avatar: null, isCurrentUser: false },
      { id: 9, name: 'Iniesta', score: 8920, level: 11, avatar: null, isCurrentUser: false },
      { id: 10, name: 'Xavi', score: 8780, level: 10, avatar: null, isCurrentUser: false },
      { id: 11, name: 'Modric', score: 8650, level: 10, avatar: null, isCurrentUser: false },
      { id: 12, name: 'Você', score: 8520, level: 9, avatar: null, isCurrentUser: true },
    ];

    setLeaderboard(mockData);
  };

  const getRankIcon = (position) => {
    if (position === 1) return 'trophy';
    if (position === 2) return 'medal';
    if (position === 3) return 'ribbon';
    return 'person';
  };

  const getRankColor = (position) => {
    if (position === 1) return '#FFD700';
    if (position === 2) return '#C0C0C0';
    if (position === 3) return '#CD7F32';
    return '#666';
  };

  const renderPlayer = ({ item, index }) => (
    <View style={[
      styles.playerItem,
      item.isCurrentUser && styles.currentUserItem
    ]}>
      <View style={styles.rankContainer}>
        <Ionicons 
          name={getRankIcon(index + 1)} 
          size={24} 
          color={getRankColor(index + 1)} 
        />
        <Text style={[
          styles.rankText,
          { color: getRankColor(index + 1) }
        ]}>
          #{index + 1}
        </Text>
      </View>
      
      <View style={styles.playerInfo}>
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          ) : (
            <Ionicons name="person" size={20} color="#666" />
          )}
        </View>
        <View style={styles.playerDetails}>
          <Text style={[
            styles.playerName,
            item.isCurrentUser && styles.currentUserName
          ]}>
            {item.name}
          </Text>
          <Text style={styles.playerLevel}>Nível {item.level}</Text>
        </View>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={[
          styles.scoreText,
          item.isCurrentUser && styles.currentUserScore
        ]}>
          {item.score.toLocaleString()}
        </Text>
        <Text style={styles.scoreLabel}>pontos</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.header}
      >
        <Text style={styles.title}>Ranking</Text>
        <Text style={styles.subtitle}>Os melhores jogadores</Text>
        
        {/* Filtros de Período */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.periodsContainer}
        >
          {periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && styles.selectedPeriodButton
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text style={[
                styles.periodText,
                selectedPeriod === period.id && styles.selectedPeriodText
              ]}>
                {period.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <View style={styles.content}>
        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <Card style={styles.podiumCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Pódium</Title>
              <View style={styles.podium}>
                {/* 2º Lugar */}
                <View style={styles.podiumItem}>
                  <View style={[styles.podiumPosition, styles.secondPlace]}>
                    <Ionicons name="medal" size={30} color="#C0C0C0" />
                    <Text style={styles.podiumRank}>2º</Text>
                  </View>
                  <Text style={styles.podiumName}>{leaderboard[1].name}</Text>
                  <Text style={styles.podiumScore}>{leaderboard[1].score.toLocaleString()}</Text>
                </View>

                {/* 1º Lugar */}
                <View style={styles.podiumItem}>
                  <View style={[styles.podiumPosition, styles.firstPlace]}>
                    <Ionicons name="trophy" size={40} color="#FFD700" />
                    <Text style={styles.podiumRank}>1º</Text>
                  </View>
                  <Text style={styles.podiumName}>{leaderboard[0].name}</Text>
                  <Text style={styles.podiumScore}>{leaderboard[0].score.toLocaleString()}</Text>
                </View>

                {/* 3º Lugar */}
                <View style={styles.podiumItem}>
                  <View style={[styles.podiumPosition, styles.thirdPlace]}>
                    <Ionicons name="ribbon" size={30} color="#CD7F32" />
                    <Text style={styles.podiumRank}>3º</Text>
                  </View>
                  <Text style={styles.podiumName}>{leaderboard[2].name}</Text>
                  <Text style={styles.podiumScore}>{leaderboard[2].score.toLocaleString()}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Lista Completa */}
        <Card style={styles.leaderboardCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Classificação Completa</Title>
            <FlatList
              data={leaderboard}
              renderItem={renderPlayer}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
            />
          </Card.Content>
        </Card>

        {/* Sua Posição */}
        <Card style={styles.yourRankCard}>
          <Card.Content>
            <View style={styles.yourRankInfo}>
              <Ionicons name="person" size={24} color="#FFD700" />
              <View style={styles.yourRankDetails}>
                <Text style={styles.yourRankTitle}>Sua Posição</Text>
                <Text style={styles.yourRankPosition}>#{userRank}</Text>
              </View>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share" size={20} color="#FFD700" />
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  periodsContainer: {
    marginTop: 10,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedPeriodButton: {
    backgroundColor: '#FFD700',
  },
  periodText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedPeriodText: {
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  podiumCard: {
    backgroundColor: '#2d2d2d',
    marginBottom: 20,
    borderRadius: 15,
  },
  leaderboardCard: {
    backgroundColor: '#2d2d2d',
    marginBottom: 20,
    borderRadius: 15,
  },
  yourRankCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 15,
  },
  cardTitle: {
    color: '#FFD700',
    fontSize: 18,
    marginBottom: 15,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumPosition: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  firstPlace: {
    height: 80,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  secondPlace: {
    height: 60,
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  thirdPlace: {
    height: 50,
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  podiumRank: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  podiumName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  podiumScore: {
    color: '#FFD700',
    fontSize: 10,
    marginTop: 2,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentUserItem: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    marginVertical: 2,
    paddingHorizontal: 10,
  },
  rankContainer: {
    width: 60,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentUserName: {
    color: '#FFD700',
  },
  playerLevel: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentUserScore: {
    color: '#FFD700',
  },
  scoreLabel: {
    color: '#ccc',
    fontSize: 10,
    marginTop: 2,
  },
  yourRankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yourRankDetails: {
    flex: 1,
    marginLeft: 15,
  },
  yourRankTitle: {
    color: '#ccc',
    fontSize: 14,
  },
  yourRankPosition: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  shareButton: {
    padding: 10,
  },
});
