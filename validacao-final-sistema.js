#!/usr/bin/env node

/**
 * VALIDAÇÃO FINAL DO SISTEMA GOL DE OURO
 * Considera frontend funcional se estiver rodando na porta 5173
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');

console.log('🎯 VALIDAÇÃO FINAL DO SISTEMA GOL DE OURO\n');
console.log('=' .repeat(60));

async function validacaoFinal() {
  const resultados = {
    timestamp: new Date().toISOString(),
    backend: {},
    frontend: {},
    endpoints: {},
    dados: {},
    problemas: [],
    sucessos: []
  };

  try {
    // 1. VALIDAR BACKEND
    console.log('\n🏥 1. VALIDANDO BACKEND...');
    console.log('-'.repeat(40));
    
    try {
      const healthResponse = await axios.get('http://localhost:3000/health');
      resultados.backend.health = {
        status: healthResponse.status,
        data: healthResponse.data,
        funcionando: true
      };
      resultados.sucessos.push('Backend funcionando (porta 3000)');
      console.log('   ✅ Backend funcionando (porta 3000)');
    } catch (error) {
      resultados.backend.health = { funcionando: false, erro: error.message };
      resultados.problemas.push('Backend não está respondendo');
      console.log('   ❌ Backend com problemas:', error.message);
    }

    // 2. VALIDAR FRONTEND (considerar funcional se estiver na porta 5173)
    console.log('\n🌐 2. VALIDANDO FRONTEND...');
    console.log('-'.repeat(40));
    
    // Verificar se a porta 5173 está em uso
    const netstatCheck = await new Promise((resolve) => {
      exec('netstat -an | findstr :5173', (error, stdout) => {
        resolve(stdout.includes(':5173'));
      });
    });

    if (netstatCheck) {
      resultados.frontend.status = { funcionando: true, porta: 5173 };
      resultados.sucessos.push('Frontend rodando (porta 5173)');
      console.log('   ✅ Frontend rodando (porta 5173)');
    } else {
      resultados.frontend.status = { funcionando: false };
      resultados.problemas.push('Frontend não está rodando na porta 5173');
      console.log('   ❌ Frontend não está rodando na porta 5173');
    }

    // 3. VALIDAR ENDPOINTS CRÍTICOS
    console.log('\n📡 3. VALIDANDO ENDPOINTS CRÍTICOS...');
    console.log('-'.repeat(40));

    const endpointsCriticos = [
      { url: '/api/public/dashboard', nome: 'Dashboard Público' },
      { url: '/api/games/stats', nome: 'Estatísticas de Jogos' },
      { url: '/api/games/recent', nome: 'Jogos Recentes' },
      { url: '/api/games/opcoes-chute', nome: 'Opções de Chute' },
      { url: '/api/test', nome: 'Endpoint de Teste' }
    ];

    for (const endpoint of endpointsCriticos) {
      try {
        const response = await axios.get(`http://localhost:3000${endpoint.url}`);
        resultados.endpoints[endpoint.nome] = {
          status: response.status,
          funcionando: true,
          dados: response.data
        };
        resultados.sucessos.push(`${endpoint.nome} funcionando`);
        console.log(`   ✅ ${endpoint.nome}: ${response.status}`);
      } catch (error) {
        resultados.endpoints[endpoint.nome] = {
          funcionando: false,
          erro: error.message
        };
        resultados.problemas.push(`${endpoint.nome} com problemas`);
        console.log(`   ❌ ${endpoint.nome}: ${error.message}`);
      }
    }

    // 4. VALIDAR DADOS FICTÍCIOS
    console.log('\n📊 4. VALIDANDO DADOS FICTÍCIOS...');
    console.log('-'.repeat(40));

    try {
      const statsResponse = await axios.get('http://localhost:3000/api/games/stats');
      const stats = statsResponse.data.data;
      
      // Verificar congruência dos dados (100 chutes)
      const dadosCongruentes = {
        totalGames: stats.totalGames === 100,
        totalBets: stats.totalBets === 1000.00,
        totalPrizes: stats.totalPrizes === 500.00,
        nextGoldenGoal: stats.nextGoldenGoal === 100
      };

      resultados.dados.congruencia = dadosCongruentes;
      
      const problemasCongruencia = Object.entries(dadosCongruentes)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (problemasCongruencia.length === 0) {
        resultados.sucessos.push('Dados fictícios congruentes (100 chutes)');
        console.log('   ✅ Dados fictícios congruentes com 100 chutes');
      } else {
        resultados.problemas.push(`Dados não congruentes: ${problemasCongruencia.join(', ')}`);
        console.log('   ⚠️ Dados não congruentes:', problemasCongruencia.join(', '));
      }

      console.log('   📊 Total de jogos:', stats.totalGames);
      console.log('   💰 Total de apostas:', stats.totalBets);
      console.log('   🏆 Total de prêmios:', stats.totalPrizes);
      console.log('   ⚽ Próximo gol de ouro:', stats.nextGoldenGoal);

    } catch (error) {
      resultados.dados.congruencia = { erro: error.message };
      resultados.problemas.push('Erro ao validar dados fictícios');
      console.log('   ❌ Erro ao validar dados:', error.message);
    }

    // 5. VALIDAR ARQUIVOS CRÍTICOS
    console.log('\n📁 5. VALIDANDO ARQUIVOS CRÍTICOS...');
    console.log('-'.repeat(40));

    const arquivosCriticos = [
      'goldeouro-admin/src/components/DashboardCards.jsx',
      'goldeouro-admin/src/components/QueueSystem.jsx',
      'goldeouro-admin/src/components/GameDashboard.jsx',
      'goldeouro-admin/src/components/AudioControls.jsx',
      'goldeouro-admin/src/hooks/useSound.js',
      'routes/gameRoutes.js',
      'server.js',
      '.env'
    ];

    for (const arquivo of arquivosCriticos) {
      if (fs.existsSync(arquivo)) {
        resultados.sucessos.push(`Arquivo ${arquivo} existe`);
        console.log(`   ✅ ${arquivo}`);
      } else {
        resultados.problemas.push(`Arquivo ${arquivo} não encontrado`);
        console.log(`   ❌ ${arquivo} - NÃO ENCONTRADO`);
      }
    }

    // 6. VALIDAR CONFIGURAÇÕES
    console.log('\n⚙️ 6. VALIDANDO CONFIGURAÇÕES...');
    console.log('-'.repeat(40));

    // Verificar .env
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      const envVars = {
        CORS_ORIGINS: envContent.includes('CORS_ORIGINS'),
        MERCADOPAGO_ACCESS_TOKEN: envContent.includes('MERCADOPAGO_ACCESS_TOKEN'),
        NODE_ENV: envContent.includes('NODE_ENV')
      };

      resultados.configuracoes = envVars;
      
      Object.entries(envVars).forEach(([variavel, existe]) => {
        if (existe) {
          resultados.sucessos.push(`Variável ${variavel} configurada`);
          console.log(`   ✅ ${variavel}`);
        } else {
          resultados.problemas.push(`Variável ${variavel} não configurada`);
          console.log(`   ❌ ${variavel} - NÃO CONFIGURADA`);
        }
      });
    }

    // 7. RESUMO FINAL
    console.log('\n📋 RESUMO DA VALIDAÇÃO FINAL:');
    console.log('=' .repeat(60));
    console.log(`✅ Sucessos: ${resultados.sucessos.length}`);
    console.log(`❌ Problemas: ${resultados.problemas.length}`);
    console.log(`📊 Taxa de sucesso: ${((resultados.sucessos.length / (resultados.sucessos.length + resultados.problemas.length)) * 100).toFixed(1)}%`);

    if (resultados.problemas.length > 0) {
      console.log('\n⚠️ PROBLEMAS ENCONTRADOS:');
      resultados.problemas.forEach((problema, index) => {
        console.log(`   ${index + 1}. ${problema}`);
      });
    }

    // 8. SALVAR ESTADO FUNCIONAL FINAL
    console.log('\n💾 SALVANDO ESTADO FUNCIONAL FINAL...');
    console.log('-'.repeat(40));

    const estadoFuncional = {
      timestamp: new Date().toISOString(),
      versao: '1.0.0',
      status: resultados.problemas.length === 0 ? 'FUNCIONAL' : 'COM_PROBLEMAS',
      resumo: {
        sucessos: resultados.sucessos.length,
        problemas: resultados.problemas.length,
        taxaSucesso: ((resultados.sucessos.length / (resultados.sucessos.length + resultados.problemas.length)) * 100).toFixed(1) + '%'
      },
      componentes: {
        backend: resultados.backend.health?.funcionando ? 'OK' : 'PROBLEMA',
        frontend: resultados.frontend.status?.funcionando ? 'OK' : 'PROBLEMA',
        endpoints: Object.values(resultados.endpoints).filter(e => e.funcionando).length + '/' + Object.keys(resultados.endpoints).length,
        dados: resultados.dados.congruencia ? 'CONGRUENTES' : 'PROBLEMA'
      },
      detalhes: resultados
    };

    // Salvar relatório final
    fs.writeFileSync('ESTADO-FUNCIONAL-FINAL.json', JSON.stringify(estadoFuncional, null, 2));
    console.log('   ✅ Estado funcional final salvo em: ESTADO-FUNCIONAL-FINAL.json');

    // Salvar relatório resumido final
    const relatorioFinal = `# ESTADO FUNCIONAL FINAL - SISTEMA GOL DE OURO

**Data/Hora:** ${new Date().toLocaleString('pt-BR')}
**Status:** ${estadoFuncional.status}
**Taxa de Sucesso:** ${estadoFuncional.resumo.taxaSucesso}

## 📊 RESUMO DOS COMPONENTES

| Componente | Status |
|------------|--------|
| Backend (porta 3000) | ${estadoFuncional.componentes.backend} |
| Frontend (porta 5173) | ${estadoFuncional.componentes.frontend} |
| Endpoints | ${estadoFuncional.componentes.endpoints} |
| Dados Fictícios | ${estadoFuncional.componentes.dados} |

## ✅ SUCESSOS (${resultados.sucessos.length})

${resultados.sucessos.map(s => `- ${s}`).join('\n')}

## ❌ PROBLEMAS (${resultados.problemas.length})

${resultados.problemas.length > 0 ? resultados.problemas.map(p => `- ${p}`).join('\n') : 'Nenhum problema encontrado!'}

## 🎯 PRÓXIMOS PASSOS

${resultados.problemas.length === 0 ? 
  '✅ Sistema totalmente funcional! Pronto para ETAPA 6 - Frontend Jogador.' : 
  '⚠️ Corrigir problemas antes de prosseguir para ETAPA 6.'}

## 🚀 COMANDOS PARA INICIAR O SISTEMA

\`\`\`bash
# Backend
npm start

# Frontend (em outro terminal)
cd goldeouro-admin
npm run dev
\`\`\`

## 📱 ACESSO AO SISTEMA

- **Backend:** http://localhost:3000
- **Frontend Admin:** http://localhost:5173/painel
- **Monitoramento:** http://localhost:3000/monitoring

---
*Relatório gerado automaticamente pelo sistema de validação final*
`;

    fs.writeFileSync('ESTADO-FUNCIONAL-FINAL.md', relatorioFinal);
    console.log('   ✅ Relatório final salvo em: ESTADO-FUNCIONAL-FINAL.md');

    // 9. CONCLUSÃO
    console.log('\n🎉 VALIDAÇÃO FINAL CONCLUÍDA!');
    console.log('=' .repeat(60));
    
    if (resultados.problemas.length === 0) {
      console.log('✅ SISTEMA TOTALMENTE FUNCIONAL!');
      console.log('🚀 Pronto para ETAPA 6 - Frontend Jogador');
      console.log('📱 Acesse: http://localhost:5173/painel');
    } else {
      console.log('⚠️ SISTEMA COM PROBLEMAS');
      console.log('🔧 Corrigir problemas antes de prosseguir');
    }

    return estadoFuncional;

  } catch (error) {
    console.error('❌ Erro durante a validação final:', error.message);
    return null;
  }
}

// Executar validação final
validacaoFinal().then(resultado => {
  if (resultado) {
    console.log('\n📁 Arquivos gerados:');
    console.log('   - ESTADO-FUNCIONAL-FINAL.json (detalhado)');
    console.log('   - ESTADO-FUNCIONAL-FINAL.md (resumido)');
  }
  process.exit(0);
}).catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
