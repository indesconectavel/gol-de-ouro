import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function GameScreen() {
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedZone, setSelectedZone] = useState(null);
  const [ballPosition, setBallPosition] = useState({ x: width / 2, y: height * 0.7 });
  const [targetPosition, setTargetPosition] = useState({ x: width / 2, y: height * 0.3 });
  const [isShooting, setIsShooting] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);

  const ballAnimation = useRef(new Animated.ValueXY({ x: width / 2, y: height * 0.7 })).current;
  const targetAnimation = useRef(new Animated.ValueXY({ x: width / 2, y: height * 0.3 })).current;

  const zones = [
    { id: 'left', name: 'Esquerda', x: width * 0.2, color: '#FF6B6B' },
    { id: 'center', name: 'Centro', x: width * 0.5, color: '#4ECDC4' },
    { id: 'right', name: 'Direita', x: width * 0.8, color: '#45B7D1' },
  ];

  useEffect(() => {
    let timer;
    if (gameStarted && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      endGame();
    }
    return () => clearTimeout(timer);
  }, [gameStarted, timeLeft]);

  const startGame = () => {
    setGameStarted(true);
    setTimeLeft(30);
    setScore(0);
    setGameHistory([]);
    generateNewTarget();
  };

  const endGame = () => {
    setGameStarted(false);
    const finalScore = score;
    const newGame = {
      id: Date.now(),
      score: finalScore,
      zone: selectedZone || 'center',
      date: new Date().toISOString().split('T')[0],
    };
    setGameHistory([...gameHistory, newGame]);
    
    Alert.alert(
      'Fim do Jogo!',
      `Sua pontuação: ${finalScore} pontos`,
      [
        { text: 'Jogar Novamente', onPress: startGame },
        { text: 'OK', style: 'cancel' }
      ]
    );
  };

  const generateNewTarget = () => {
    const randomZone = zones[Math.floor(Math.random() * zones.length)];
    setSelectedZone(randomZone.id);
    setTargetPosition({ x: randomZone.x, y: height * 0.3 });
    targetAnimation.setValue({ x: randomZone.x, y: height * 0.3 });
  };

  const shootBall = () => {
    if (!gameStarted || isShooting) return;

    setIsShooting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const targetZone = zones.find(zone => zone.id === selectedZone);
    const accuracy = calculateAccuracy();
    const points = calculatePoints(accuracy);

    setScore(score + points);

    // Animação da bola
    Animated.sequence([
      Animated.timing(ballAnimation, {
        toValue: { x: targetZone.x, y: height * 0.3 },
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(ballAnimation, {
        toValue: { x: width / 2, y: height * 0.7 },
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsShooting(false);
      generateNewTarget();
    });
  };

  const calculateAccuracy = () => {
    // Simular precisão baseada na posição do toque
    return Math.random() * 100;
  };

  const calculatePoints = (accuracy) => {
    if (accuracy >= 90) return 100;
    if (accuracy >= 80) return 80;
    if (accuracy >= 70) return 60;
    if (accuracy >= 60) return 40;
    if (accuracy >= 50) return 20;
    return 10;
  };

  const getZoneColor = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? zone.color : '#666';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Pontuação</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Ionicons name="time" size={20} color="#FFD700" />
            <Text style={styles.timeValue}>{timeLeft}s</Text>
          </View>
        </View>

        {/* Campo de Jogo */}
        <View style={styles.gameField}>
          {/* Gol */}
          <View style={styles.goal}>
            <View style={styles.goalPost} />
            <View style={styles.goalPost} />
            <View style={styles.goalBar} />
          </View>

          {/* Zonas de Chute */}
          <View style={styles.zonesContainer}>
            {zones.map((zone) => (
              <TouchableOpacity
                key={zone.id}
                style={[
                  styles.zone,
                  {
                    left: zone.x - 30,
                    backgroundColor: selectedZone === zone.id ? zone.color : 'rgba(255,255,255,0.2)',
                  }
                ]}
                onPress={() => setSelectedZone(zone.id)}
                disabled={!gameStarted}
              >
                <Text style={styles.zoneText}>{zone.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bola */}
          <Animated.View
            style={[
              styles.ball,
              {
                left: ballAnimation.x,
                top: ballAnimation.y,
              }
            ]}
          />

          {/* Alvo */}
          <Animated.View
            style={[
              styles.target,
              {
                left: targetAnimation.x - 15,
                top: targetAnimation.y - 15,
                backgroundColor: getZoneColor(selectedZone),
              }
            ]}
          />
        </View>

        {/* Controles */}
        <View style={styles.controls}>
          {!gameStarted ? (
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.startButtonGradient}
              >
                <Ionicons name="play" size={24} color="#000" />
                <Text style={styles.startButtonText}>INICIAR JOGO</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.shootButton}
              onPress={shootBall}
              disabled={isShooting}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E8E']}
                style={styles.shootButtonGradient}
              >
                <Ionicons name="football" size={24} color="#fff" />
                <Text style={styles.shootButtonText}>CHUTAR</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Histórico de Jogos */}
        {gameHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Últimos Jogos</Text>
            {gameHistory.slice(-3).map((game) => (
              <View key={game.id} style={styles.historyItem}>
                <Text style={styles.historyScore}>{game.score} pts</Text>
                <Text style={styles.historyZone}>{game.zone}</Text>
                <Text style={styles.historyDate}>{game.date}</Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  scoreValue: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValue: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  gameField: {
    flex: 1,
    position: 'relative',
  },
  goal: {
    position: 'absolute',
    top: 50,
    left: width / 2 - 50,
    width: 100,
    height: 80,
  },
  goalPost: {
    position: 'absolute',
    width: 4,
    height: 60,
    backgroundColor: '#fff',
    top: 0,
  },
  goalBar: {
    position: 'absolute',
    width: 100,
    height: 4,
    backgroundColor: '#fff',
    top: 60,
  },
  zonesContainer: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    height: 60,
  },
  zone: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  zoneText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ball: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
  },
  target: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  startButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  startButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  shootButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  shootButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  shootButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  historyTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyScore: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyZone: {
    color: '#ccc',
    fontSize: 12,
  },
  historyDate: {
    color: '#999',
    fontSize: 12,
  },
});
