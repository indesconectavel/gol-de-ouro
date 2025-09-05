import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import GameField from '../GameField'

// Mock do useSimpleSound
jest.mock('../../hooks/useSimpleSound', () => ({
  __esModule: true,
  default: () => ({
    playButtonClick: jest.fn(),
    playCelebrationSound: jest.fn(),
    playCrowdSound: jest.fn(),
    playBackgroundMusic: jest.fn(),
  })
}))

describe('GameField Component', () => {
  const mockProps = {
    goalZones: [
      { id: 1, name: 'Canto Superior Esquerdo', x: 15, y: 15, multiplier: 2.0, difficulty: 'hard' },
      { id: 2, name: 'Canto Superior Direito', x: 85, y: 15, multiplier: 2.0, difficulty: 'hard' },
      { id: 3, name: 'Centro Superior', x: 50, y: 20, multiplier: 1.5, difficulty: 'medium' },
    ],
    onShoot: jest.fn(),
    isShooting: false,
    selectedZone: null,
    gameResult: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders game field with goal zones', () => {
    render(<GameField {...mockProps} />)
    
    // Verifica se o campo de jogo está presente
    expect(screen.getByTestId('game-field')).toBeInTheDocument()
    
    // Verifica se as zonas de gol estão presentes
    mockProps.goalZones.forEach(zone => {
      expect(screen.getByTestId(`zone-${zone.id}`)).toBeInTheDocument()
    })
  })

  test('calls onShoot when zone is clicked', () => {
    render(<GameField {...mockProps} />)
    
    const zone1 = screen.getByTestId('zone-1')
    fireEvent.click(zone1)
    
    expect(mockProps.onShoot).toHaveBeenCalledWith(1)
  })

  test('disables zones when shooting', () => {
    render(<GameField {...mockProps} isShooting={true} />)
    
    const zone1 = screen.getByTestId('zone-1')
    fireEvent.click(zone1)
    
    expect(mockProps.onShoot).not.toHaveBeenCalled()
  })

  test('shows selected zone highlight', () => {
    render(<GameField {...mockProps} selectedZone={1} />)
    
    const zone1 = screen.getByTestId('zone-1')
    expect(zone1).toHaveClass('selected')
  })

  test('displays game result when provided', () => {
    const gameResult = {
      isGoal: true,
      totalWin: 2.0,
      multiplier: 2.0
    }
    
    render(<GameField {...mockProps} gameResult={gameResult} />)
    
    expect(screen.getByText('GOL!')).toBeInTheDocument()
    expect(screen.getByText('R$ 2,00')).toBeInTheDocument()
  })

  test('displays miss result when no goal', () => {
    const gameResult = {
      isGoal: false,
      totalWin: 0,
      multiplier: 2.0
    }
    
    render(<GameField {...mockProps} gameResult={gameResult} />)
    
    expect(screen.getByText('DEFENDEU!')).toBeInTheDocument()
  })
})
