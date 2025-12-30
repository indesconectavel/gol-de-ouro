/**
 * MIGRATE MEMORY LOTES TO DB - Migração de Lotes em Memória para Banco
 * Migra lotesAtivos e arrays lote.chutes para persistência completa no banco
 */

const fs = require('fs').promises;
const path = require('path');
const { supabaseAdmin } = require('../../database/supabase-config');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const CONFIRMATION_DIR = path.join(__dirname, '..', '..', 'BACKUP-V19-SNAPSHOT', 'migration_confirmations');

let logFile = null;
const migrationReport = {
  inicio: new Date().toISOString(),
  lotes_migrados: 0,
  chutes_migrados: 0,
  inconsistencias: [],
  erros: []
};

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
  }
}

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  if (logFile) {
    fs.appendFile(logFile, logMessage + '\n', 'utf8').catch(() => {});
  }
}

async function obterEstadoLotesMemoria() {
  log('============================================================');
  log(' OBTENDO ESTADO DE LOTES EM MEMÓRIA');
  log('============================================================');
  log('');

  // Tentar obter via endpoint interno (se existir)
  try {
    const axios = require('axios');
    const response = await axios.get('http://localhost:8080/internal/state-lotes', {
      timeout: 5000
    });
    
    if (response.data && response.data.lotes) {
      log(`✅ Estado obtido via endpoint interno: ${response.data.lotes.length} lotes`);
      return response.data.lotes;
    }
  } catch (e) {
    log(`⚠️  Endpoint interno não disponível: ${e.message}`, 'WARN');
  }

  // Fallback: tentar ler snapshot JSON local
  const snapshotFile = path.join(__dirname, '..', '..', 'logs', 'lotes-snapshot.json');
  try {
    const content = await fs.readFile(snapshotFile, 'utf8');
    const snapshot = JSON.parse(content);
    log(`✅ Estado obtido via snapshot local: ${snapshot.lotes?.length || 0} lotes`);
    return snapshot.lotes || [];
  } catch (e) {
    log(`⚠️  Snapshot local não encontrado: ${e.message}`, 'WARN');
  }

  // Se não conseguir obter estado em memória, buscar lotes ativos do banco
  log('⚠️  Não foi possível obter estado em memória, buscando lotes ativos do banco...', 'WARN');
  
  const { data, error } = await supabaseAdmin
    .from('lotes')
    .select('*')
    .eq('status', 'ativo');
  
  if (error) {
    log(`❌ Erro ao buscar lotes do banco: ${error.message}`, 'ERROR');
    throw error;
  }
  
  log(`✅ Encontrados ${data.length} lotes ativos no banco`);
  return data.map(lote => ({
    id: lote.id,
    valor: lote.valor_aposta,
    ativo: lote.status === 'ativo',
    chutes: [], // Será reconstruído buscando do banco
    winnerIndex: lote.indice_vencedor,
    status: lote.status,
    posicao_atual: lote.posicao_atual || 0
  }));
}

async function buscarChutesDoLote(loteId) {
  const { data, error } = await supabaseAdmin
    .from('chutes')
    .select('*')
    .eq('lote_id', loteId)
    .order('created_at', { ascending: true });
  
  if (error) {
    log(`⚠️  Erro ao buscar chutes do lote ${loteId}: ${error.message}`, 'WARN');
    return [];
  }
  
  return data || [];
}

