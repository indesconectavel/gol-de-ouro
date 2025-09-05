import { useCallback, useRef, useMemo } from 'react'

const useMemoizedCallback = (callback, deps) => {
  const callbackRef = useRef(callback)
  const depsRef = useRef(deps)

  // Atualizar callback ref quando callback muda
  callbackRef.current = callback

  // Verificar se as dependências mudaram
  const depsChanged = useMemo(() => {
    if (!depsRef.current || !deps) return true
    if (depsRef.current.length !== deps.length) return true
    
    return depsRef.current.some((dep, index) => dep !== deps[index])
  }, [deps])

  // Atualizar deps ref quando mudam
  if (depsChanged) {
    depsRef.current = deps
  }

  return useCallback((...args) => {
    return callbackRef.current(...args)
  }, [depsChanged])
}

export default useMemoizedCallback
