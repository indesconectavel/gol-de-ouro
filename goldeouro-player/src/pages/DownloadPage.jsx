import React, { useEffect } from 'react'

const DownloadPage = () => {
  useEffect(() => {
    // Redirecionar para a página HTML estática
    window.location.href = '/download.html'
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚽</div>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: '#fbbf24',
          marginBottom: '8px',
          margin: 0
        }}>Gol de Ouro</h1>
        <p style={{
          fontSize: '20px',
          color: '#cbd5e1',
          margin: 0
        }}>Redirecionando para download...</p>
        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          marginTop: '20px',
          margin: '20px 0 0 0'
        }}>
          Se não for redirecionado automaticamente, 
          <a href="/download.html" style={{ color: '#fbbf24', textDecoration: 'none' }}>
            clique aqui
          </a>
        </p>
      </div>
    </div>
  )
}

export default DownloadPage
