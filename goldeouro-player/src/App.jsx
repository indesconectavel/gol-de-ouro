import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SidebarProvider } from './contexts/SidebarContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Game from './pages/Game'
import GameShoot from './pages/GameShoot'
import GameShootFallback from './pages/GameShootFallback'
import GameShootTest from './pages/GameShootTest'
import GameShootSimple from './pages/GameShootSimple'
import Profile from './pages/Profile'
import Withdraw from './pages/Withdraw'
import Pagamentos from './pages/Pagamentos'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Router>
          <div className="min-h-screen bg-slate-900">
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
          </div>
        </Router>
      </SidebarProvider>
    </AuthProvider>
  )
}

export default App
