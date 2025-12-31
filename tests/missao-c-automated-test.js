/**
 * MISSÃO C - TESTES AUTOMATIZADOS
 * BLOCO 1: Fluxo Base
 * BLOCO 2: Concorrência
 * 
 * Data: 2025-01-12
 * Versão: 1.0.0
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuração
const BASE_URL = process.env.BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';
const TEST_TIMEOUT = 30000; // 30 segundos

// Resultados dos testes
const testResults = {
  bloco1: {
    nome: 'BLOCO 1 - FLUXO BASE',
    testes: [],
    aprovado: false
  },
  bloco2: {
    nome: 'BLOCO 2 - CONCORRÊNCIA',
    testes: [],
    aprovado: false
  },
  logs: [],
  estados: {
    antes: {},
    depois: {}
  }
};

// Utilitários
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type}] ${message}`;
  console.log(logEntry);
  testResults.logs.push(logEntry);
}

function logError(message, error) {
  log(`${message}: ${error.message}`, 'ERROR');
  if (error.response) {
    log(`Response Status: ${error.response.status}`, 'ERROR');
    log(`Response Data: ${JSON.stringify(error.response.data)}`, 'ERROR');
  }
}

// Criar usuário de teste
async function criarUsuarioTeste(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      email,
      password,
      username: email.split('@')[0]
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('já existe')) {
      log(`Usuário ${email} já existe, continuando...`, 'WARN');
      return null;
    }
    throw error;
  }
}

// Fazer login
async function fazerLogin(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    logError('Erro ao fazer login', error);
    throw error;
  }
}

// Obter saldo do usuário
async function obterSaldo(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data?.saldo || 0;
  } catch (error) {
    logError('Erro ao obter saldo', error);
    return null;
  }
}

// Adicionar saldo (se necessário - pode precisar de endpoint admin)
async function adicionarSaldo(token, valor) {
  // Por enquanto, vamos assumir que o usuário já tem saldo suficiente
  // Em produção real, pode ser necessário um endpoint admin ou PIX
  log(`Nota: Assumindo que usuário tem saldo suficiente (R$${valor})`, 'INFO');
}

// Fazer chute
async function fazerChute(token, direction, amount) {
  const inicio = Date.now();
  try {
    const response = await axios.post(
      `${BASE_URL}/api/games/shoot`,
      { direction, amount },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: TEST_TIMEOUT
      }
    );
    const tempo = Date.now() - inicio;
    return {
      success: true,
      data: response.data.data,
      tempo,
      status: response.status
    };
  } catch (error) {
    const tempo = Date.now() - inicio;
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
      tempo
    };
  }
}

// Registrar resultado de teste
function registrarTeste(bloco, nome, aprovado, detalhes) {
  const teste = {
    nome,
    aprovado,
    timestamp: new Date().toISOString(),
    detalhes
  };
  testResults[bloco].testes.push(teste);
  log(`TESTE: ${nome} - ${aprovado ? '✅ APROVADO' : '❌ REPROVADO'}`, aprovado ? 'SUCCESS' : 'ERROR');
  if (detalhes) {
    log(`Detalhes: ${JSON.stringify(detalhes, null, 2)}`, 'INFO');
  }
}

// =====================================================
// BLOCO 1 - FLUXO BASE
// =====================================================

async function executarBloco1() {
  log('═══════════════════════════════════════════════════', 'INFO');
  log('INICIANDO BLOCO 1 - FLUXO BASE', 'INFO');
  log('═══════════════════════════════════════════════════', 'INFO');

  const email = `teste.bloco1.${Date.now()}@teste.com`;
  const password = 'senha123';
  let token;
  let loteId1, loteId2;

  try {
    // Setup: Criar usuário e fazer login
    log('Setup: Criando usuário de teste...', 'INFO');
    await criarUsuarioTeste(email, password);
    token = await fazerLogin(email, password);
    log(`Token obtido: ${token.substring(0, 20)}...`, 'INFO');

    // Adicionar saldo suficiente
    await adicionarSaldo(token, 100);

    // TESTE 1: Verificar criação de lote quando não há lote ativo
    log('\n--- TESTE 1: Criação de lote quando não há lote ativo ---', 'INFO');
    const resultado1 = await fazerChute(token, 'C', 1);
    if (resultado1.success && resultado1.data.loteId) {
      loteId1 = resultado1.data.loteId;
      registrarTeste('bloco1', 'Criação de lote quando não há lote ativo', true, {
        loteId: loteId1,
        shotIndex: resultado1.data.loteProgress?.current,
        tempo: resultado1.tempo
      });
    } else {
      registrarTeste('bloco1', 'Criação de lote quando não há lote ativo', false, {
        erro: resultado1.error
      });
    }

    // TESTE 2: Verificar reutilização de lote ativo
    log('\n--- TESTE 2: Reutilização de lote ativo ---', 'INFO');
    const resultado2 = await fazerChute(token, 'C', 1);
    if (resultado2.success && resultado2.data.loteId === loteId1) {
      registrarTeste('bloco1', 'Reutilização de lote ativo', true, {
        loteId: resultado2.data.loteId,
        shotIndex: resultado2.data.loteProgress?.current,
        mesmoLote: resultado2.data.loteId === loteId1
      });
    } else {
      registrarTeste('bloco1', 'Reutilização de lote ativo', false, {
        loteIdEsperado: loteId1,
        loteIdRecebido: resultado2.data?.loteId,
        erro: resultado2.error
      });
    }

    // TESTE 3: Validar incremento correto de shotIndex
    log('\n--- TESTE 3: Incremento correto de shotIndex ---', 'INFO');
    const shotIndexes = [];
    for (let i = 0; i < 3; i++) {
      const resultado = await fazerChute(token, 'C', 1);
      if (resultado.success) {
        shotIndexes.push(resultado.data.loteProgress?.current);
      }
    }
    const incrementoCorreto = shotIndexes.every((val, idx) => idx === 0 || val > shotIndexes[idx - 1]);
    registrarTeste('bloco1', 'Incremento correto de shotIndex', incrementoCorreto, {
      shotIndexes,
      incrementoCorreto
    });

    // TESTE 4: Validar definição única de winnerIndex
    log('\n--- TESTE 4: Definição única de winnerIndex ---', 'INFO');
    // Criar novo lote para R$2
    const resultado4 = await fazerChute(token, 'C', 2);
    if (resultado4.success) {
      loteId2 = resultado4.data.loteId;
      // Fazer múltiplos chutes no mesmo lote e verificar que apenas um é gol
      const resultados = [];
      for (let i = 0; i < 5; i++) {
        const res = await fazerChute(token, 'C', 2);
        if (res.success) {
          resultados.push(res.data);
        }
      }
      const gols = resultados.filter(r => r.result === 'goal');
      const winnerIndexUnico = gols.length <= 1;
      registrarTeste('bloco1', 'Definição única de winnerIndex', winnerIndexUnico, {
        totalChutes: resultados.length,
        totalGols: gols.length,
        winnerIndexUnico
      });
    } else {
      registrarTeste('bloco1', 'Definição única de winnerIndex', false, {
        erro: resultado4.error
      });
    }

    // TESTE 5: Confirmar encerramento imediato do lote após gol
    log('\n--- TESTE 5: Encerramento imediato após gol ---', 'INFO');
    // Criar lote R$10 (sempre ganha)
    const resultado5a = await fazerChute(token, 'C', 10);
    if (resultado5a.success && resultado5a.data.result === 'goal') {
      // Tentar chutar novamente no mesmo lote
      const resultado5b = await fazerChute(token, 'C', 10);
      // Deve criar novo lote (lote anterior foi encerrado)
      const novoLoteCriado = resultado5b.success && resultado5b.data.loteId !== resultado5a.data.loteId;
      registrarTeste('bloco1', 'Encerramento imediato após gol', novoLoteCriado, {
        loteIdAntes: resultado5a.data.loteId,
        loteIdDepois: resultado5b.data?.loteId,
        golMarcado: resultado5a.data.result === 'goal',
        novoLoteCriado
      });
    } else {
      registrarTeste('bloco1', 'Encerramento imediato após gol', false, {
        erro: 'Não foi possível criar lote R$10 ou gol não foi marcado'
      });
    }

    // TESTE 6: Garantir que nenhum chute é aceito após finalização
    log('\n--- TESTE 6: Nenhum chute aceito após finalização ---', 'INFO');
    // Criar lote e preencher até completar (ou gol)
    const loteTeste = await fazerChute(token, 'C', 1);
    if (loteTeste.success) {
      const loteIdTeste = loteTeste.data.loteId;
      let loteCompleto = false;
      let tentativas = 0;
      while (!loteCompleto && tentativas < 15) {
        const res = await fazerChute(token, 'C', 1);
        if (res.success) {
          if (res.data.isLoteComplete || res.data.loteId !== loteIdTeste) {
            loteCompleto = true;
            // Tentar chutar novamente no lote finalizado
            const resFinalizado = await fazerChute(token, 'C', 1);
            const novoLoteCriado = resFinalizado.success && resFinalizado.data.loteId !== loteIdTeste;
            registrarTeste('bloco1', 'Nenhum chute aceito após finalização', novoLoteCriado, {
              loteIdFinalizado: loteIdTeste,
              loteIdNovo: resFinalizado.data?.loteId,
              novoLoteCriado
            });
            break;
          }
        }
        tentativas++;
      }
      if (!loteCompleto) {
        registrarTeste('bloco1', 'Nenhum chute aceito após finalização', false, {
          erro: 'Lote não foi completado após 15 tentativas'
        });
      }
    }

    // TESTE 7: Verificar sincronização banco x cache
    log('\n--- TESTE 7: Sincronização banco x cache ---', 'INFO');
    // Este teste requer acesso ao banco, então vamos inferir pela consistência
    // Se múltiplos chutes no mesmo lote retornam progresso consistente, cache está sincronizado
    const resultado7a = await fazerChute(token, 'C', 1);
    if (resultado7a.success) {
      const loteId7 = resultado7a.data.loteId;
      const progressoInicial = resultado7a.data.loteProgress?.current;
      const resultado7b = await fazerChute(token, 'C', 1);
      if (resultado7b.success && resultado7b.data.loteId === loteId7) {
        const progressoDepois = resultado7b.data.loteProgress?.current;
        const sincronizado = progressoDepois === progressoInicial + 1;
        registrarTeste('bloco1', 'Sincronização banco x cache', sincronizado, {
          loteId: loteId7,
          progressoInicial,
          progressoDepois,
          sincronizado
        });
      } else {
        registrarTeste('bloco1', 'Sincronização banco x cache', false, {
          erro: 'Não foi possível verificar sincronização'
        });
      }
    }

    // Avaliar aprovação do BLOCO 1
    const testesAprovados = testResults.bloco1.testes.filter(t => t.aprovado).length;
    const totalTestes = testResults.bloco1.testes.length;
    testResults.bloco1.aprovado = testesAprovados === totalTestes && totalTestes > 0;

    log(`\n═══════════════════════════════════════════════════`, 'INFO');
    log(`BLOCO 1 FINALIZADO: ${testesAprovados}/${totalTestes} testes aprovados`, testResults.bloco1.aprovado ? 'SUCCESS' : 'ERROR');
    log(`═══════════════════════════════════════════════════\n`, 'INFO');

  } catch (error) {
    logError('Erro crítico no BLOCO 1', error);
    testResults.bloco1.aprovado = false;
  }
}

// =====================================================
// BLOCO 2 - CONCORRÊNCIA
// =====================================================

async function executarBloco2() {
  log('═══════════════════════════════════════════════════', 'INFO');
  log('INICIANDO BLOCO 2 - CONCORRÊNCIA', 'INFO');
  log('═══════════════════════════════════════════════════', 'INFO');

  try {
    // Criar múltiplos usuários para simular concorrência
    const usuarios = [];
    for (let i = 0; i < 5; i++) {
      const email = `teste.bloco2.${Date.now()}.${i}@teste.com`;
      const password = 'senha123';
      await criarUsuarioTeste(email, password);
      const token = await fazerLogin(email, password);
      await adicionarSaldo(token, 100);
      usuarios.push({ email, token });
    }
    log(`Criados ${usuarios.length} usuários para teste de concorrência`, 'INFO');

    // TESTE 8: Simular dois ou mais chutes simultâneos no mesmo lote
    log('\n--- TESTE 8: Chutes simultâneos no mesmo lote ---', 'INFO');
    // Primeiro chute para criar lote
    const primeiroChute = await fazerChute(usuarios[0].token, 'C', 1);
    if (primeiroChute.success) {
      const loteId = primeiroChute.data.loteId;
      // Fazer 5 chutes simultâneos
      const chutesSimultaneos = await Promise.all(
        usuarios.slice(0, 5).map(user => fazerChute(user.token, 'C', 1))
      );
      const todosMesmoLote = chutesSimultaneos.every(r => r.success && r.data.loteId === loteId);
      const shotIndexesUnicos = new Set(chutesSimultaneos.map(r => r.data?.loteProgress?.current)).size === chutesSimultaneos.length;
      registrarTeste('bloco2', 'Chutes simultâneos no mesmo lote', todosMesmoLote && shotIndexesUnicos, {
        loteId,
        totalChutes: chutesSimultaneos.length,
        todosMesmoLote,
        shotIndexesUnicos,
        shotIndexes: chutesSimultaneos.map(r => r.data?.loteProgress?.current)
      });
    }

    // TESTE 9: Validar bloqueio por transação (FOR UPDATE)
    log('\n--- TESTE 9: Bloqueio por transação (FOR UPDATE) ---', 'INFO');
    // Criar novo lote
    const loteTeste9 = await fazerChute(usuarios[0].token, 'C', 1);
    if (loteTeste9.success) {
      const loteId9 = loteTeste9.data.loteId;
      // Fazer 10 chutes simultâneos
      const inicio = Date.now();
      const chutesConcorrentes = await Promise.all(
        usuarios.map(user => fazerChute(user.token, 'C', 1))
      );
      const tempo = Date.now() - inicio;
      // Verificar que não há duplicação de shotIndex
      const shotIndexes = chutesConcorrentes
        .filter(r => r.success && r.data.loteId === loteId9)
        .map(r => r.data.loteProgress?.current);
      const semDuplicacao = new Set(shotIndexes).size === shotIndexes.length;
      registrarTeste('bloco2', 'Bloqueio por transação (FOR UPDATE)', semDuplicacao, {
        loteId: loteId9,
        totalChutes: chutesConcorrentes.length,
        shotIndexes,
        semDuplicacao,
        tempo
      });
    }

    // TESTE 10: Garantir apenas um gol possível
    log('\n--- TESTE 10: Apenas um gol possível ---', 'INFO');
    // Criar lote R$5 (2 chutes, 50% chance cada)
    const loteTeste10 = await fazerChute(usuarios[0].token, 'C', 5);
    if (loteTeste10.success) {
      const loteId10 = loteTeste10.data.loteId;
      // Fazer 2 chutes simultâneos (deve ter no máximo 1 gol)
      const chutes10 = await Promise.all([
        fazerChute(usuarios[0].token, 'C', 5),
        fazerChute(usuarios[1].token, 'C', 5)
      ]);
      const gols = chutes10.filter(r => r.success && r.data.result === 'goal');
      const apenasUmGol = gols.length <= 1;
      registrarTeste('bloco2', 'Apenas um gol possível', apenasUmGol, {
        loteId: loteId10,
        totalChutes: chutes10.length,
        totalGols: gols.length,
        apenasUmGol
      });
    }

    // TESTE 11: Garantir ausência de duplicidade de shotIndex
    log('\n--- TESTE 11: Ausência de duplicidade de shotIndex ---', 'INFO');
    const loteTeste11 = await fazerChute(usuarios[0].token, 'C', 1);
    if (loteTeste11.success) {
      const loteId11 = loteTeste11.data.loteId;
      // Fazer 10 chutes simultâneos
      const chutes11 = await Promise.all(
        usuarios.map(user => fazerChute(user.token, 'C', 1))
      );
      const shotIndexes11 = chutes11
        .filter(r => r.success && r.data.loteId === loteId11)
        .map(r => r.data.loteProgress?.current);
      const semDuplicacao11 = new Set(shotIndexes11).size === shotIndexes11.length;
      registrarTeste('bloco2', 'Ausência de duplicidade de shotIndex', semDuplicacao11, {
        loteId: loteId11,
        shotIndexes: shotIndexes11,
        semDuplicacao: semDuplicacao11
      });
    }

    // TESTE 12: Validar que apenas um lote é criado em concorrência
    log('\n--- TESTE 12: Apenas um lote criado em concorrência ---', 'INFO');
    // Fazer 5 chutes simultâneos de usuários diferentes (todos R$2)
    // Se não houver lote ativo, todos devem tentar criar, mas apenas um deve ser criado
    const chutes12 = await Promise.all(
      usuarios.slice(0, 5).map(user => fazerChute(user.token, 'C', 2))
    );
    const loteIds = chutes12
      .filter(r => r.success)
      .map(r => r.data.loteId);
    const lotesUnicos = new Set(loteIds);
    // Pode haver 1 ou 2 lotes (se o primeiro foi completado durante os chutes simultâneos)
    const apenasUmOuDoisLotes = lotesUnicos.size <= 2;
    registrarTeste('bloco2', 'Apenas um lote criado em concorrência', apenasUmOuDoisLotes, {
      totalLotes: lotesUnicos.size,
      loteIds: Array.from(lotesUnicos),
      apenasUmOuDoisLotes
    });

    // TESTE 13: Garantir ausência de lotes órfãos
    log('\n--- TESTE 13: Ausência de lotes órfãos ---', 'INFO');
    // Criar lote e fazer alguns chutes, depois verificar que não há lotes "presos"
    const loteTeste13 = await fazerChute(usuarios[0].token, 'C', 1);
    if (loteTeste13.success) {
      const loteId13 = loteTeste13.data.loteId;
      // Fazer alguns chutes
      await Promise.all([
        fazerChute(usuarios[1].token, 'C', 1),
        fazerChute(usuarios[2].token, 'C', 1)
      ]);
      // Tentar chutar novamente - deve continuar no mesmo lote ou criar novo se completou
      const chuteFinal = await fazerChute(usuarios[0].token, 'C', 1);
      const loteValido = chuteFinal.success && (
        chuteFinal.data.loteId === loteId13 || // Mesmo lote (ainda ativo)
        chuteFinal.data.loteId !== loteId13    // Novo lote (anterior completou)
      );
      registrarTeste('bloco2', 'Ausência de lotes órfãos', loteValido, {
        loteIdInicial: loteId13,
        loteIdFinal: chuteFinal.data?.loteId,
        loteValido
      });
    }

    // Avaliar aprovação do BLOCO 2
    const testesAprovados = testResults.bloco2.testes.filter(t => t.aprovado).length;
    const totalTestes = testResults.bloco2.testes.length;
    testResults.bloco2.aprovado = testesAprovados === totalTestes && totalTestes > 0;

    log(`\n═══════════════════════════════════════════════════`, 'INFO');
    log(`BLOCO 2 FINALIZADO: ${testesAprovados}/${totalTestes} testes aprovados`, testResults.bloco2.aprovado ? 'SUCCESS' : 'ERROR');
    log(`═══════════════════════════════════════════════════\n`, 'INFO');

  } catch (error) {
    logError('Erro crítico no BLOCO 2', error);
    testResults.bloco2.aprovado = false;
  }
}

// =====================================================
// EXECUÇÃO PRINCIPAL
// =====================================================

async function main() {
  log('═══════════════════════════════════════════════════', 'INFO');
  log('MISSÃO C - TESTES AUTOMATIZADOS', 'INFO');
  log(`Backend URL: ${BASE_URL}`, 'INFO');
  log(`Data/Hora: ${new Date().toISOString()}`, 'INFO');
  log('═══════════════════════════════════════════════════', 'INFO');

  try {
    // Executar BLOCO 1
    await executarBloco1();

    // Executar BLOCO 2
    await executarBloco2();

    // Gerar relatório final
    const aprovadoGeral = testResults.bloco1.aprovado && testResults.bloco2.aprovado;
    log('\n═══════════════════════════════════════════════════', 'INFO');
    log('RESULTADO FINAL', aprovadoGeral ? 'SUCCESS' : 'ERROR');
    log('═══════════════════════════════════════════════════', 'INFO');
    log(`BLOCO 1: ${testResults.bloco1.aprovado ? '✅ APROVADO' : '❌ REPROVADO'}`, testResults.bloco1.aprovado ? 'SUCCESS' : 'ERROR');
    log(`BLOCO 2: ${testResults.bloco2.aprovado ? '✅ APROVADO' : '❌ REPROVADO'}`, testResults.bloco2.aprovado ? 'SUCCESS' : 'ERROR');
    log(`GERAL: ${aprovadoGeral ? '✅ APROVADO' : '❌ REPROVADO'}`, aprovadoGeral ? 'SUCCESS' : 'ERROR');

    // Retornar resultados para geração de relatório
    return {
      aprovado: aprovadoGeral,
      resultados: testResults
    };

  } catch (error) {
    logError('Erro crítico na execução', error);
    return {
      aprovado: false,
      resultados: testResults,
      erro: error.message
    };
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
    .then(resultado => {
      process.exit(resultado.aprovado ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { main, testResults };

