# 🎮 API de Jogos - Fase 3

## 📋 **Visão Geral**

Sistema de jogos com 5 opções de chute, fila de 10 jogadores, apostas de R$ 1,00 e distribuição de prêmios 50/50.

---

## 🎯 **Regras do Jogo**

### 💰 **Sistema de Apostas**
- **Valor mínimo**: R$ 1,00 para entrar na fila
- **Aposta por partida**: R$ 1,00 por jogador
- **Total por partida**: R$ 10,00 (10 jogadores × R$ 1,00)
- **Distribuição**: 50% para o vencedor (R$ 5,00) + 50% para o jogo (R$ 5,00)

### 🎮 **Mecânica do Jogo**
- **Fila**: 10 jogadores por partida
- **Vencedor**: Definido aleatoriamente ANTES da partida começar
- **Chutes**: Todos os 10 jogadores chutam, mas apenas 1 marca gol
- **5 Opções de chute**: Cantos + centro do gol
- **Fluidez**: Jogador pode sair e entrar em nova partida após chutar

---

## 🔗 **Endpoints**

### 🎯 **Entrar na Fila**
```http
POST /api/games/fila/entrar
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 1
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Entrou na fila na posição 3",
  "data": {
    "game_id": 123,
    "position": 3,
    "players_count": 3,
    "game_status": "waiting"
  }
}
```

### 📊 **Status da Fila**
```http
POST /api/games/fila/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 1
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "game_id": 123,
    "position": 3,
    "status": "waiting",
    "game_status": "active",
    "players_count": 10,
    "ja_chutou": false,
    "is_winner": false,
    "game_started_at": "2025-01-02T10:30:00Z"
  }
}
```

### 🎯 **Opções de Chute**
```http
GET /api/games/opcoes-chute
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Canto Superior Esquerdo",
      "description": "Chute no canto superior esquerdo",
      "position_x": 20,
      "position_y": 20,
      "difficulty_level": 2
    },
    {
      "id": 2,
      "name": "Canto Superior Direito",
      "description": "Chute no canto superior direito",
      "position_x": 80,
      "position_y": 20,
      "difficulty_level": 2
    },
    {
      "id": 3,
      "name": "Centro Superior",
      "description": "Chute no centro superior",
      "position_x": 50,
      "position_y": 15,
      "difficulty_level": 1
    },
    {
      "id": 4,
      "name": "Canto Inferior Esquerdo",
      "description": "Chute no canto inferior esquerdo",
      "position_x": 20,
      "position_y": 80,
      "difficulty_level": 3
    },
    {
      "id": 5,
      "name": "Canto Inferior Direito",
      "description": "Chute no canto inferior direito",
      "position_x": 80,
      "position_y": 80,
      "difficulty_level": 3
    }
  ]
}
```

### ⚽ **Executar Chute**
```http
POST /api/games/chutar
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 1,
  "game_id": 123,
  "shot_option_id": 3
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "GOL! Você marcou e ganhou R$ 5,00!",
  "data": {
    "is_goal": true,
    "is_winner": true,
    "prize": 5.00,
    "shots_count": 1,
    "game_finished": false
  }
}
```

### 📚 **Histórico de Jogos**
```http
POST /api/games/historico
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 1
}
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "game_id": 123,
      "game_date": "2025-01-02T10:30:00Z",
      "game_status": "finished",
      "shot_option_id": 3,
      "shot_option_name": "Centro Superior",
      "was_goal": true,
      "was_winner": true,
      "shot_time": "2025-01-02T10:35:00Z"
    }
  ]
}
```

### 📊 **Estatísticas (Admin)**
```http
GET /api/games/estatisticas
Authorization: Bearer <token>
x-admin-token: <admin_token>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "total_games": 150,
    "total_players": 1200,
    "total_prizes": 750.00,
    "total_bets": 1500.00
  }
}
```

---

## 🎬 **Sistema de Animações**

### 📱 **Tipos de Animação**
1. **Animação da Bola**: Durante o chute
2. **Animação do Goleiro**: Defendendo ou não
3. **Animação de Erro**: Quando não marca gol
4. **Animação de Gol**: Quando marca gol

### 🎯 **Fluxo de Animações**
1. Jogador seleciona opção de chute
2. Animação da bola se movendo
3. Animação do goleiro tentando defender
4. Resultado: Gol ou Erro
5. Animação de celebração ou frustração

---

## 🗄️ **Estrutura do Banco**

### 📊 **Tabelas Principais**
- **`games`**: Partidas com vencedor pré-definido
- **`queue_board`**: Fila de jogadores
- **`shot_options`**: 5 opções de chute
- **`player_shots`**: Chutes dos jogadores
- **`game_animations`**: Dados das animações

### 🔄 **Fluxo de Dados**
1. Jogador entra na fila → `queue_board`
2. 10 jogadores → Partida criada → `games`
3. Vencedor selecionado → `games.winner_user_id`
4. Jogador chuta → `player_shots`
5. Resultado processado → Saldo atualizado

---

## 🚀 **Como Usar**

### 1. **Atualizar Banco de Dados**
```bash
npm run db:update-phase3
```

### 2. **Testar Sistema**
```bash
npm run test:games
```

### 3. **Iniciar Servidor**
```bash
npm run dev
```

---

## 🎯 **Próximos Passos**

1. **Frontend**: Implementar interface de jogo
2. **WebSockets**: Atualizações em tempo real
3. **Animações**: Sistema de animações
4. **Notificações**: Push notifications
5. **Mobile**: App iOS/Android

---

*Sistema de jogos implementado com sucesso! 🎮*
