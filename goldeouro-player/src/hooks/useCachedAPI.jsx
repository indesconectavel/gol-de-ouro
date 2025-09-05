import { useState, useEffect, useCallback } from 'react'
import { apiCache } from '../utils/cache'

const useCachedAPI = (url, options = {}) => {
  const {
    cacheKey = url,
    cacheTTL = 120000, // 2 minutos
    enabled = true,
    dependencies = []
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    // Verificar cache primeiro
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      setData(cachedData)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Armazenar no cache
      apiCache.set(cacheKey, result, cacheTTL)
      
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [url, cacheKey, cacheTTL, enabled, ...dependencies])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    // Limpar cache e buscar novamente
    apiCache.delete(cacheKey)
    fetchData()
  }, [cacheKey, fetchData])

  const invalidateCache = useCallback(() => {
    apiCache.delete(cacheKey)
  }, [cacheKey])

  return {
    data,
    loading,
    error,
    refetch,
    invalidateCache
  }
}

export default useCachedAPI
