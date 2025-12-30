/**
 * V17 AJUSTA SALDO
 * Verifica usuário e gera instruções SQL para ajustar saldo
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';
const REPORTS_DIR = path.join(__dirname, '..', 'docs', 'GO-LIVE', 'V17');

const USER_EMAIL = 'test_v16_diag_1764865077736@example.com';
const USER_PASSWORD = 'Test123456!';
const AMOUNT = 50.00;

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
}

async function ajustarSaldo() {
  console.log('\n🔧 V17 AJUSTANDO SALDO\n');
  
  const resultado = {
    inicio: new Date().toISOString(),
    usuario: {},
    token: null,
    saldoInicial: null,
    saldoFinal: null,
    sqlGerado: false,
    erros: []
  };

  try {
    await ensureDir(REPORTS_DIR);

    // Tentar login
    try {
      const r = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: USER_EMAIL,
        password: USER_PASSWORD
      }, { timeout: 15000, validateStatus: () => true });

      if (r.status === 200) {
        resultado.token = r.data?.token || r.data?.data?.token;
        resultado.usuario = r.data?.user || r.data?.data?.user || {};
        resultado.saldoInicial = resultado.usuario.saldo || 0;
      } else {
        resultado.erros.push(`Login falhou: ${r.status}`);
      }
    } catch (e) {
      resultado.erros.push(`Erro ao fazer login: ${e.message}`);
    }

    // Gerar SQL seguro
    const sql = `-- 🔧 V17 AJUSTE DE SALDO
-- Execute este SQL no Supabase Dashboard SQL Editor
-- Data: ${new Date().toISOString().split('T')[0]}

BEGIN;

WITH u AS (
  SELECT id, saldo
  FROM usuarios
  WHERE email = '${USER_EMAIL}'
  FOR UPDATE
)
UPDATE usuarios
SET saldo = (u.saldo + ${AMOUNT})
FROM u
WHERE usuarios.id = u.id;

INSERT INTO transacoes(
  id, usuario_id, tipo, valor,
  saldo_anterior, saldo_posterior,
  descricao, created_at
)
SELECT
  gen_random_uuid(),
  u.id,
  'credito',
  ${AMOUNT},
  u.saldo,
  (u.saldo + ${AMOUNT}),
  'Saldo de teste V17',
  now()
FROM usuarios u
WHERE u.email = '${USER_EMAIL}';

COMMIT;

-- Verificar resultado
SELECT id, email, saldo FROM usuarios WHERE email = '${USER_EMAIL}';
SELECT * FROM transacoes WHERE usuario_id = (SELECT id FROM usuarios WHERE email = '${USER_EMAIL}') ORDER BY created_at DESC LIMIT 5;
`;

    const report = `# 🔧 V17 AJUSTE DE SALDO
## Data: ${new Date().toISOString().split('T')[0]}

## Usuário:
- Email: ${USER_EMAIL}
- ID: ${resultado.usuario.id || 'N/A'}
- Saldo Inicial: R$ ${resultado.saldoInicial || 0}

## SQL para Executar:

\`\`\`sql
${sql}
\`\`\`

## Instruções:
1. Copie o SQL acima
2. Execute no Supabase Dashboard → SQL Editor
3. Verifique o resultado
4. Reexecute a auditoria V17

## Status: ${resultado.token ? '✅ Usuário encontrado' : '⚠️ Usuário não encontrado - criar manualmente'}
`;
    
    await fs.writeFile(path.join(REPORTS_DIR, '01-SALDO.md'), report, 'utf8');
    resultado.sqlGerado = true;
    resultado.fim = new Date().toISOString();

    console.log('✅ SQL gerado em docs/GO-LIVE/V17/01-SALDO.md');
    return resultado;
  } catch (error) {
    resultado.erros.push(`Erro crítico: ${error.message}`);
    resultado.fim = new Date().toISOString();
    return resultado;
  }
}

if (require.main === module) {
  ajustarSaldo().then(r => {
    console.log('\nResultado:', JSON.stringify(r, null, 2));
    process.exit(r.erros.length > 0 ? 1 : 0);
  });
}

module.exports = { ajustarSaldo };

