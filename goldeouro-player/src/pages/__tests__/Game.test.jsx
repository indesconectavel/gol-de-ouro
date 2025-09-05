import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import Game from '../Game'

// Mock do useNavigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

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

const GameWithRouter = () => (
  <BrowserRouter>
    <Game />
  </BrowserRouter>
)

describe('Game Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders game page with all components', () => {
    render(<GameWithRouter />)
    
    // Verifica se os componentes principais estão presentes
    expect(screen.getByText('GOL DE OURO')).toBeInTheDocument()
    expect(screen.getByText('CHUTAR')).toBeInTheDocument()
    expect(screen.getByText('R$ 1,00')).toBeInTheDocument() // Valor da aposta
    expect(screen.getByText('R$ 21,00')).toBeInTheDocument() // Saldo inicial
  })

  test('displays goal zones correctly', () => {
    render(<GameWithRouter />)
    
    // Verifica se as zonas de gol estão presentes
    expect(screen.getByTestId('zone-1')).toBeInTheDocument()
    expect(screen.getByTestId('zone-2')).toBeInTheDocument()
    expect(screen.getByTestId('zone-3')).toBeInTheDocument()
    expect(screen.getByTestId('zone-4')).toBeInTheDocument()
    expect(screen.getByTestId('zone-5')).toBeInTheDocument()
  })

  test('handles shot correctly', async () => {
    render(<GameWithRouter />)
    
    const zone1 = screen.getByTestId('zone-1')
    fireEvent.click(zone1)
    
    // Verifica se o jogo mudou para estado de "playing"
    expect(screen.getByText('Chutando...')).toBeInTheDocument()
    
    // Aguarda o resultado
    await waitFor(() => {
      expect(screen.getByText(/GOL!|DEFENDEU!/)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  test('updates balance after shot', async () => {
    render(<GameWithRouter />)
    
    const initialBalance = screen.getByText('R$ 21,00')
    expect(initialBalance).toBeInTheDocument()
    
    const zone1 = screen.getByTestId('zone-1')
    fireEvent.click(zone1)
    
    // Verifica se o saldo foi reduzido pela aposta
    await waitFor(() => {
      expect(screen.getByText('R$ 20,00')).toBeInTheDocument()
    })
  })

  test('prevents multiple shots when shooting', () => {
    render(<GameWithRouter />)
    
    const zone1 = screen.getByTestId('zone-1')
    fireEvent.click(zone1)
    
    // Tenta clicar novamente
    fireEvent.click(zone1)
    
    // Verifica se apenas um chute foi processado
    expect(screen.getByText('Chutando...')).toBeInTheDocument()
  })

  test('shows game statistics', () => {
    render(<GameWithRouter />)
    
    expect(screen.getByText('Estatísticas')).toBeInTheDocument()
    expect(screen.getByText('Chutes: 0')).toBeInTheDocument()
    expect(screen.getByText('Gols: 0')).toBeInTheDocument()
    expect(screen.getByText('Precisão: 0%')).toBeInTheDocument()
  })

  test('displays navigation menu', () => {
    render(<GameWithRouter />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Jogar')).toBeInTheDocument()
    expect(screen.getByText('Perfil')).toBeInTheDocument()
    expect(screen.getByText('Saque')).toBeInTheDocument()
  })
})
