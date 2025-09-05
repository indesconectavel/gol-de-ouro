import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const [user, setUser] = useState({
    name: 'Jogador',
    email: 'jogador@goldeouro.com',
    avatar: null,
    level: 5,
    xp: 1250,
    totalGames: 47,
    bestScore: 95,
    rank: 12,
    achievements: [],
  });

  const [stats, setStats] = useState({
    gamesPlayed: 47,
    totalScore: 3240,
    averageScore: 69,
    winRate: 85,
    favoriteZone: 'center',
    streak: 5,
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    // Simular carregamento de dados do usuário
    setUser({
      ...user,
      achievements: [
        { id: 1, name: 'Primeiro Gol', description: 'Faça seu primeiro gol', icon: 'trophy', unlocked: true },
        { id: 2, name: 'Centurião', description: 'Jogue 100 partidas', icon: 'star', unlocked: true },
        { id: 3, name: 'Século', description: 'Faça 100 pontos em uma partida', icon: 'medal', unlocked: false },
        { id: 4, name: 'Estrategista', description: 'Use todas as zonas de chute', icon: 'bulb', unlocked: true },
      ],
    });
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setUser({ ...user, avatar: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua câmera!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setUser({ ...user, avatar: result.assets[0].uri });
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Alterar Foto',
      'Escolha uma opção',
      [
        { text: 'Câmera', onPress: takePhoto },
        { text: 'Galeria', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const getLevelProgress = () => {
    const currentLevel = user.level;
    const xpForCurrentLevel = Math.pow(currentLevel, 2) * 100;
    const xpForNextLevel = Math.pow(currentLevel + 1, 2) * 100;
    const progress = (user.xp / xpForNextLevel) * 100;
    return Math.min(progress, 100);
  };

  const getZoneColor = (zone) => {
    const colors = {
      left: '#FF6B6B',
      center: '#4ECDC4',
      right: '#45B7D1',
    };
    return colors[zone] || '#666';
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.header}
      >
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={showImagePicker}>
            <View style={styles.avatarContainer}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="#666" />
                </View>
              )}
              <View style={styles.avatarEdit}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Nível {user.level}</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getLevelProgress()}%` }
                ]} 
              />
            </View>
            <Text style={styles.xpText}>{user.xp} XP</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Estatísticas */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Estatísticas</Title>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
                <Text style={styles.statLabel}>Jogos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalScore}</Text>
                <Text style={styles.statLabel}>Pontos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.averageScore}</Text>
                <Text style={styles.statLabel}>Média</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.winRate}%</Text>
                <Text style={styles.statLabel}>Vitórias</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Zona Favorita */}
        <Card style={styles.favoriteZoneCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Zona Favorita</Title>
            <View style={styles.zoneInfo}>
              <View 
                style={[
                  styles.zoneIndicator, 
                  { backgroundColor: getZoneColor(stats.favoriteZone) }
                ]} 
              />
              <Text style={styles.zoneText}>{stats.favoriteZone.toUpperCase()}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Conquistas */}
        <Card style={styles.achievementsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Conquistas</Title>
            {user.achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <View style={styles.achievementIcon}>
                  <Ionicons 
                    name={achievement.icon} 
                    size={24} 
                    color={achievement.unlocked ? '#FFD700' : '#666'} 
                  />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[
                    styles.achievementName,
                    { color: achievement.unlocked ? '#fff' : '#666' }
                  ]}>
                    {achievement.name}
                  </Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                </View>
                {achievement.unlocked && (
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                )}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Configurações */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Configurações</Title>
            <TouchableOpacity style={styles.settingItem}>
              <Ionicons name="notifications" size={20} color="#FFD700" />
              <Text style={styles.settingText}>Notificações</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Ionicons name="volume-high" size={20} color="#FFD700" />
              <Text style={styles.settingText}>Som</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Ionicons name="help-circle" size={20} color="#FFD700" />
              <Text style={styles.settingText}>Ajuda</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <Ionicons name="log-out" size={20} color="#FF6B6B" />
              <Text style={[styles.settingText, { color: '#FF6B6B' }]}>Sair</Text>
            </TouchableOpacity>
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
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 20,
  },
  levelContainer: {
    width: '100%',
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
  statsCard: {
    backgroundColor: '#2d2d2d',
    marginBottom: 20,
    borderRadius: 15,
  },
  favoriteZoneCard: {
    backgroundColor: '#2d2d2d',
    marginBottom: 20,
    borderRadius: 15,
  },
  achievementsCard: {
    backgroundColor: '#2d2d2d',
    marginBottom: 20,
    borderRadius: 15,
  },
  settingsCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 15,
  },
  cardTitle: {
    color: '#FFD700',
    fontSize: 18,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 5,
  },
  zoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  zoneText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  achievementIcon: {
    width: 40,
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 15,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#999',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 15,
    flex: 1,
  },
});
