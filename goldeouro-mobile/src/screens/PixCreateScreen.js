// Pix Create Screen - Gol de Ouro Mobile v2.0.0
// Tela para criar pagamento PIX
// Data: 17/11/2025
// Status: FASE 2 - Importante
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../services/AuthService';
import GameService from '../services/GameService';

export default function PixCreateScreen({ navigation }) {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState(null);

  const valoresRapidos = [10, 20, 50, 100];

  const handleCreatePix = async () => {
    if (!isAuthenticated) {
      Alert.alert('Autenticação Necessária', 'Faça login para criar pagamento PIX');
      return;
    }

    const valorNum = parseFloat(valor);
    if (!valor || isNaN(valorNum) || valorNum < 1) {
      Alert.alert('Valor Inválido', 'Digite um valor mínimo de R$ 1,00');
      return;
    }

    if (valorNum > 1000) {
      Alert.alert('Valor Inválido', 'Valor máximo permitido: R$ 1.000,00');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await GameService.createPixPayment(valorNum);

      if (result.success && result.data) {
        setPixData(result.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Erro', result.error || 'Erro ao criar pagamento PIX');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('❌ [PIX] Erro ao criar pagamento:', error);
      Alert.alert('Erro', 'Erro ao criar pagamento PIX. Tente novamente.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (pixData?.pix_copy_paste) {
      await Clipboard.setStringAsync(pixData.pix_copy_paste);
      Alert.alert('Copiado!', 'Código PIX copiado para a área de transferência');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toFixed(2).replace('.', ',');
  };

  const formatValorInput = (text) => {
    // Remove tudo que não é número ou vírgula/ponto
    const cleaned = text.replace(/[^\d,.]/g, '');
    // Substitui vírgula por ponto
    const normalized = cleaned.replace(',', '.');
    setValor(normalized);
  };

  if (pixData) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d']}
          style={styles.background}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => {
                  setPixData(null);
                  setValor('');
                }}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FFD700" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Pagamento PIX</Text>
            </View>

            {/* QR Code Info */}
            <View style={styles.qrContainer}>
              <Ionicons name="qr-code-outline" size={80} color="#FFD700" />
              <Text style={styles.qrTitle}>Escaneie o QR Code</Text>
              <Text style={styles.qrSubtitle}>
                Ou copie o código PIX abaixo
              </Text>
            </View>

            {/* QR Code Image */}
            {pixData.qr_code_base64 && (
              <View style={styles.qrImageContainer}>
                <Text style={styles.qrImageLabel}>QR Code:</Text>
                {/* Nota: Para exibir imagem base64, usar componente de imagem apropriado */}
                <Text style={styles.qrImageNote}>
                  (QR Code será exibido aqui quando componente de imagem for configurado)
                </Text>
              </View>
            )}

            {/* PIX Copy Paste Code */}
            {pixData.pix_copy_paste && (
              <View style={styles.pixCodeContainer}>
                <Text style={styles.pixCodeLabel}>Código PIX:</Text>
                <View style={styles.pixCodeBox}>
                  <Text style={styles.pixCodeText} selectable>
                    {pixData.pix_copy_paste}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyPixCode}
                >
                  <Ionicons name="copy-outline" size={20} color="#FFD700" />
                  <Text style={styles.copyButtonText}>Copiar Código</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Payment Info */}
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Valor:</Text>
                <Text style={styles.infoValue}>
                  R$ {formatCurrency(pixData.valor || valor)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <Text style={[styles.infoValue, styles.statusPending]}>
                  {pixData.status || 'Pendente'}
                </Text>
              </View>
              {pixData.expires_at && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Expira em:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(pixData.expires_at).toLocaleString('pt-BR')}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.checkStatusButton}
                onPress={() => {
                  navigation.navigate('PixStatus', { paymentId: pixData.payment_id });
                }}
              >
                <LinearGradient
                  colors={['#4ECDC4', '#45B7D1']}
                  style={styles.checkStatusButtonGradient}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.checkStatusButtonText}>
                    Verificar Status
                  </Text>
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
                            const result = await GameService.cancelPixPayment(pixData.payment_id);
                            if (result.success) {
                              Alert.alert('Sucesso', 'Pagamento cancelado com sucesso');
                              setPixData(null);
                              setValor('');
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFD700" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Criar Pagamento PIX</Text>
          </View>

          {/* User Info */}
          <View style={styles.userInfoContainer}>
            <Ionicons name="person-circle" size={48} color="#FFD700" />
            <Text style={styles.userName}>{user?.username || 'Usuário'}</Text>
            <Text style={styles.userBalance}>
              Saldo atual: R$ {user?.saldo?.toFixed(2) || '0,00'}
            </Text>
          </View>

          {/* Valor Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Valor (R$)</Text>
            <View style={styles.inputRow}>
              <Text style={styles.currencySymbol}>R$</Text>
              <TextInput
                style={styles.valorInput}
                placeholder="0,00"
                placeholderTextColor="#888"
                value={valor}
                onChangeText={formatValorInput}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <Text style={styles.inputHint}>
              Valor mínimo: R$ 1,00 | Valor máximo: R$ 1.000,00
            </Text>
          </View>

          {/* Valores Rápidos */}
          <View style={styles.quickValuesContainer}>
            <Text style={styles.quickValuesLabel}>Valores Rápidos:</Text>
            <View style={styles.quickValuesRow}>
              {valoresRapidos.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={styles.quickValueButton}
                  onPress={() => setValor(v.toString())}
                >
                  <Text style={styles.quickValueText}>R$ {v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreatePix}
            disabled={loading || !valor}
          >
            <LinearGradient
              colors={loading || !valor ? ['#666', '#555'] : ['#FFD700', '#FFA500']}
              style={styles.createButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Ionicons name="qr-code" size={24} color="#000" />
                  <Text style={styles.createButtonText}>Gerar QR Code PIX</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
  userInfoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  userBalance: {
    color: '#FFD700',
    fontSize: 16,
    marginTop: 5,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: '#333',
  },
  currencySymbol: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10,
  },
  valorInput: {
    flex: 1,
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 15,
  },
  inputHint: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  quickValuesContainer: {
    marginBottom: 30,
  },
  quickValuesLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
  },
  quickValuesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickValueButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
  },
  quickValueText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  createButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  qrTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  qrSubtitle: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
  },
  qrImageContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  qrImageLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  qrImageNote: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  pixCodeContainer: {
    marginBottom: 30,
  },
  pixCodeLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  pixCodeBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 15,
  },
  pixCodeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  copyButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  statusPending: {
    color: '#FFD700',
  },
  actionsContainer: {
    gap: 15,
  },
  checkStatusButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  checkStatusButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  checkStatusButtonText: {
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
});

