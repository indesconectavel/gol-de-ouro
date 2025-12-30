# Lista de Áudios - Página Jogo (/game)

## Data: 2025-01-24

## Arquivos de Áudio Disponíveis

### Arquivos Definidos no `useSimpleSound.jsx`
1. **`kick.mp3`** - Som de chute da bola
2. **`kick_2.mp3`** - Som alternativo de chute (usado na defesa)
3. **`gol.mp3`** - Som de gol
4. **`defesa.mp3`** - Som de defesa do goleiro
5. **`vaia.mp3`** - Som de vaia (não usado atualmente)
6. **`torcida.mp3`** - Som de torcida (usado como música de fundo)
7. **`torcida_2.mp3`** - Som alternativo de torcida
8. **`click.mp3`** - Som de clique em botões
9. **`music.mp3`** - Música de fundo alternativa (não usado atualmente)

---

## Áudios Usados na Página Jogo

### 1. **playKickSound()** → `kick.mp3`
- **Quando**: Ao fazer um chute (antes de enviar para o backend)
- **Localização**: `handleShoot()` linha ~299
- **Uso**: Som de chute da bola

### 2. **playGoalSound()** → `gol.mp3` + `torcida.mp3`
- **Quando**: Quando marca um gol (não é Golden Goal)
- **Localização**: `handleShoot()` linha ~392
- **Uso**: 
  - Toca `gol.mp3` imediatamente
  - Toca `torcida.mp3` após 500ms
- **Adicional**: `playCrowdSound()` após 1500ms

### 3. **playDefenseSound()** → `kick_2.mp3` + `defesa.mp3`
- **Quando**: Quando o goleiro defende a bola
- **Localização**: `handleShoot()` linha ~429
- **Uso**: 
  - Toca `kick_2.mp3` imediatamente
  - Toca `defesa.mp3` após 200ms
- **Também usado**: Em erros (linha ~522)

### 4. **playButtonClick()** → `click.mp3`
- **Quando**: Ao clicar em botões interativos
- **Localizações**:
  - Botão de chute (linha ~285, ~290)
  - Botão de mudança de aposta (linha ~554)
  - Botão de dashboard (linha ~564)
  - Botão de recarregar (linha ~652)
  - Botão de chat (linha ~904)
- **Uso**: Feedback sonoro em interações

### 5. **playCelebrationSound()** → `gol.mp3` + `torcida_2.mp3`
- **Quando**: Quando marca um Golden Goal
- **Localização**: `handleShoot()` linha ~373
- **Uso**: 
  - Toca `gol.mp3` imediatamente
  - Toca `torcida_2.mp3` após 300ms
- **Adicional**: `playCrowdSound()` após 1000ms

### 6. **playCrowdSound()** → `torcida.mp3` ou `torcida_2.mp3`
- **Quando**: Após gols (normal e Golden Goal)
- **Localizações**: 
  - Após Golden Goal (linha ~374) - após 1000ms
  - Após gol normal (linha ~393) - após 1500ms
- **Uso**: Torcida adicional (aleatório entre `torcida.mp3` e `torcida_2.mp3`)

### 7. **playBackgroundMusic()** → `torcida.mp3` (loop)
- **Quando**: Inicia automaticamente após 2 segundos do carregamento da página
- **Localização**: `useEffect` linha ~148
- **Uso**: Música de fundo contínua (loop infinito)
- **Volume**: 40% do volume padrão (0.4)
- **Controle**: Pausa/resume quando o botão de áudio é clicado (mute/unmute)

---

## Resumo de Uso

| Função | Arquivo(s) | Quando | Volume |
|--------|-----------|--------|--------|
| `playKickSound()` | `kick.mp3` | Chute | 70% |
| `playGoalSound()` | `gol.mp3` + `torcida.mp3` | Gol normal | 70% |
| `playDefenseSound()` | `kick_2.mp3` + `defesa.mp3` | Defesa | 70% |
| `playButtonClick()` | `click.mp3` | Clique em botões | 70% |
| `playCelebrationSound()` | `gol.mp3` + `torcida_2.mp3` | Golden Goal | 70% |
| `playCrowdSound()` | `torcida.mp3` ou `torcida_2.mp3` | Após gols | 70% |
| `playBackgroundMusic()` | `torcida.mp3` (loop) | Música de fundo | 28% (0.4 × 70%) |

---

## Áudios NÃO Usados

- **`vaia.mp3`** - Não é usado (removido conforme solicitação)
- **`music.mp3`** - Não é usado (música de fundo alternativa)

---

## Controle de Áudio

- **Botão de Áudio**: Controla `isMuted` state
- **Quando mutado**: Todos os sons param, incluindo música de fundo
- **Quando desmutado**: Música de fundo retoma automaticamente (se estava tocando)

---

## Caminhos dos Arquivos

Todos os arquivos de áudio estão em: `/public/sounds/`

- `/sounds/kick.mp3`
- `/sounds/kick_2.mp3`
- `/sounds/gol.mp3`
- `/sounds/defesa.mp3`
- `/sounds/torcida.mp3`
- `/sounds/torcida_2.mp3`
- `/sounds/click.mp3`


