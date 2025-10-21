import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SidebarProvider } from './contexts/SidebarContext'
import ErrorBoundary from './components/ErrorBoundary'
import VersionWarning from './components/VersionWarning'
import PwaSwUpdater from './pwa-sw-updater'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
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
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/game" element={<GameShoot />} />
                <Route path="/gameshoot" element={<GameShoot />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/withdraw" element={<Withdraw />} />
                <Route path="/pagamentos" element={<Pagamentos />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/download" element={<DownloadPage />} />
              </Routes>
            </div>
          </Router>
        </SidebarProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
