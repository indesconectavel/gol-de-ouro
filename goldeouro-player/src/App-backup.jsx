import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { SidebarProvider } from './contexts/SidebarContext'
import ProtectedRoute from './components/ProtectedRoute'
import LazyWrapper, { LazyComponent } from './components/LazyWrapper'
import usePerformance from './hooks/usePerformance.jsx'

// Lazy loading das páginas
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Game = lazy(() => import('./pages/Game'))
const GameShoot = lazy(() => import('./pages/GameShoot'))
const GameShootFallback = lazy(() => import('./pages/GameShootFallback'))
const GameShootTest = lazy(() => import('./pages/GameShootTest'))
const GameShootSimple = lazy(() => import('./pages/GameShootSimple'))
const Profile = lazy(() => import('./pages/Profile'))
const Withdraw = lazy(() => import('./pages/Withdraw'))
const Pagamentos = lazy(() => import('./pages/Pagamentos'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))

function App() {
  const { preloadCriticalResources } = usePerformance()

  // Pré-carregar recursos críticos
  React.useEffect(() => {
    preloadCriticalResources()
  }, [preloadCriticalResources])

  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <div className="min-h-screen bg-slate-900">
            <Suspense fallback={
              <LazyWrapper loadingMessage="Carregando aplicação...">
                <div className="flex items-center justify-center min-h-screen">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Gol de Ouro</p>
                  </div>
                </div>
              </LazyWrapper>
            }>
              <Routes>
                {/* Rotas públicas */}
                <Route path="/" element={<ProtectedRoute requireAuth={false}><Login /></ProtectedRoute>} />
                <Route path="/register" element={<ProtectedRoute requireAuth={false}><Register /></ProtectedRoute>} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                
                {/* Rotas protegidas */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/game" element={<ProtectedRoute><GameShoot /></ProtectedRoute>} />
                <Route path="/gameshoot" element={<ProtectedRoute><GameShoot /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
                <Route path="/pagamentos" element={<ProtectedRoute><Pagamentos /></ProtectedRoute>} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </SidebarProvider>
    </AuthProvider>
  )
}

export default App
