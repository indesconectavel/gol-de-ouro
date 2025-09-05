import React, { useState, useEffect } from 'react'
import useSimpleSound from '../hooks/useSimpleSound'

const AudioTest = () => {
  const [audioContext, setAudioContext] = useState(null)
  const [isSupported, setIsSupported] = useState(false)
  const [testResults, setTestResults] = useState({})
  
  const {
    playKickSound,
    playGoalSound,
    playMissSound,
    playDefenseSound,
    playButtonClick,
    playHoverSound,
    playCelebrationSound,
    playCrowdSound,
    playBackgroundMusic,
    isMuted,
    volume
  } = useSimpleSound()

  useEffect(() => {
    // Verificar suporte a AudioContext
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      setAudioContext(ctx)
      setIsSupported(true)
    } catch (error) {
      console.error('AudioContext não suportado:', error)
      setIsSupported(false)
    }
  }, [])

  const testAudioFile = (filename) => {
    return new Promise((resolve) => {
      const audio = new Audio(`/sounds/${filename}`)
      audio.onload = () => resolve({ success: true, error: null })
      audio.onerror = (error) => resolve({ success: false, error: error.message })
      audio.oncanplaythrough = () => resolve({ success: true, error: null })
      
      // Timeout após 3 segundos
      setTimeout(() => resolve({ success: false, error: 'Timeout' }), 3000)
      
      audio.load()
    })
  }

  const runTests = async () => {
    const files = ['kick.mp3', 'gol.mp3', 'defesa.mp3', 'vaia.mp3', 'torcida.mp3', 'click.mp3', 'music.mp3']
    const results = {}
    
    for (const file of files) {
      const result = await testAudioFile(file)
      results[file] = result
    }
    
    setTestResults(results)
  }

  const testSyntheticSound = () => {
    try {
      if (audioContext) {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)
        
        return true
      }
    } catch (error) {
      console.error('Erro no som sintético:', error)
      return false
    }
    return false
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/80 backdrop-blur-lg rounded-lg p-4 max-w-md">
      <h3 className="text-white font-bold mb-4">🔧 Teste de Áudio</h3>
      
      {/* Status do sistema */}
      <div className="mb-4 space-y-2">
        <div className="text-sm text-white/80">
          AudioContext: {isSupported ? '✅ Suportado' : '❌ Não suportado'}
        </div>
        <div className="text-sm text-white/80">
          Muted: {isMuted ? '🔇 Sim' : '🔊 Não'}
        </div>
        <div className="text-sm text-white/80">
          Volume: {Math.round(volume * 100)}%
        </div>
      </div>

      {/* Teste de arquivos */}
      <div className="mb-4">
        <button
          onClick={runTests}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded mb-2"
        >
          🧪 Testar Arquivos de Áudio
        </button>
        
        {Object.keys(testResults).length > 0 && (
          <div className="text-xs space-y-1">
            {Object.entries(testResults).map(([file, result]) => (
              <div key={file} className={result.success ? 'text-green-400' : 'text-red-400'}>
                {file}: {result.success ? '✅' : `❌ ${result.error}`}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teste de sons sintéticos */}
      <div className="mb-4">
        <button
          onClick={testSyntheticSound}
          className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded mb-2"
        >
          🎵 Testar Som Sintético
        </button>
      </div>

      {/* Teste de funções */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button onClick={playKickSound} className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded">
          Kick
        </button>
        <button onClick={playGoalSound} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded">
          Gol
        </button>
        <button onClick={playMissSound} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">
          Miss
        </button>
        <button onClick={playDefenseSound} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded">
          Defesa
        </button>
        <button onClick={playButtonClick} className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded">
          Click
        </button>
        <button onClick={playHoverSound} className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded">
          Hover
        </button>
        <button onClick={playCrowdSound} className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded">
          Torcida
        </button>
        <button onClick={playBackgroundMusic} className="bg-pink-500 hover:bg-pink-600 text-white px-2 py-1 rounded">
          Música
        </button>
      </div>
    </div>
  )
}

export default AudioTest
