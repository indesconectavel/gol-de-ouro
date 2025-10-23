const jwt = require('jsonwebtoken');

// Tentar diferentes chaves JWT possíveis
const possibleSecrets = [
  'goldeouro_jwt_secret_key_2025_super_segura_minimo_32_chars',
  'sua_chave_jwt_super_secreta_aqui_minimo_32_chars',
  'jwt_secret_key_goldeouro_2025',
  'goldeouro_secret_key_2025',
  'jwt_secret_minimo_32_chars_goldeouro'
];

const testUser = {
  id: 1,
  email: 'teste@exemplo.com',
  name: 'Usuário Teste'
};

console.log('🔑 Testando diferentes chaves JWT...\n');

possibleSecrets.forEach((secret, index) => {
  try {
    const token = jwt.sign(testUser, secret, { expiresIn: '1h' });
    console.log(`${index + 1}. Chave: ${secret.substring(0, 20)}...`);
    console.log(`   Token: ${token.substring(0, 50)}...`);
    console.log(`   ✅ Token gerado com sucesso!\n`);
  } catch (error) {
    console.log(`${index + 1}. Chave: ${secret.substring(0, 20)}...`);
    console.log(`   ❌ Erro: ${error.message}\n`);
  }
});

// Testar com variável de ambiente
console.log('🌍 Testando com variável de ambiente...');
const envSecret = process.env.JWT_SECRET;
if (envSecret) {
  try {
    const token = jwt.sign(testUser, envSecret, { expiresIn: '1h' });
    console.log(`   Token: ${token.substring(0, 50)}...`);
    console.log(`   ✅ Token gerado com sucesso!\n`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }
} else {
  console.log('   ⚠️ JWT_SECRET não definido no ambiente\n');
}
