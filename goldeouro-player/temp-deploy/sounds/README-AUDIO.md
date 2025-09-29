# 🎵 Instruções para Arquivos de Áudio

## 📁 Onde Colocar os Arquivos

Coloque os arquivos de áudio **diretamente nesta pasta** (`public/sounds/`):

```
goldeouro-player/public/sounds/
├── kick.mp3          ← Som de chute da bola
├── goal.mp3          ← Som de gol/celebração
├── miss.mp3          ← Som de erro/defesa
├── hover.mp3         ← Som de hover nas zonas
├── click.mp3         ← Som de clique nos botões
└── celebration.mp3   ← Som de celebração (opcional)
```

## 🎯 Especificações Recomendadas

### Formato e Qualidade
- **Formato**: MP3 (recomendado) ou WAV
- **Qualidade**: 128kbps ou superior
- **Duração**: 0.5-2 segundos (sons curtos)
- **Tamanho**: Máximo 100KB por arquivo

### Nomes dos Arquivos
- **kick.mp3** - Som de chute da bola
- **goal.mp3** - Som de gol/celebração
- **miss.mp3** - Som de erro/defesa
- **hover.mp3** - Som de hover (muito curto, ~0.1s)
- **click.mp3** - Som de clique (muito curto, ~0.1s)
- **celebration.mp3** - Som de celebração (opcional)

## 🔄 Sistema Híbrido

O sistema funciona da seguinte forma:

1. **Primeiro**: Tenta tocar o arquivo de áudio real
2. **Se falhar**: Usa som sintético como fallback
3. **Se não existir**: Usa som sintético

## 📥 Onde Conseguir os Sons

### Sites Gratuitos
- **Freesound.org** - https://freesound.org/
- **Zapsplat.com** - https://www.zapsplat.com/ (gratuito com cadastro)
- **BBC Sound Effects** - https://sound-effects.bbcrewind.co.uk/
- **YouTube Audio Library** - https://www.youtube.com/audiolibrary/music

### Termos de Busca
- "soccer kick sound"
- "football goal sound"
- "ball bounce sound"
- "button click sound"
- "hover sound effect"

## 🧪 Testando

1. Adicione os arquivos na pasta `public/sounds/`
2. Acesse o jogo em `http://localhost:5174/game`
3. Teste as ações para ouvir os sons
4. Use os controles de som no canto superior direito

## ⚠️ Importante

- **Não renomeie** os arquivos - use exatamente os nomes especificados
- **Mantenha** os arquivos nesta pasta (`public/sounds/`)
- **Teste** cada som individualmente
- **Otimize** o tamanho dos arquivos para melhor performance

## 🔧 Fallback

Se algum arquivo não existir ou falhar ao carregar, o sistema automaticamente usará sons sintéticos gerados via Web Audio API.
