import { useState, useEffect } from 'react'

const useImagePreloader = (imageSources) => {
  const [loadedImages, setLoadedImages] = useState({})
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!imageSources || imageSources.length === 0) {
      setIsLoading(false)
      return
    }

    let loadedCount = 0
    const totalImages = imageSources.length
    const imagePromises = []

    imageSources.forEach((src) => {
      const promise = new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          loadedCount++
          setLoadingProgress((loadedCount / totalImages) * 100)
          setLoadedImages(prev => ({ ...prev, [src]: true }))
          resolve(src)
        }
        img.onerror = () => {
          loadedCount++
          setLoadingProgress((loadedCount / totalImages) * 100)
          setLoadedImages(prev => ({ ...prev, [src]: false }))
          reject(src)
        }
        img.src = src
      })
      imagePromises.push(promise)
    })

    Promise.allSettled(imagePromises).then(() => {
      setIsLoading(false)
    })
  }, [imageSources])

  return { loadedImages, loadingProgress, isLoading }
}

export default useImagePreloader
