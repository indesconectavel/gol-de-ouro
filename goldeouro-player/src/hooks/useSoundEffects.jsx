import { useState, useEffect, useRef } from 'react'

const useSoundEffects = () => {
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const audioContextRef = useRef(null)
  const soundsRef = useRef({})
  const audioFilesRef = useRef({})

  // Lista de arquivos de áudio mapeados para máxima imersão
  const soundFiles = {
    // Sons de ação do jogo
    kick: '/sounds/kick.mp3',           // Chute principal
    kick2: '/sounds/kick_2.mp3',        // Chute alternativo (mais forte)
    goal: '/sounds/gol.mp3',            // Som de gol
    defesa: '/sounds/defesa.mp3',       // Som de defesa do goleiro
    vaia: '/sounds/vaia.mp3',           // Som de vaia (erro/defesa)
    
    // Sons de ambiente
    torcida: '/sounds/torcida.mp3',     // Torcida animada
    torcida2: '/sounds/torcida_2.mp3',  // Torcida alternativa
    
    // Sons de interface
    click: '/sounds/click.mp3',         // Clique de botão
    hover: '/sounds/click.mp3'          // Hover (reutiliza click)
  }

  // Inicializar AudioContext após interação do usuário
  const initializeAudioContext = () => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
        
        // Se o contexto estiver suspenso, tentar resumir
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            console.log('✅ AudioContext resumido com sucesso')
          }).catch(error => {
            console.warn('❌ Erro ao resumir AudioContext:', error)
          })
        }
        
        console.log('✅ AudioContext inicializado com sucesso')
      } catch (error) {
        console.warn('❌ AudioContext não suportado:', error)
      }
    }
  }

  // Inicializar AudioContext no primeiro clique ou toque
  useEffect(() => {
    const handleFirstInteraction = () => {
      initializeAudioContext()
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
    }
    
    document.addEventListener('click', handleFirstInteraction)
    document.addEventListener('touchstart', handleFirstInteraction)
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('touchstart', handleFirstInteraction)
    }
  }, [])

  // Pré-carregar arquivos de áudio
  useEffect(() => {
    console.log('🔄 Iniciando pré-carregamento de arquivos de áudio...')
    
    Object.entries(soundFiles).forEach(([key, src]) => {
      console.log(`📥 Carregando: ${key} -> ${src}`)
      const audio = new Audio(src)
      audio.preload = 'auto'
      audio.volume = volume
      
      audio.addEventListener('canplaythrough', () => {
        console.log(`✅ Arquivo carregado: ${key}`)
      })
      
      audio.addEventListener('error', (error) => {
        console.warn(`❌ Erro ao carregar ${key}:`, error)
      })
      
      audioFilesRef.current[key] = audio
    })
    
    console.log('📁 Arquivos de áudio configurados:', Object.keys(audioFilesRef.current))
  }, [volume])

  // Função para tocar som de arquivo
  const playAudioFile = (soundKey) => {
    console.log(`🎵 Tentando tocar: ${soundKey}`, { isMuted, volume })
    
    if (isMuted) {
      console.log('🔇 Som mutado, não tocando')
      return
    }

    // Garantir que AudioContext está inicializado
    initializeAudioContext()

    const audio = audioFilesRef.current[soundKey]
    if (audio) {
      console.log(`📁 Arquivo encontrado: ${soundKey}`)
      audio.currentTime = 0
      audio.volume = volume
      audio.play().then(() => {
        console.log(`✅ Som tocado com sucesso: ${soundKey}`)
      }).catch(error => {
        console.warn(`❌ Erro ao tocar ${soundKey}:`, error)
        // Fallback para som sintético
        playSyntheticSound(soundKey)
      })
    } else {
      console.log(`⚠️ Arquivo não encontrado: ${soundKey}, usando fallback`)
      // Fallback para som sintético
      playSyntheticSound(soundKey)
    }
  }

  // Função para criar sons sintéticos (fallback)
  const createSound = (frequency, duration, type = 'sine', volume = 0.3) => {
    // Garantir que AudioContext está inicializado
    initializeAudioContext()
    
    if (!audioContextRef.current || isMuted) return

    const oscillator = audioContextRef.current.createOscillator()
    const gainNode = audioContextRef.current.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContextRef.current.destination)
    
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime)
    oscillator.type = type
    
    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume * volume, audioContextRef.current.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration)
    
    oscillator.start(audioContextRef.current.currentTime)
    oscillator.stop(audioContextRef.current.currentTime + duration)
  }

  // Sons sintéticos como fallback
  const playSyntheticSound = (soundKey) => {
    switch (soundKey) {
      case 'kick':
        createSound(800, 0.3, 'sawtooth', 0.4)
        setTimeout(() => createSound(400, 0.2, 'sine', 0.2), 50)
        break
      case 'goal':
        createSound(523, 0.2, 'sine', 0.3)
        setTimeout(() => createSound(659, 0.2, 'sine', 0.3), 100)
        setTimeout(() => createSound(784, 0.3, 'sine', 0.4), 200)
        setTimeout(() => createSound(1047, 0.5, 'sine', 0.5), 300)
        break
      case 'miss':
        createSound(200, 0.4, 'sawtooth', 0.3)
        setTimeout(() => createSound(150, 0.3, 'sine', 0.2), 100)
        break
      case 'hover':
        createSound(1200, 0.05, 'sine', 0.1)
        break
      case 'click':
        createSound(1000, 0.1, 'square', 0.2)
        break
      case 'celebration':
        const notes = [523, 659, 784, 1047, 1319]
        notes.forEach((freq, index) => {
          setTimeout(() => createSound(freq, 0.3, 'sine', 0.3), index * 150)
        })
        break
    }
  }

  // Efeitos sonoros específicos com variação dinâmica
  const playKickSound = () => {
    // Alterna entre os dois sons de chute para variedade
    const useKick2 = Math.random() > 0.5
    playAudioFile(useKick2 ? 'kick2' : 'kick')
  }

  const playGoalSound = () => {
    playAudioFile('goal')
    // Toca torcida após o gol
    setTimeout(() => playAudioFile('torcida'), 500)
  }

  const playMissSound = () => {
    // Toca vaia quando erra
    playAudioFile('vaia')
  }

  const playDefenseSound = () => {
    // Som específico de defesa do goleiro
    playAudioFile('defesa')
  }

  const playButtonClick = () => {
    playAudioFile('click')
  }

  const playHoverSound = () => {
    playAudioFile('hover')
  }

  const playCelebrationSound = () => {
    // Toca gol + torcida para celebração
    playAudioFile('goal')
    setTimeout(() => playAudioFile('torcida2'), 300)
  }

  const playCrowdSound = () => {
    // Toca torcida aleatória
    const useTorcida2 = Math.random() > 0.5
    playAudioFile(useTorcida2 ? 'torcida2' : 'torcida')
  }

  const playWhistleSound = () => {
    createSound(2000, 0.5, 'sine', 0.4)
    setTimeout(() => createSound(1500, 0.3, 'sine', 0.3), 200)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const setSoundVolume = (newVolume) => {
    const vol = Math.max(0, Math.min(1, newVolume))
    setVolume(vol)
    
    // Atualizar volume de todos os arquivos de áudio
    Object.values(audioFilesRef.current).forEach(audio => {
      if (audio) audio.volume = vol
    })
  }

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
    playWhistleSound,
    toggleMute,
    setSoundVolume
  }
}

export default useSoundEffects