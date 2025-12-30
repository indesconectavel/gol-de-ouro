// ============================================================
// VERIFICAÇÃO SUPREMA V19 - ETAPA 2: VALIDAR .ENV
// ============================================================
// Data: 2025-01-24
// Objetivo: Validar todas as variáveis de ambiente obrigatórias

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const validacao = {
  timestamp: new Date().toISOString(),
  arquivo_env: '.env',
  arquivo_env_existe: false,
  variaveis: {},
  resumo: {
    total_obrigatorias: 0,
    total_definidas: 0,
    total_faltando: 0,
    total_corretas: 0,
    total_incorretas: 0,
    total_opcionais_definidas: 0
  },
  problemas: [],
  sugestoes: []
};

// Variáveis obrigatórias
const VARIAVEIS_OBRIGATORIAS = {
  SUPABASE_URL: {
    obrigatoria: true,
    tipo: 'string',
    formato: 'url',
    descricao: 'URL do projeto Supabase'
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    obrigatoria: true,
    tipo: 'string',
    formato: 'key',
    descricao: 'Chave de serviço do Supabase (SRK)'
  },
  SUPABASE_ANON_KEY: {
    obrigatoria: true,
    tipo: 'string',
    formato: 'key',
    descricao: 'Chave anônima do Supabase'
  },
  JWT_SECRET: {
    obrigatoria: true,
    tipo: 'string',
    formato: 'secret',
    descricao: 'Chave secreta para JWT'
  },
  NODE_ENV: {
    obrigatoria: true,
    tipo: 'string',
    valores_validos: ['development', 'production', 'test'],
    descricao: 'Ambiente de execução'
  },
  PORT: {
    obrigatoria: true,
    tipo: 'number',
    descricao: 'Porta do servidor'
  }
};

// Variáveis ENGINE V19
const VARIAVEIS_ENGINE_V19 = {
  USE_ENGINE_V19: {
    obrigatoria: true,
    tipo: 'boolean',
    valor_padrao: 'true',
    descricao: 'Ativar ENGINE V19'
  },
  USE_DB_QUEUE: {
    obrigatoria: false,
    tipo: 'boolean',
    valor_padrao: 'false',
    descricao: 'Usar fila em banco de dados'
  },
  ENGINE_HEARTBEAT_ENABLED: {
    obrigatoria: true,
    tipo: 'boolean',
    valor_padrao: 'true',
    descricao: 'Ativar heartbeat da ENGINE V19'
  },
  ENGINE_MONITOR_ENABLED: {
    obrigatoria: true,
    tipo: 'boolean',
    valor_padrao: 'true',
    descricao: 'Ativar monitoramento da ENGINE V19'
  },
  HEARTBEAT_INTERVAL_MS: {
    obrigatoria: false,
    tipo: 'number',
    valor_padrao: '5000',
    descricao: 'Intervalo do heartbeat em milissegundos'
  },
  INSTANCE_ID: {
    obrigatoria: false,
    tipo: 'string',
    valor_padrao: 'instance-1',
    descricao: 'ID da instância'
  }
};

// Variáveis opcionais importantes
const VARIAVEIS_OPCIONAIS = {
  MERCADOPAGO_ACCESS_TOKEN: {
    obrigatoria: false,
    tipo: 'string',
    descricao: 'Token de acesso do Mercado Pago'
  },
  MERCADOPAGO_PUBLIC_KEY: {
    obrigatoria: false,
    tipo: 'string',
    descricao: 'Chave pública do Mercado Pago'
  },
  FRONTEND_URL: {
    obrigatoria: false,
    tipo: 'string',
    formato: 'url',
    descricao: 'URL do frontend admin'
  },
  PLAYER_URL: {
    obrigatoria: false,
    tipo: 'string',
    formato: 'url',
    descricao: 'URL do frontend player'
  },
  BACKEND_URL: {
    obrigatoria: false,
    tipo: 'string',
    formato: 'url',
    descricao: 'URL do backend'
  }
};

function validarFormato(valor, formato) {
  if (!valor) return false;
  
  switch (formato) {
    case 'url':
      return valor.startsWith('http://') || valor.startsWith('https://');
    case 'key':
      return valor.length > 20;
    case 'secret':
      return valor.length > 10;
    default:
      return true;
  }
}

function validarTipo(valor, tipo) {
  if (!valor) return false;
  
  switch (tipo) {
    case 'boolean':
      return valor === 'true' || valor === 'false';
    case 'number':
      return !isNaN(Number(valor));
    case 'string':
      return typeof valor === 'string';
    default:
      return true;
  }
}

function validarValor(valor, valoresValidos) {
  if (!valoresValidos) return true;
  return valoresValidos.includes(valor);
}

// Verificar se .env existe
validacao.arquivo_env_existe = fs.existsSync('.env');

if (!validacao.arquivo_env_existe) {
  validacao.problemas.push('❌ Arquivo .env não encontrado!');
  validacao.sugestoes.push('Criar arquivo .env baseado em env.example');
}

