# 🎵 Mapeamento de Sons Implementado

## 📁 Arquivos de Áudio Mapeados

### 🎯 **Sons de Ação do Jogo**

| Arquivo | Uso no Jogo | Momento | Variação |
|---------|-------------|---------|----------|
| `kick.mp3` | Chute da bola | Ao clicar nas zonas | 50% das vezes |
| `kick_2.mp3` | Chute alternativo | Ao clicar nas zonas | 50% das vezes |
| `gol.mp3` | Som de gol | Quando marca gol | + torcida após 500ms |
| `defesa.mp3` | Defesa do goleiro | Quando goleiro defende | 30% das vezes |
| `vaia.mp3` | Vaia da torcida | Quando erra o chute | 70% das vezes |

### 🎉 **Sons de Ambiente**

| Arquivo | Uso no Jogo | Momento | Variação |
|---------|-------------|---------|----------|
| `torcida.mp3` | Torcida animada | Após gol + aleatório | 50% das vezes |
| `torcida_2.mp3` | Torcida alternativa | Após gol + aleatório | 50% das vezes |
| `music.mp3` | Música de fundo | Início do jogo | Quando jogo começa |

### 🔘 **Sons de Interface**

| Arquivo | Uso no Jogo | Momento | Variação |
|---------|-------------|---------|----------|
| `click.mp3` | Clique de botão | Botões e hover | Sempre |

## 🎮 **Experiência de Jogo Criada**

### **Fluxo Sonoro Dinâmico:**

1. **Início do Jogo:**
   - Música de fundo suave toca após 1 segundo

2. **Durante o Jogo:**
   - Torcida aleatória (20% chance) quando esperando
   - Torcida quando outros jogadores entram (50% chance)

3. **Ao Chutar:**
   - Som de chute (kick.mp3 ou kick_2.mp3) - variação aleatória
   - Som de hover ao passar mouse nas zonas

4. **Resultado - Gol:**
   - Som de gol (gol.mp3)
   - Torcida após 500ms (torcida.mp3 ou torcida_2.mp3)

5. **Resultado - Erro:**
   - 70% chance: Vaia (vaia.mp3)
   - 30% chance: Som de defesa (defesa.mp3)

6. **Interface:**
   - Clique em botões (click.mp3)
   - Hover nas zonas (click.mp3)

## 🎛️ **Controles de Som**

### **Interface Básica:**
- Botão de mute/desmute
- Controle de volume (0-100%)

### **Interface Avançada:**
- Testar torcida
- Testar música de fundo
- Controles expandidos

## 🔧 **Sistema Híbrido**

### **Fallback Automático:**
1. **Primeiro**: Tenta tocar arquivo MP3 real
2. **Se falhar**: Usa som sintético via Web Audio API
3. **Se não existir**: Usa som sintético

### **Vantagens:**
- ✅ **Funciona sempre** - nunca falha
- ✅ **Sons reais** quando disponíveis
- ✅ **Fallback inteligente** quando necessário
- ✅ **Performance otimizada** - carregamento sob demanda

## 🎯 **Momentos de Imersão**

### **Alta Imersão:**
- Gol + torcida dupla
- Música de fundo contínua
- Variação de sons de chute

### **Feedback Imediato:**
- Som de hover nas zonas
- Clique em botões
- Som de chute instantâneo

### **Ambiente Realista:**
- Torcida aleatória
- Variação entre vaia e defesa
- Música de fundo no início

## 📊 **Estatísticas de Uso**

- **kick.mp3**: 50% dos chutes
- **kick_2.mp3**: 50% dos chutes
- **gol.mp3**: 100% dos gols
- **defesa.mp3**: 30% dos erros
- **vaia.mp3**: 70% dos erros
- **torcida.mp3**: 50% das torcidas
- **torcida_2.mp3**: 50% das torcidas

## 🚀 **Próximas Melhorias Sugeridas**

1. **Sons de Transição**: Entre estados do jogo
2. **Sons de Conquista**: Para marcos específicos
3. **Sons de Pressão**: Quando tempo está acabando
4. **Sons de Vitória**: Para partidas completas
5. **Sons de Derrota**: Para partidas perdidas

## 🎵 **Testando os Sons**

1. **Acesse**: `http://localhost:5174/game`
2. **Use os controles** no canto superior direito
3. **Teste cada ação** para ouvir os sons
4. **Use controles avançados** para testar individualmente

O sistema está completamente funcional e oferece uma experiência sonora rica e dinâmica!
