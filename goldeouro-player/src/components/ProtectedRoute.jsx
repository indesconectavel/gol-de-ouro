import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-lg flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3"></div>
          Verificando autenticação...
        </div>
      </div>
    )
  }

  // Se não estiver autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Se estiver autenticado, renderizar o componente
  return children
}

export default ProtectedRoute
