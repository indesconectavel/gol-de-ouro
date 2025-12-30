import { useState, useRef, useCallback, useEffect } from 'react'

const useSimpleSound = () => {
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const audioRefs = useRef({})

  // Lista de arquivos de áudio
  const soundFiles = {
    kick: '/sounds/kick.mp3',
    kick2: '/sounds/kick_2.mp3',
    goal: '/sounds/gol.mp3',
    defesa: '/sounds/defesa.mp3',
    vaia: '/sounds/vaia.mp3',
    torcida: '/sounds/torcida.mp3',
    torcida2: '/sounds/torcida_2.mp3',
    click: '/sounds/click.mp3'
    // music.mp3 removido - estava atrapalhando
  }

  // Função para tocar som
  const playSound = useCallback((soundKey) => {
    if (isMuted) return

    console.log(`🎵 Tocando: ${soundKey}`)

    // Se já existe uma instância tocando, para ela
    if (audioRefs.current[soundKey]) {
      audioRefs.current[soundKey].pause()
      audioRefs.current[soundKey].currentTime = 0
    }

    // Cria nova instância
    const audio = new Audio(soundFiles[soundKey])
    audio.volume = volume
    audioRefs.current[soundKey] = audio

    audio.play().then(() => {
      console.log(`✅ Som tocado: ${soundKey}`)
    }).catch(error => {
      console.warn(`❌ Erro ao tocar ${soundKey}:`, error)
    })
  }, [isMuted, volume])

  // Sons específicos
  const playKickSound = useCallback(() => {
    // Som de chute - usar apenas kick.mp3
    playSound('kick')
  }, [playSound])

  const playGoalSound = useCallback(() => {
    playSound('goal')
    setTimeout(() => playSound('torcida'), 500)
  }, [playSound])

  const playMissSound = useCallback(() => {
    const useDefense = Math.random() > 0.7
    playSound(useDefense ? 'defesa' : 'vaia')
  }, [playSound])

  const playDefenseSound = useCallback(() => {
    // CORREÇÃO: kick_2.mp3 deve ser usado quando o goleiro defende
    playSound('kick2') // Som de defesa do goleiro (kick_2.mp3)
    setTimeout(() => playSound('defesa'), 200) // Som adicional de defesa após 200ms
  }, [playSound])

  const playButtonClick = useCallback(() => {
    playSound('click')
  }, [playSound])

  const playHoverSound = useCallback(() => {
    playSound('click')
  }, [playSound])

  const playCelebrationSound = useCallback(() => {
    playSound('goal')
    setTimeout(() => playSound('torcida2'), 300)
  }, [playSound])

  const playCrowdSound = useCallback(() => {
    const useTorcida2 = Math.random() > 0.5
    playSound(useTorcida2 ? 'torcida2' : 'torcida')
  }, [playSound])

  const playBackgroundMusic = useCallback(() => {
    // Criar instância de áudio para música de fundo com loop usando torcida.mp3
    // Usar chave única 'background-torcida' para não conflitar com outros usos de torcida
    if (isMuted) {
      // Se estiver mutado, parar música se estiver tocando
      if (audioRefs.current['background-torcida']) {
        audioRefs.current['background-torcida'].pause()
        audioRefs.current['background-torcida'].currentTime = 0
      }
      return
    }
    
    // Se já existe música tocando, não criar nova
    if (audioRefs.current['background-torcida'] && !audioRefs.current['background-torcida'].paused) {
      return
    }
    
    const audio = new Audio(soundFiles.torcida)
    audio.volume = volume * 0.4 // Volume mais baixo para música de fundo
    audio.loop = true
    audioRefs.current['background-torcida'] = audio
    
    audio.play().then(() => {
      console.log('🎵 Música de fundo (torcida) iniciada')
    }).catch(error => {
      console.warn('❌ Erro ao tocar música de fundo:', error)
    })
  }, [isMuted, volume])
  
  // Parar música de fundo quando mutar e retomar quando desmutar
  useEffect(() => {
    if (audioRefs.current['background-torcida']) {
      if (isMuted) {
        // Parar música quando mutar
        audioRefs.current['background-torcida'].pause()
      } else {
        // Retomar música quando desmutar (se estava tocando)
        if (audioRefs.current['background-torcida'].currentTime > 0) {
          audioRefs.current['background-torcida'].play().catch(error => {
            console.warn('❌ Erro ao retomar música de fundo:', error)
          })
        }
      }
    }
  }, [isMuted])

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted)
  }, [isMuted])

  const setSoundVolume = useCallback((newVolume) => {
    const vol = Math.max(0, Math.min(1, newVolume))
    setVolume(vol)
  }, [])

  return {
    isMuted,
    volume,
    playKickSound,
    playGoalSound,
    playMissSound,
    playDefenseSound,
    playButtonClick,
    playHoverSound,
    playCelebrationSound,
    playCrowdSound,
    playBackgroundMusic,
    toggleMute,
    setSoundVolume
  }
}

export default useSimpleSound
