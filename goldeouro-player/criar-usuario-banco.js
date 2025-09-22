// Script para criar usuário de teste no banco de dados
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

const testUser = {
  name: 'Usuário Teste',
  email: 'test@example.com',
  password: 'password123',
  confirmPassword: 'password123'
};

async function criarUsuarioTeste() {
  try {
    console.log('🚀 Criando usuário de teste...');
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔑 Senha: ${testUser.password}`);
    
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 || response.status === 201) {
      console.log('✅ Usuário criado com sucesso!');
      console.log('📊 Dados do usuário:', response.data);
      
      // Testar login
      console.log('\n🔐 Testando login...');
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      if (loginResponse.status === 200) {
        console.log('✅ Login funcionando!');
        console.log('🎉 Sistema pronto para uso!');
      } else {
        console.log('❌ Erro no login:', loginResponse.data);
      }
    }
  } catch (error) {
    if (error.response?.status === 409 || error.response?.data?.message?.includes('já existe')) {
      console.log('⚠️ Usuário já existe! Testando login...');
      
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        
        if (loginResponse.status === 200) {
          console.log('✅ Login funcionando!');
          console.log('🎉 Sistema pronto para uso!');
        } else {
          console.log('❌ Erro no login:', loginResponse.data);
        }
      } catch (loginError) {
        console.log('❌ Erro no login:', loginError.response?.data || loginError.message);
      }
    } else {
      console.log('❌ Erro ao criar usuário:', error.response?.data || error.message);
    }
  }
}

// Verificar se o backend está rodando
async function verificarBackend() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    if (response.status === 200) {
      console.log('✅ Backend funcionando');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend não está rodando');
    console.log('💡 Execute: cd goldeouro-backend && npm run dev');
    return false;
  }
}

async function main() {
  console.log('🔧 Script de Criação de Usuário de Teste');
  console.log('=====================================\n');
  
  const backendOk = await verificarBackend();
  if (backendOk) {
    await criarUsuarioTeste();
  }
}

main();
