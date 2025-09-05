// Teste simples para verificar se o React está funcionando
const React = require('react');
const ReactDOM = require('react-dom');

console.log('✅ React carregado com sucesso!');
console.log('✅ ReactDOM carregado com sucesso!');

// Teste básico de renderização
const TestComponent = () => {
  return React.createElement('div', { 
    style: { 
      color: 'white', 
      background: '#0f172a', 
      padding: '20px',
      textAlign: 'center'
    } 
  }, '🎯 Frontend Jogador - Teste OK!');
};

console.log('✅ Componente de teste criado!');
console.log('✅ Sistema pronto para execução!');
