#!/usr/bin/env node
// === CRIAR USUÁRIO REAL NO SISTEMA ===

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Simular banco em memória para teste
const users = new Map();

async function createRealUser() {
  try {
    console.log('🔐 Criando usuário real: free10signer@gmail.com');
    
    const email = 'free10signer@gmail.com';
    const password = 'Free10signer';
    const name = 'Usuário Real';
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar usuário
    const user = {
      id: Date.now().toString(),
      email: email,
      passwordHash: hashedPassword,
      name: name,
      balance: 0.00,
      accountStatus: 'active',
      createdAt: new Date().toISOString()
    };
    
    users.set(email, user);
    
    console.log('✅ Usuário criado com sucesso:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Nome:', user.name);
    console.log('   Saldo:', user.balance);
    console.log('   Status:', user.accountStatus);
    
    // Testar login
    console.log('\n🔍 Testando login...');
    const storedUser = users.get(email);
    
    if (storedUser && await bcrypt.compare(password, storedUser.passwordHash)) {
      const token = jwt.sign(
        { id: storedUser.id, email: storedUser.email },
        'goldeouro_jwt_secret_key_2025_production',
        { expiresIn: '24h' }
      );
      
      console.log('✅ Login funcionando!');
      console.log('   Token gerado:', token.substring(0, 50) + '...');
      
      return { success: true, user, token };
    } else {
      console.log('❌ Login falhou');
      return { success: false };
    }
    
  } catch (error) {
    console.log('❌ Erro ao criar usuário:', error.message);
    return { success: false, error: error.message };
  }
}

createRealUser();

