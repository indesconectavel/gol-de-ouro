/**
 * Cliente Supabase Unificado V19
 * Lê credenciais do cofre seguro do Cursor/GitHub Secrets
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

/**
 * Obtém cliente Supabase para ambiente específico
 * @param {string} env - 'STG' ou 'PROD'
 * @returns {object} Cliente Supabase configurado
 */
function getClient(env) {
  const envUpper = env.toUpperCase();
  
  // Tentar ler do .env primeiro (desenvolvimento local)
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }

  // Obter credenciais do ambiente
  const url = process.env[`SUPABASE_URL_${envUpper}`] || 
               (envUpper === 'STG' ? process.env.SUPABASE_URL_STAGING : process.env.SUPABASE_URL_PRODUCTION) ||
               process.env.SUPABASE_URL;
  
  const key = process.env[`SUPABASE_SERVICE_ROLE_KEY_${envUpper}`] ||
              (envUpper === 'STG' ? process.env.SUPABASE_SERVICE_ROLE_KEY_STAGING : process.env.SUPABASE_SERVICE_ROLE_KEY_PRODUCTION) ||
              process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(`Missing Supabase credentials for ${envUpper}. Required: SUPABASE_URL_${envUpper} and SUPABASE_SERVICE_ROLE_KEY_${envUpper}`);
  }

  // Validar formato da URL
  if (!url.startsWith('https://')) {
    throw new Error(`Invalid Supabase URL format for ${envUpper}: ${url}`);
  }

  // Validar formato da key (service role keys são longas)
  if (key.length < 100) {
    throw new Error(`Invalid Supabase Service Role Key format for ${envUpper}`);
  }

  const client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-from-automation': 'cursor-v19',
        'x-environment': envUpper,
        'x-client-info': `goldeouro-backend-automation-${envUpper}`
      }
    }
  });

  return client;
}

/**
 * Obtém cliente admin (service role) para operações privilegiadas
 * @param {string} env - 'STG' ou 'PROD'
 * @returns {object} Cliente Supabase Admin
 */
function getAdminClient(env) {
  return getClient(env);
}

/**
 * Executa query SQL usando RPC (se disponível) ou método direto
 * @param {object} client - Cliente Supabase
 * @param {string} sql - Query SQL a executar
 * @param {string} env - Ambiente (para logs)
 * @returns {Promise<object>} Resultado da query
 */
async function executeSql(client, sql, env = 'UNKNOWN') {
  try {
    // Tentar usar RPC execute_sql_query se disponível
    const { data: rpcData, error: rpcError } = await client.rpc('execute_sql_query', { 
      query: sql 
    }).catch(() => ({ data: null, error: null }));

    if (!rpcError && rpcData) {
      return { data: rpcData, error: null };
    }

    // Fallback: usar método direto via REST API
    // Nota: Supabase não permite execução SQL direta via REST
    // Este é um placeholder - implementação real requer pg_dump ou API customizada
    throw new Error('Direct SQL execution not available. Use Supabase SQL Editor or pg_dump.');
  } catch (error) {
    console.error(`[${env}] [ERROR] Erro ao executar SQL:`, error.message);
    throw error;
  }
}

/**
 * Redact secrets dos logs
 * @param {string} text - Texto que pode conter secrets
 * @returns {string} Texto com secrets redacted
 */
function redactSecrets(text) {
  if (!text) return text;
  
  return text
    .replace(/SUPABASE_SERVICE_ROLE_KEY_[A-Z_]+=[^\s]+/gi, 'SUPABASE_SERVICE_ROLE_KEY_***=REDACTED')
    .replace(/eyJ[A-Za-z0-9_-]{100,}/g, 'eyJ***REDACTED')
    .replace(/https:\/\/[a-z0-9]+\.supabase\.co/g, 'https://***.supabase.co');
}

module.exports = {
  getClient,
  getAdminClient,
  executeSql,
  redactSecrets
};