// Validar variáveis obrigatórias
console.log('🔍 Validando variáveis obrigatórias...');
for (const [varName, config] of Object.entries(VARIAVEIS_OBRIGATORIAS)) {
  validacao.resumo.total_obrigatorias++;
  const valor = process.env[varName];
  const definida = !!valor;
  
  validacao.variaveis[varName] = {
    definida,
    obrigatoria: true,
    valor: definida ? (varName.includes('KEY') || varName.includes('SECRET') ? '***' : valor) : null,
    tipo: config.tipo,
    descricao: config.descricao,
    correta: false,
    problemas: []
  };
  
  if (!definida) {
    validacao.resumo.total_faltando++;
    validacao.variaveis[varName].problemas.push('Variável não definida');
    validacao.problemas.push(`❌ ${varName} não definida (obrigatória)`);
  } else {
    validacao.resumo.total_definidas++;
    
    // Validar tipo
    if (!validarTipo(valor, config.tipo)) {
      validacao.variaveis[varName].problemas.push(`Tipo inválido (esperado: ${config.tipo})`);
      validacao.resumo.total_incorretas++;
    }
    
    // Validar formato
    if (config.formato && !validarFormato(valor, config.formato)) {
      validacao.variaveis[varName].problemas.push(`Formato inválido (esperado: ${config.formato})`);
      validacao.resumo.total_incorretas++;
    }
    
    // Validar valores
    if (config.valores_validos && !validarValor(valor, config.valores_validos)) {
      validacao.variaveis[varName].problemas.push(`Valor inválido (esperado: ${config.valores_validos.join(', ')})`);
      validacao.resumo.total_incorretas++;
    }
    
    if (validacao.variaveis[varName].problemas.length === 0) {
      validacao.variaveis[varName].correta = true;
      validacao.resumo.total_corretas++;
    }
  }
}

// Validar variáveis ENGINE V19
console.log('⚙️ Validando variáveis ENGINE V19...');
for (const [varName, config] of Object.entries(VARIAVEIS_ENGINE_V19)) {
  const valor = process.env[varName];
  const definida = !!valor;
  
  validacao.variaveis[varName] = {
    definida,
    obrigatoria: config.obrigatoria,
    valor: definida ? valor : config.valor_padrao,
    tipo: config.tipo,
    descricao: config.descricao,
    valor_padrao: config.valor_padrao,
    correta: false,
    problemas: []
  };
  
  if (!definida) {
    if (config.obrigatoria) {
      validacao.resumo.total_faltando++;
      validacao.variaveis[varName].problemas.push('Variável não definida (será usado valor padrão)');
      validacao.problemas.push(`⚠️ ${varName} não definida (obrigatória, padrão: ${config.valor_padrao})`);
    } else {
      validacao.variaveis[varName].problemas.push('Variável não definida (opcional)');
    }
  } else {
    validacao.resumo.total_definidas++;
    
    // Validar tipo
    if (!validarTipo(valor, config.tipo)) {
      validacao.variaveis[varName].problemas.push(`Tipo inválido (esperado: ${config.tipo})`);
      validacao.resumo.total_incorretas++;
    } else {
      validacao.variaveis[varName].correta = true;
      validacao.resumo.total_corretas++;
    }
  }
}

// Validar variáveis opcionais
console.log('📋 Validando variáveis opcionais...');
for (const [varName, config] of Object.entries(VARIAVEIS_OPCIONAIS)) {
  const valor = process.env[varName];
  const definida = !!valor;
  
  if (definida) {
    validacao.resumo.total_opcionais_definidas++;
    validacao.variaveis[varName] = {
      definida: true,
      obrigatoria: false,
      valor: varName.includes('KEY') || varName.includes('TOKEN') ? '***' : valor,
      tipo: config.tipo,
      descricao: config.descricao,
      correta: true
    };
    
    if (config.formato && !validarFormato(valor, config.formato)) {
      validacao.variaveis[varName].correta = false;
      validacao.variaveis[varName].problemas = [`Formato inválido (esperado: ${config.formato})`];
    }
  }
}

// Gerar .env.fixed
console.log('🔧 Gerando .env.fixed...');
const envFixed = [];
const envExample = fs.existsSync('env.example') 
  ? fs.readFileSync('env.example', 'utf8').split('\n')
  : [];

// Adicionar variáveis corrigidas
for (const [varName, info] of Object.entries(validacao.variaveis)) {
  if (!info.definida && info.obrigatoria) {
    envFixed.push(`# ${info.descricao}`);
    if (info.valor_padrao) {
      envFixed.push(`${varName}=${info.valor_padrao}`);
    } else {
      envFixed.push(`${varName}=your-${varName.toLowerCase().replace(/_/g, '-')}`);
    }
    envFixed.push('');
  }
}

// Salvar resultados
const outputDir = 'logs/v19/VERIFICACAO_SUPREMA';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputFile = path.join(outputDir, '02_env_validacao.json');
fs.writeFileSync(outputFile, JSON.stringify(validacao, null, 2), 'utf8');

const envFixedFile = path.join(outputDir, '.env.fixed');
if (envFixed.length > 0) {
  fs.writeFileSync(envFixedFile, envFixed.join('\n'), 'utf8');
  console.log(`💾 Arquivo .env.fixed criado: ${envFixedFile}`);
}

console.log('\n✅ Validação de .env concluída!');
console.log(`📊 Resumo:`);
console.log(`   - Obrigatórias: ${validacao.resumo.total_obrigatorias}`);
console.log(`   - Definidas: ${validacao.resumo.total_definidas}`);
console.log(`   - Faltando: ${validacao.resumo.total_faltando}`);
console.log(`   - Corretas: ${validacao.resumo.total_corretas}`);
console.log(`   - Incorretas: ${validacao.resumo.total_incorretas}`);
console.log(`   - Problemas: ${validacao.problemas.length}`);
console.log(`\n💾 Salvo em: ${outputFile}`);

if (validacao.problemas.length > 0) {
  console.log('\n⚠️ Problemas encontrados:');
  validacao.problemas.forEach(p => console.log(`   ${p}`));
}

module.exports = validacao;

