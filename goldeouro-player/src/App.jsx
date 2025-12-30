import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SidebarProvider } from './contexts/SidebarContext'
import ErrorBoundary from './components/ErrorBoundary'
import VersionWarning from './components/VersionWarning'
import PwaSwUpdater from './pwa-sw-updater'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Game from './pages/Game'
import GameShoot from './pages/GameShoot'
import GameShootFallback from './pages/GameShootFallback'
import GameShootTest from './pages/GameShootTest'
import GameShootSimple from './pages/GameShootSimple'
import GameOriginalTest from './pages/GameOriginalTest'
import GameOriginalRestored from './pages/GameOriginalRestored'
import Jogo from './pages/Jogo'
import GameCycle from './pages/GameCycle'
import GameFinal from './pages/GameFinal'
import Profile from './pages/Profile'
import Withdraw from './pages/Withdraw'
import Pagamentos from './pages/Pagamentos'
import Terms from './pages/Terms'
import DownloadPage from './pages/DownloadPage'
import Privacy from './pages/Privacy'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SidebarProvider>
          <Router>
            <div className="min-h-screen bg-slate-900">
              <VersionWarning />
              <PwaSwUpdater />
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/download" element={<DownloadPage />} />
                
                {/* Rotas protegidas */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/game" element={
                  <ProtectedRoute>
                    <GameFinal />
                  </ProtectedRoute>
                } />
                <Route path="/gameshoot" element={
                  <ProtectedRoute>
                    <Game />
                  </ProtectedRoute>
                } />
                <Route path="/game-original-test" element={
                  <ProtectedRoute>
                    <GameOriginalTest />
                  </ProtectedRoute>
                } />
                <Route path="/game-original-restored" element={
                  <ProtectedRoute>
                    <GameOriginalRestored />
                  </ProtectedRoute>
                } />
                <Route path="/jogo" element={
                  <ProtectedRoute>
                    <Jogo />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/withdraw" element={
                  <ProtectedRoute>
                    <Withdraw />
                  </ProtectedRoute>
                } />
                <Route path="/pagamentos" element={
                  <ProtectedRoute>
                    <Pagamentos />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </Router>
        </SidebarProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
