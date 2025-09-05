import { useState, useRef, useCallback } from 'react'

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
    click: '/sounds/click.mp3',
    music: '/sounds/music.mp3'
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
    const useKick2 = Math.random() > 0.5
    playSound(useKick2 ? 'kick2' : 'kick')
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
    playSound('defesa')
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
    playSound('music')
  }, [playSound])

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
