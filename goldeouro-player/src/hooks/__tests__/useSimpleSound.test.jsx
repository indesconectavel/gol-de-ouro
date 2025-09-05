import { renderHook, act } from '@testing-library/react'
import useSimpleSound from '../useSimpleSound'

// Mock do Audio
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  volume: 1,
  loop: false
}

global.Audio = jest.fn(() => mockAudio)

describe('useSimpleSound Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('initializes with correct default values', () => {
    const { result } = renderHook(() => useSimpleSound())
    
    expect(result.current.isMuted).toBe(false)
    expect(result.current.volume).toBe(1)
  })

  test('playButtonClick plays correct sound', () => {
    const { result } = renderHook(() => useSimpleSound())
    
    act(() => {
      result.current.playButtonClick()
    })
    
    expect(global.Audio).toHaveBeenCalledWith('/sounds/button-click.mp3')
    expect(mockAudio.play).toHaveBeenCalled()
  })

  test('playCelebrationSound plays correct sound', () => {
    const { result } = renderHook(() => useSimpleSound())
    
    act(() => {
      result.current.playCelebrationSound()
    })
    
    expect(global.Audio).toHaveBeenCalledWith('/sounds/celebration.mp3')
    expect(mockAudio.play).toHaveBeenCalled()
  })

  test('playCrowdSound plays correct sound', () => {
    const { result } = renderHook(() => useSimpleSound())
    
    act(() => {
      result.current.playCrowdSound()
    })
    
    expect(global.Audio).toHaveBeenCalledWith('/sounds/crowd.mp3')
    expect(mockAudio.play).toHaveBeenCalled()
  })

  test('playBackgroundMusic plays correct sound with loop', () => {
    const { result } = renderHook(() => useSimpleSound())
    
    act(() => {
      result.current.playBackgroundMusic()
    })
    
    expect(global.Audio).toHaveBeenCalledWith('/sounds/background.mp3')
    expect(mockAudio.loop).toBe(true)
    expect(mockAudio.play).toHaveBeenCalled()
  })

  test('toggleMute changes mute state', () => {
    const { result } = renderHook(() => useSimpleSound())
    
    expect(result.current.isMuted).toBe(false)
    
    act(() => {
      result.current.toggleMute()
    })
    
    expect(result.current.isMuted).toBe(true)
    
    act(() => {
      result.current.toggleMute()
    })
    
    expect(result.current.isMuted).toBe(false)
  })

  test('setSoundVolume updates volume', () => {
    const { result } = renderHook(() => useSimpleSound())
    
    act(() => {
      result.current.setSoundVolume(0.5)
    })
    
    expect(result.current.volume).toBe(0.5)
  })

  test('setSoundVolume clamps volume between 0 and 1', () => {
    const { result } = renderHook(() => useSimpleSound())
    
    act(() => {
      result.current.setSoundVolume(1.5)
    })
    
    expect(result.current.volume).toBe(1)
    
    act(() => {
      result.current.setSoundVolume(-0.5)
    })
    
    expect(result.current.volume).toBe(0)
  })
})
