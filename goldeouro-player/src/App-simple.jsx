import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Componente simples para teste
const SimpleLogin = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
        🎮 Gol de Ouro - Login
      </h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Senha
          </label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="Sua senha"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-yellow-500 text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors"
        >
          Entrar
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 mt-4">
        Teste simples - Se você está vendo isso, o React está funcionando!
      </p>
    </div>
  </div>
)

const SimpleDashboard = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
        🎮 Gol de Ouro - Dashboard
      </h1>
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded-md">
          <h3 className="font-semibold text-gray-800">Saldo</h3>
          <p className="text-2xl font-bold text-green-600">R$ 100,00</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
            Jogar
          </button>
          <button className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600">
            Depositar
          </button>
        </div>
      </div>
      <p className="text-center text-sm text-gray-600 mt-4">
        Dashboard simples funcionando!
      </p>
    </div>
  </div>
)

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900">
        <Routes>
          <Route path="/" element={<SimpleLogin />} />
          <Route path="/dashboard" element={<SimpleDashboard />} />
          <Route path="/test" element={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
              <div className="text-white text-center">
                <h1 className="text-4xl font-bold mb-4">✅ Teste Funcionando!</h1>
                <p className="text-xl">React + Vite + Tailwind funcionando perfeitamente!</p>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App
