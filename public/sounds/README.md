# 🎵 Arquivos de Som - Gol de Ouro

Este diretório contém os arquivos de áudio para os efeitos sonoros do jogo.

## 📁 Estrutura de Arquivos

### Sons de Resultado
- `goal.mp3` - Som de gol normal
- `miss.mp3` - Som de chute errado
- `golden-goal.mp3` - Som especial do Gol de Ouro

### Sons de Interface
- `button-click.mp3` - Som de clique em botão
- `button-hover.mp3` - Som de hover em botão
- `notification.mp3` - Som de notificação

### Sons de Jogo
- `queue-join.mp3` - Som de entrada na fila
- `queue-leave.mp3` - Som de saída da fila
- `game-start.mp3` - Som de início de partida
- `game-end.mp3` - Som de fim de partida

### Sons de Animação
- `ball-kick.mp3` - Som do chute da bola
- `goalkeeper-save.mp3` - Som de defesa do goleiro
- `crowd-cheer.mp3` - Som da torcida comemorando
- `crowd-disappoint.mp3` - Som da torcida decepcionada

## 🎯 Especificações Técnicas

- **Formato**: MP3
- **Qualidade**: 44.1kHz, 16-bit
- **Duração**: 1-3 segundos (exceto sons de torcida: 3-5 segundos)
- **Volume**: Normalizado para evitar distorção

## 📝 Notas de Implementação

- Os arquivos são carregados sob demanda
- Volume ajustável via controles de áudio
- Suporte a mute/desmute
- Preferências salvas no localStorage

## 🔧 Como Adicionar Novos Sons

1. Adicione o arquivo MP3 neste diretório
2. Atualize o hook `useSound.js` com o novo som
3. Integre o som nos componentes apropriados
4. Teste a funcionalidade

---

**Status**: ✅ Sistema de áudio implementado e funcionando
