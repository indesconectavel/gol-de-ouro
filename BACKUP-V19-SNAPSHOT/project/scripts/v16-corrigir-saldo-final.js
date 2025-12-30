/**
 * 🔒 V16 CORRIGIR SALDO FINAL - Versão Corrigida
 * Corrige o problema de constraint e adiciona saldo de forma segura
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

// Verificar valores de status permitidos
async function verificarStatusPermitidos() {
  console.log('\n🔍 Verificando valores de status permitidos...\n');
  
  try {
    if (!SERVICE_ROLE_KEY) {
      return null;
    }
    
    const headers = getHeaders();
    
    // Tentar buscar transações existentes para ver valores de status
    const r = await axios.get(
      `${SUPABASE_URL}/rest/v1/transacoes?select=status&limit=100`,
      { headers, timeout: 10000 }
    );
    
    const statusValues = [...new Set(r.data.map(t => t.status).filter(Boolean))];
    await log(`Valores de status encontrados: ${statusValues.join(', ')}`);
    
    return statusValues;
  } catch (e) {
    await log(`⚠️ Erro ao verificar status: ${e.message}`);
    return null;
  }
}

// Adicionar saldo via API com status correto
async function adicionarSaldoAPI(statusPermitidos) {
  console.log('\n💰 Adicionando saldo via API...\n');
  
  try {
    if (!SERVICE_ROLE_KEY) {
      throw new Error('SERVICE_ROLE_KEY não disponível');
    }
    
    const headers = getHeaders();
    
    // Obter saldo atual
    const userR = await axios.get(
      `${SUPABASE_URL}/rest/v1/usuarios?select=id,saldo&email=eq.${USER_EMAIL}`,
      { headers, timeout: 10000 }
    );
    
    if (!userR.data || userR.data.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    const saldoAnterior = parseFloat(userR.data[0].saldo || 0);
    const saldoPosterior = saldoAnterior + ADD_AMOUNT;
    
    // Atualizar saldo
    await axios.patch(
      `${SUPABASE_URL}/rest/v1/usuarios?id=eq.${USER_ID}`,
      { saldo: saldoPosterior },
      { headers, timeout: 15000 }
    );
    
    await log(`✅ Saldo atualizado: R$ ${saldoAnterior} → R$ ${saldoPosterior}`);
    
    // Determinar status correto
    let status = 'pendente'; // Default seguro
    if (statusPermitidos) {
      if (statusPermitidos.includes('concluido')) {
        status = 'concluido';
      } else if (statusPermitidos.includes('processando')) {
        status = 'processando';
      } else if (statusPermitidos.includes('pendente')) {
        status = 'pendente';
      }
    }
    
    // Inserir transação
    const txId = crypto.randomUUID();
    const txData = {
      id: txId,
      usuario_id: USER_ID,
      tipo: 'credito',
      valor: ADD_AMOUNT,
      saldo_anterior: saldoAnterior,
      saldo_posterior: saldoPosterior,
      descricao: 'Saldo de teste V16+',
      status: status,
      created_at: new Date().toISOString()
    };
    
    try {
      const txR = await axios.post(
        `${SUPABASE_URL}/rest/v1/transacoes`,
        txData,
        { headers, timeout: 15000 }
      );
      
      await log(`✅ Transação criada: ${txId} com status '${status}'`);
      return { success: true, txId, saldoAnterior, saldoPosterior, status };
    } catch (txError) {
      // Se falhar por constraint, tentar sem status (usa DEFAULT)
      if (txError.response?.status === 400 || txError.response?.status === 422) {
        await log(`⚠️ Erro ao inserir com status '${status}', tentando sem status...`);
        
        delete txData.status;
        const txR2 = await axios.post(
          `${SUPABASE_URL}/rest/v1/transacoes`,
          txData,
          { headers, timeout: 15000 }
        );
        
        await log(`✅ Transação criada sem status (usando DEFAULT)`);
        return { success: true, txId, saldoAnterior, saldoPosterior, status: 'DEFAULT' };
      }
      throw txError;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('SERVICE_ROLE_KEY inválida ou expirada');
    }
    throw error;
  }
}

// Gerar SQL corrigido
async function gerarSQLCorrigido() {
  console.log('\n💰 Gerando SQL corrigido...\n');
  
  const sql = `-- 🔒 V16 AJUSTE DE SALDO - SQL CORRIGIDO
-- Execute este SQL no Supabase Dashboard SQL Editor
-- Data: ${new Date().toISOString().split('T')[0]}

-- PRIMEIRO: Verificar valores permitidos
SELECT DISTINCT status FROM transacoes LIMIT 10;

-- SEGUNDO: Executar transação
BEGIN;

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

-- Inserir transação (sem status para usar DEFAULT se houver problema)
INSERT INTO transacoes(
  id, usuario_id, tipo, valor,
  saldo_anterior, saldo_posterior,
  descricao, created_at
)
SELECT
  gen_random_uuid(),
  u.id,
  'credito',
  ${ADD_AMOUNT},
  u.saldo,
  (u.saldo + ${ADD_AMOUNT}),
  'Saldo de teste V16+',
  now()
FROM usuarios u
WHERE u.email = '${USER_EMAIL}';

COMMIT;

-- Verificar resultado
SELECT id, email, saldo FROM usuarios WHERE email = '${USER_EMAIL}';
SELECT * FROM transacoes WHERE usuario_id = '${USER_ID}' ORDER BY created_at DESC LIMIT 5;
`;
  
  await fs.writeFile(path.join(REPORTS_DIR, 'V16-SQL-CORRIGIDO-FINAL.md'), sql);
  await log('✅ SQL corrigido gerado em V16-SQL-CORRIGIDO-FINAL.md');
}

// Executar correção
async function run() {
  console.log('🔒 INICIANDO CORREÇÃO DE SALDO V16 (VERSÃO CORRIGIDA)\n');
  
  try {
    await ensureDir(REPORTS_DIR);
    await ensureDir(LOGS_DIR);
    
    const statusPermitidos = await verificarStatusPermitidos();
    
    try {
      const result = await adicionarSaldoAPI(statusPermitidos);
      await log('✅ Saldo adicionado com sucesso via API');
      
      // Salvar resultado
      await fs.writeFile(
        path.join(LOGS_DIR, 'v16-correcao-saldo-final.json'),
        JSON.stringify(result, null, 2)
      );
      
      console.log('\n✅ CORREÇÃO CONCLUÍDA\n');
      console.log(`Saldo anterior: R$ ${result.saldoAnterior}`);
      console.log(`Saldo posterior: R$ ${result.saldoPosterior}`);
      console.log(`Transação ID: ${result.txId}`);
      console.log(`Status usado: ${result.status}`);
      
    } catch (e) {
      if (e.message.includes('SERVICE_ROLE_KEY') || e.response?.status === 401) {
        await log('⚠️ API não disponível - gerando SQL corrigido');
        await gerarSQLCorrigido();
        console.log('\n⚠️ Execute o SQL manualmente via Supabase Dashboard');
        console.log('Arquivo: docs/GO-LIVE/V16-SQL-CORRIGIDO-FINAL.md');
      } else {
        throw e;
      }
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
    await gerarSQLCorrigido();
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };

