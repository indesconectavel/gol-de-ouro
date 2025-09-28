import { useEffect, useState } from 'react'
import { Workbox } from 'workbox-window'

export default function PwaSwUpdater() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const wb = new Workbox('/sw.js', { scope: '/' })

      wb.addEventListener('waiting', () => {
        setWaitingWorker(wb?.waiting || null)
        setIsUpdateAvailable(true)
      })
      wb.register()
    }
  }, [])

  const reload = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  }

  if (!isUpdateAvailable) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-black/80 text-white px-4 py-3 shadow-lg">
      <span className="mr-3">Uma nova versão está disponível.</span>
      <button onClick={reload} className="underline font-bold">Atualizar</button>
    </div>
  )
}
