// Teste simples de login - Frontend
async function testLogin() {
  console.log('🔍 TESTANDO LOGIN DO FRONTEND');
  console.log('==============================');
  
  const loginData = {
    email: 'free10signer@gmail.com',
    password: 'Free10signer'
  };
  
  try {
    console.log('📤 Enviando requisição para:', 'https://goldeouro-backend.fly.dev/api/auth/login');
    console.log('📤 Dados:', loginData);
    
    const response = await fetch('https://goldeouro-backend.fly.dev/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    console.log('📥 Status:', response.status);
    console.log('📥 Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📥 Resposta:', data);
    
    if (data.success) {
      console.log('✅ LOGIN FUNCIONOU!');
      console.log('👤 Usuário:', data.user);
      console.log('🎫 Token:', data.token);
    } else {
      console.log('❌ LOGIN FALHOU:', data.message);
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

// Executar teste
testLogin();