async function migrarLote(lote, tentativa = 1) {
  const maxTentativas = 5;
  
  try {
    // Buscar chutes existentes do lote
    const chutesExistentes = await buscarChutesDoLote(lote.id);
    const chutesExistentesIds = new Set(chutesExistentes.map(c => c.id));
    
    // Buscar chutes em memória (se disponível)
    const chutesMemoria = lote.chutes || [];
    
    // Reconciliar: inserir chutes faltantes
    let chutesInseridos = 0;
    for (const chuteMemoria of chutesMemoria) {
      if (!chutesExistentesIds.has(chuteMemoria.id)) {
        // Inserir chute faltante
        const { error: insertError } = await supabaseAdmin
          .from('chutes')
          .insert({
            id: chuteMemoria.id || `${lote.id}_${Date.now()}_${Math.random()}`,
            lote_id: lote.id,
            usuario_id: chuteMemoria.userId || chuteMemoria.usuario_id,
            direcao: chuteMemoria.direction || chuteMemoria.direcao,
            valor_aposta: chuteMemoria.amount || chuteMemoria.valor_aposta,
            resultado: chuteMemoria.result || chuteMemoria.resultado,
            premio: chuteMemoria.premio || 0,
            premio_gol_de_ouro: chuteMemoria.premioGolDeOuro || 0,
            is_gol_de_ouro: chuteMemoria.isGolDeOuro || false,
            created_at: chuteMemoria.createdAt || chuteMemoria.created_at || new Date().toISOString()
          });
        
        if (insertError) {
          log(`⚠️  Erro ao inserir chute ${chuteMemoria.id}: ${insertError.message}`, 'WARN');
          migrationReport.inconsistencias.push({
            tipo: 'chute_nao_inserido',
            lote_id: lote.id,
            chute_id: chuteMemoria.id,
            erro: insertError.message
          });
        } else {
          chutesInseridos++;
        }
      }
    }
    
    // Atualizar lote com posição atual e contador global
    const posicaoAtual = Math.max(
      lote.posicao_atual || 0,
      chutesExistentes.length + chutesInseridos
    );
    
    const { error: updateError } = await supabaseAdmin
      .from('lotes')
      .update({
        posicao_atual: posicaoAtual,
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', lote.id);
    
    if (updateError) {
      throw updateError;
    }
    
    migrationReport.chutes_migrados += chutesInseridos;
    log(`✅ Lote ${lote.id} migrado: ${chutesInseridos} chutes inseridos, posição atual: ${posicaoAtual}`);
    
    return true;
  } catch (error) {
    if (tentativa < maxTentativas) {
      const delay = Math.pow(2, tentativa) * 1000; // Backoff exponencial
      log(`⚠️  Erro na tentativa ${tentativa}/${maxTentativas}, tentando novamente em ${delay}ms...`, 'WARN');
      await new Promise(resolve => setTimeout(resolve, delay));
      return migrarLote(lote, tentativa + 1);
    } else {
      log(`❌ Erro ao migrar lote ${lote.id} após ${maxTentativas} tentativas: ${error.message}`, 'ERROR');
      migrationReport.erros.push({
        lote_id: lote.id,
        erro: error.message
      });
      return false;
    }
  }
}

async function atualizarHeartbeat() {
  const instanceId = process.env.INSTANCE_ID || `instance_${Date.now()}`;
  
  const { error } = await supabaseAdmin
    .from('system_heartbeat')
    .upsert({
      instance_id: instanceId,
      last_seen: new Date().toISOString(),
      metadata: {
        migration_completed: true,
        timestamp: new Date().toISOString()
      }
    }, {
      onConflict: 'instance_id'
    });
  
  if (error) {
    log(`⚠️  Erro ao atualizar heartbeat: ${error.message}`, 'WARN');
  } else {
    log(`✅ Heartbeat atualizado: ${instanceId}`);
  }
}

async function salvarConfirmacao() {
  await ensureDir(CONFIRMATION_DIR);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const confirmationFile = path.join(CONFIRMATION_DIR, `${timestamp}.json`);
  
  migrationReport.fim = new Date().toISOString();
  migrationReport.duracao = new Date(migrationReport.fim) - new Date(migrationReport.inicio);
  
  await fs.writeFile(
    confirmationFile,
    JSON.stringify(migrationReport, null, 2),
    'utf8'
  );
  
  log(`✅ Confirmação salva em: ${confirmationFile}`);
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  logFile = path.join(LOG_DIR, `migrate-memory-${timestamp}.log`);
  
  await ensureDir(LOG_DIR);
  
  try {
    log('============================================================');
    log(' MIGRAÇÃO DE LOTES EM MEMÓRIA PARA BANCO');
    log('============================================================');
    log('');
    
    // Obter estado atual
    const lotesMemoria = await obterEstadoLotesMemoria();
    
    if (lotesMemoria.length === 0) {
      log('⚠️  Nenhum lote em memória encontrado para migrar');
      log('   Verificando lotes ativos no banco...');
    }
    
    // Migrar cada lote
    log('');
    log(`📦 Migrando ${lotesMemoria.length} lote(s)...`);
    log('');
    
    for (const lote of lotesMemoria) {
      const sucesso = await migrarLote(lote);
      if (sucesso) {
        migrationReport.lotes_migrados++;
      }
    }
    
    // Atualizar heartbeat
    await atualizarHeartbeat();
    
    // Salvar confirmação
    await salvarConfirmacao();
    
    log('');
    log('============================================================');
    log(' MIGRAÇÃO CONCLUÍDA');
    log('============================================================');
    log(`Lotes migrados: ${migrationReport.lotes_migrados}`);
    log(`Chutes migrados: ${migrationReport.chutes_migrados}`);
    log(`Inconsistências: ${migrationReport.inconsistencias.length}`);
    log(`Erros: ${migrationReport.erros.length}`);
    log('');
    log(`Log completo: ${logFile}`);
    
    // Salvar relatório
    const reportFile = path.join(LOG_DIR, `migration_report_${timestamp}.json`);
    await fs.writeFile(reportFile, JSON.stringify(migrationReport, null, 2), 'utf8');
    log(`Relatório salvo: ${reportFile}`);
    
    process.exit(0);
  } catch (error) {
    log(`❌ ERRO CRÍTICO: ${error.message}`, 'ERROR');
    log(`Stack: ${error.stack}`, 'ERROR');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrarLote, obterEstadoLotesMemoria };

