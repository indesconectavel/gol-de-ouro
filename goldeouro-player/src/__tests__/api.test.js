import { createMatch, getMatch, getDashboardData } from '../lib/api'

// Mock do fetch
global.fetch = jest.fn()

describe('API Integration Tests', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  describe('createMatch', () => {
    it('should create a match with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'match-123',
          status: 'waiting',
          bet: 1.0
        })
      }
      
      fetch.mockResolvedValueOnce(mockResponse)
      
      const result = await createMatch({ bet: 1.0 })
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/game/create',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bet: 1.0 })
        })
      )
      
      expect(result).toEqual({
        id: 'match-123',
        status: 'waiting',
        bet: 1.0
      })
    })

    it('should handle API errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))
      
      await expect(createMatch({ bet: 1.0 })).rejects.toThrow('Network error')
    })
  })

  describe('getMatch', () => {
    it('should fetch match data', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          id: 'match-123',
          status: 'active',
          players: 5,
          bet: 1.0
        })
      }
      
      fetch.mockResolvedValueOnce(mockResponse)
      
      const result = await getMatch('match-123')
      
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/game/match-123')
      expect(result).toEqual({
        id: 'match-123',
        status: 'active',
        players: 5,
        bet: 1.0
      })
    })
  })

  describe('getDashboardData', () => {
    it('should fetch dashboard data', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          users: 33,
          games: {
            total: 1,
            waiting: 1,
            active: 0,
            finished: 0
          },
          bets: 0,
          queue: 15
        })
      }
      
      fetch.mockResolvedValueOnce(mockResponse)
      
      const result = await getDashboardData()
      
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/public/dashboard')
      expect(result).toEqual({
        users: 33,
        games: {
          total: 1,
          waiting: 1,
          active: 0,
          finished: 0
        },
        bets: 0,
        queue: 15
      })
    })
  })
})
