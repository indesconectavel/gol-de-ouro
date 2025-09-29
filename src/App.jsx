import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App-no-tailwind.css';
import Dashboard from './components/Dashboard';
import Usuarios from './components/Usuarios';
import Saques from './components/Saques';

// Componente de Login Simples
const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (credentials.username === 'goldeouro_admin' && credentials.password === 'G0ld3@0ur0_2025!') {
      onLogin(true);
    } else {
      setError('Credenciais inválidas');
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <div className="login-header">
          <h1>Gol de Ouro</h1>
          <p>Painel Admin</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuário</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              placeholder="goldeouro_admin"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              placeholder="G0ld3@0ur0_2025!"
              required
            />
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <button type="submit" className="login-button">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

// Componente principal da aplicação
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <Login onLogin={setIsLoggedIn} />;
  }

  return (
    <Router>
      <div className="admin-app">
        <nav className="admin-nav">
          <div className="nav-brand">
            <h2>Gol de Ouro Admin</h2>
          </div>
          <div className="nav-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/usuarios">Usuários</a>
            <a href="/saques">Saques</a>
            <button onClick={() => setIsLoggedIn(false)} className="logout-btn">
              Sair
            </button>
          </div>
        </nav>
        
        <main className="admin-main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login onLogin={setIsLoggedIn} />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/saques" element={<Saques />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
