/**
 * Exportar Banco Supabase - MISSÃO C
 * Exporta schema e dados críticos do banco de dados Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Função para exportar schema
async function exportarSchema() {
    console.log('📋 Exportando schema do banco de dados...');
    
    // Usar método alternativo que gera um schema básico
    // Para schema completo, recomenda-se usar pg_dump ou Supabase Dashboard
    return await exportarSchemaAlternativo();
}

// Método alternativo de exportação de schema
async function exportarSchemaAlternativo() {
    console.log('📋 Usando método alternativo para exportar schema...');
    
    let schemaSQL = '-- SCHEMA EXPORT - GOL DE OURO (Método Alternativo)\n';
    schemaSQL += `-- Data: ${new Date().toISOString()}\n`;
    schemaSQL += '-- MISSÃO C\n\n';
    schemaSQL += '-- NOTA: Este é um backup básico do schema.\n';
    schemaSQL += '-- Para schema completo, use pg_dump ou Supabase Dashboard.\n\n';
    
    // Lista de tabelas conhecidas do sistema
    const tabelasConhecidas = [
        'usuarios',
        'lotes',
        'chutes',
        'transacoes',
        'pagamentos',
        'saldos',
        'configuracoes'
    ];
    
    schemaSQL += '-- Tabelas principais do sistema:\n';
    tabelasConhecidas.forEach(table => {
        schemaSQL += `-- - ${table}\n`;
    });
    
    schemaSQL += '\n-- Para obter o schema completo, execute no Supabase SQL Editor:\n';
    schemaSQL += '-- SELECT * FROM information_schema.tables WHERE table_schema = \'public\';\n';
    
    return schemaSQL;
}

// Função para exportar dados críticos
async function exportarDadosCriticos() {
    console.log('📊 Exportando dados críticos...');
    
    let dataSQL = '-- DADOS CRÍTICOS EXPORT - GOL DE OURO\n';
    dataSQL += `-- Data: ${new Date().toISOString()}\n`;
    dataSQL += '-- MISSÃO C\n\n';
    dataSQL += '-- ATENÇÃO: Este arquivo contém apenas dados críticos para restauração\n';
    dataSQL += '-- Não inclui dados sensíveis ou pessoais\n\n';
    
    try {
        // Exportar configurações
        const { data: configs, error: configsError } = await supabase
            .from('configuracoes')
            .select('*');
        
        if (!configsError && configs && configs.length > 0) {
            dataSQL += '-- Configurações do Sistema\n';
            dataSQL += 'INSERT INTO configuracoes (id, chave, valor, created_at, updated_at) VALUES\n';
            
            configs.forEach((config, index) => {
                dataSQL += `  ('${config.id}', '${config.chave}', '${config.valor}', '${config.created_at}', '${config.updated_at}')`;
                if (index < configs.length - 1) {
                    dataSQL += ',\n';
                } else {
                    dataSQL += ';\n\n';
                }
            });
        }
        
        // Exportar estrutura de lotes (sem dados pessoais)
        const { data: lotes, error: lotesError } = await supabase
            .from('lotes')
            .select('id, status, created_at, updated_at')
            .limit(10);
        
        if (!lotesError && lotes && lotes.length > 0) {
            dataSQL += '-- Estrutura de Lotes (exemplo)\n';
            dataSQL += '-- Apenas IDs e status, sem dados pessoais\n';
            dataSQL += 'INSERT INTO lotes (id, status, created_at, updated_at) VALUES\n';
            
            lotes.forEach((lote, index) => {
                dataSQL += `  ('${lote.id}', '${lote.status}', '${lote.created_at}', '${lote.updated_at}')`;
                if (index < lotes.length - 1) {
                    dataSQL += ',\n';
                } else {
                    dataSQL += ';\n\n';
                }
            });
        }
        
        dataSQL += '-- NOTA: Dados pessoais e transações financeiras não foram incluídos por segurança.\n';
        dataSQL += '-- Para backup completo, use pg_dump ou Supabase Dashboard.\n';
        
        return dataSQL;
    } catch (error) {
        console.error('❌ Erro ao exportar dados críticos:', error.message);
        return dataSQL + `\n-- ERRO: ${error.message}\n`;
    }
}

// Função principal
async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🚀 EXPORTAÇÃO DO BANCO DE DADOS SUPABASE');
    console.log('═══════════════════════════════════════════════════\n');
    
    try {
        // Exportar schema
        const schemaSQL = await exportarSchema();
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        fs.writeFileSync(schemaPath, schemaSQL, 'utf8');
        console.log(`✅ Schema exportado: ${schemaPath}`);
        
        // Exportar dados críticos
        const dataSQL = await exportarDadosCriticos();
        const dataPath = path.join(__dirname, '..', 'data-critical.sql');
        fs.writeFileSync(dataPath, dataSQL, 'utf8');
        console.log(`✅ Dados críticos exportados: ${dataPath}`);
        
        console.log('\n✅ Exportação concluída com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro na exportação:', error);
        process.exit(1);
    }
}

// Executar
if (require.main === module) {
    main();
}

module.exports = { exportarSchema, exportarDadosCriticos };

