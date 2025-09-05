import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SidebarProvider } from './contexts/SidebarContext'
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
    <SidebarProvider>
      <Router>
        <div className="min-h-screen bg-slate-900">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/game" element={<GameShoot />} />
            <Route path="/gameshoot" element={<GameShoot />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/pagamentos" element={<Pagamentos />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </div>
      </Router>
    </SidebarProvider>
  )
}

export default App
