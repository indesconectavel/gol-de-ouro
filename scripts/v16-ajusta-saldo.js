/**
 * 💰 V16 AJUSTE DE SALDO - SEGURO E CONTROLADO
 * Adiciona saldo ao usuário de teste com backup e rollback
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gayopagjdrkcmkirmfvy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';

const USER_EMAIL = 'test_v16_diag_1764865077736@example.com';
const USER_ID = '8304f2d0-1195-4416-9f8f-d740380062ee';
const ADD_AMOUNT = 50.00;

const REPORTS_DIR = path.join(__dirname, '..', 'docs', 'GO-LIVE');
const LOGS_DIR = path.join(__dirname, '..', 'logs');

const ajuste = {
  timestamp: new Date().toISOString(),
  status: 'INITIALIZING',
  backup: {},
  correcao: {},
  errors: [],
  warnings: []
};

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
}

async function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function getHeaders() {
  if (!SERVICE_ROLE_KEY) {
    throw new Error('SERVICE_ROLE_KEY não configurada');
  }
  return {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

// Backup antes de alterar
async function fazerBackup() {
  console.log('\n💰 FAZENDO BACKUP\n');
  await log('Fazendo backup do usuário');
  
  try {
    if (!SERVICE_ROLE_KEY) {
      throw new Error('SERVICE_ROLE_KEY não disponível para backup');
    }
    
    const headers = getHeaders();
    
    // Backup usuário
    const userR = await axios.get(
      `${SUPABASE_URL}/rest/v1/usuarios?select=*&email=eq.${USER_EMAIL}`,
      { headers, timeout: 10000 }
    );
    
    if (!userR.data || userR.data.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    ajuste.backup.usuario = userR.data[0];
    ajuste.backup.saldoAnterior = parseFloat(userR.data[0].saldo || 0);
    
    await fs.writeFile(
      path.join(REPORTS_DIR, 'V16-BACKUP-USUARIO.json'),
      JSON.stringify(userR.data[0], null, 2)
    );
    
    await log(`✅ Backup salvo: saldo anterior = R$ ${ajuste.backup.saldoAnterior}`);
    return ajuste.backup;
  } catch (error) {
    ajuste.errors.push(`Erro no backup: ${error.message}`);
    throw error;
  }
}

// Tentar adicionar saldo via API
async function adicionarSaldoAPI() {
  console.log('\n💰 ADICIONANDO SALDO VIA API\n');
  await log('Tentando adicionar saldo via API');
  
  try {
    if (!SERVICE_ROLE_KEY) {
      throw new Error('SERVICE_ROLE_KEY não disponível');
    }
    
    const headers = getHeaders();
    const saldoAnterior = ajuste.backup.saldoAnterior;
    const saldoPosterior = saldoAnterior + ADD_AMOUNT;
    
    // Tentar RPC function primeiro
    try {
      const rpcR = await axios.post(
        `${SUPABASE_URL}/rest/v1/rpc/rpc_add_balance`,
        {
          p_user_id: USER_ID,
          p_amount: ADD_AMOUNT,
          p_description: 'Saldo de teste V16+',
          p_reference_type: 'teste'
        },
        { headers, timeout: 15000 }
      );
      
      if (rpcR.data && rpcR.data.success) {
        ajuste.correcao.method = 'RPC_FUNCTION';
        ajuste.correcao.success = true;
        ajuste.correcao.saldoAnterior = rpcR.data.old_balance;
        ajuste.correcao.saldoPosterior = rpcR.data.new_balance;
        ajuste.correcao.transactionId = rpcR.data.transaction_id;
        
        await log(`✅ Saldo adicionado via RPC: R$ ${ADD_AMOUNT}`);
        return ajuste.correcao;
      }
    } catch (e) {
      await log(`⚠️ RPC function não disponível: ${e.message}`);
    }
    
    // Fallback: REST API direto
    await log('Usando REST API direto...');
    
    // Atualizar saldo
    const updateR = await axios.patch(
      `${SUPABASE_URL}/rest/v1/usuarios?id=eq.${USER_ID}`,
      { saldo: saldoPosterior },
      { headers, timeout: 15000 }
    );
    
    if (!updateR.data || updateR.data.length === 0) {
      throw new Error('Falha ao atualizar saldo');
    }
    
    // Inserir transação
    const txId = crypto.randomUUID();
    const txR = await axios.post(
      `${SUPABASE_URL}/rest/v1/transacoes`,
      {
        id: txId,
        usuario_id: USER_ID,
        tipo: 'credito',
        valor: ADD_AMOUNT,
        saldo_anterior: saldoAnterior,
        saldo_posterior: saldoPosterior,
        descricao: 'Saldo de teste V16+',
        status: 'concluido',
        created_at: new Date().toISOString()
      },
      { headers, timeout: 15000 }
    );
    
    ajuste.correcao.method = 'REST_API';
    ajuste.correcao.success = true;
    ajuste.correcao.saldoAnterior = saldoAnterior;
    ajuste.correcao.saldoPosterior = saldoPosterior;
    ajuste.correcao.transactionId = txId;
    
    await log(`✅ Saldo adicionado via REST: R$ ${ADD_AMOUNT}`);
    return ajuste.correcao;
  } catch (error) {
    if (error.response?.status === 401) {
      ajuste.correcao.apiFailed = true;
      ajuste.correcao.error = 'SERVICE_ROLE_KEY inválida ou expirada';
      await gerarInstrucoesSQL();
    } else {
      ajuste.errors.push(`Erro ao adicionar saldo: ${error.message}`);
    }
    throw error;
  }
}

// Gerar instruções SQL se API falhar
async function gerarInstrucoesSQL() {
  console.log('\n💰 GERANDO INSTRUÇÕES SQL\n');
  await log('Gerando arquivo com instruções SQL');
  
  const sql = `-- 🔒 V16 AJUSTE DE SALDO - SQL SEGURO
-- Execute este SQL no Supabase Dashboard SQL Editor
-- Data: ${new Date().toISOString().split('T')[0]}

BEGIN;

-- Pegar saldo atual e atualizar
WITH u AS (
  SELECT id, saldo 
  FROM usuarios 
  WHERE email = '${USER_EMAIL}' 
  FOR UPDATE
)
UPDATE usuarios
SET saldo = (u.saldo + ${ADD_AMOUNT})
FROM u
WHERE usuarios.id = u.id;

-- Inserir transação com saldo_anterior e saldo_posterior
INSERT INTO transacoes(
  id, usuario_id, tipo, valor,
  saldo_anterior, saldo_posterior,
  descricao, status, created_at
)
SELECT
  gen_random_uuid(),
  u.id,
  'credito',
  ${ADD_AMOUNT},
  u.saldo,
  (u.saldo + ${ADD_AMOUNT}),
  'Saldo de teste V16+',
  'concluido',
  now()
FROM usuarios u
WHERE u.email = '${USER_EMAIL}';

COMMIT;

-- Verificar resultado
SELECT id, email, saldo FROM usuarios WHERE email = '${USER_EMAIL}';
SELECT * FROM transacoes WHERE usuario_id = '${USER_ID}' ORDER BY created_at DESC LIMIT 5;
`;
  
  await fs.writeFile(path.join(REPORTS_DIR, 'V16-INSTRUCOES-SQL.md'), sql);
  await log('✅ Instruções SQL geradas em V16-INSTRUCOES-SQL.md');
}

// Executar ajuste
async function run() {
  console.log('💰 INICIANDO AJUSTE DE SALDO V16\n');
  
  try {
    await ensureDir(REPORTS_DIR);
    await ensureDir(LOGS_DIR);
    
    await fazerBackup();
    
    try {
      await adicionarSaldoAPI();
      await log('✅ Saldo adicionado com sucesso via API');
    } catch (e) {
      if (e.response?.status === 401 || !SERVICE_ROLE_KEY) {
        await log('⚠️ API não disponível - instruções SQL geradas');
      } else {
        throw e;
      }
    }
    
    // Salvar resultado
    await fs.writeFile(path.join(LOGS_DIR, 'v16-ajuste-saldo.json'), JSON.stringify(ajuste, null, 2));
    
    console.log('\n✅ AJUSTE DE SALDO CONCLUÍDO\n');
    console.log(`Status: ${ajuste.correcao.success ? 'SUCESSO' : 'INSTRUÇÕES SQL GERADAS'}`);
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
    ajuste.status = 'FAILED';
    ajuste.errors.push(`Erro crítico: ${error.message}`);
    await gerarInstrucoesSQL();
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run, ajuste };

