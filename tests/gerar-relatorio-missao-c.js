/**
 * Gerador de Relatório Técnico - MISSÃO C
 * Gera relatório completo em Markdown após execução dos testes
 */

const fs = require('fs');
const path = require('path');

function gerarRelatorio(resultados) {
  const { aprovado, resultados: testResults, erro } = resultados;
  const timestamp = new Date().toISOString();
  
  let relatorio = `# 📋 RELATÓRIO TÉCNICO - MISSÃO C (AUTOMATIZADA)

**Data/Hora:** ${new Date().toLocaleString('pt-BR')}  
**Timestamp:** ${timestamp}  
**Status Final:** ${aprovado ? '✅ APROVADO' : '❌ REPROVADO'}  
**Backend URL:** ${process.env.BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev'}

---

## 📑 SUMÁRIO EXECUTIVO

Este relatório documenta a execução automatizada da **MISSÃO C**, que valida o sistema de lotes do Gol de Ouro em dois blocos:

- **BLOCO 1:** Fluxo base (7 testes)
- **BLOCO 2:** Concorrência (6 testes)

**Resultado Geral:** ${aprovado ? '✅ APROVADO' : '❌ REPROVADO'}

${erro ? `\n**⚠️ ERRO CRÍTICO:** ${erro}\n` : ''}

---

## 🏗️ VISÃO GERAL DA ARQUITETURA TESTADA

### Sistema de Lotes

O sistema utiliza **LOTES** como unidade central de jogo:

- **Criação Automática:** Lote é criado quando não existe lote ativo para um valor
- **Tamanho Máximo:** Definido por valor de aposta (R$1→10, R$2→5, R$5→2, R$10→1)
- **Índice Vencedor:** Exatamente 1 índice vencedor (winnerIndex) por lote
- **Encerramento:** Imediato após gol OU ao atingir tamanho máximo
- **Status:** 'ativo' → 'finalizado' (não aceita chutes após finalização)

### Endpoint Testado

` + '```' + `
POST /api/games/shoot
Authorization: Bearer {token}
Body: { "direction": "C", "amount": 1 }
` + '```' + `

### Proteções Testadas

- **Transações ACID:** RPC functions com 'SELECT ... FOR UPDATE'
- **Cache em Memória:** Sincronizado com banco de dados
- **Trigger Financeiro:** Débito/crédito automático
- **Validação de Integridade:** Antes e após cada chute

---

## 🧪 CENÁRIOS EXECUTADOS

### BLOCO 1 - FLUXO BASE

**Status:** ${testResults.bloco1.aprovado ? '✅ APROVADO' : '❌ REPROVADO'}  
**Testes Aprovados:** ${testResults.bloco1.testes.filter(t => t.aprovado).length}/${testResults.bloco1.testes.length}

`;

  // Detalhar cada teste do BLOCO 1
  testResults.bloco1.testes.forEach((teste, index) => {
    relatorio += `#### Teste ${index + 1}: ${teste.nome}

**Status:** ${teste.aprovado ? '✅ APROVADO' : '❌ REPROVADO'}  
**Timestamp:** ${teste.timestamp}

**Detalhes:**` + '\n' + '```json' + '\n' + `${JSON.stringify(teste.detalhes, null, 2)}` + '\n' + '```' + '\n\n'

`;
  });

  relatorio += `### BLOCO 2 - CONCORRÊNCIA

**Status:** ${testResults.bloco2.aprovado ? '✅ APROVADO' : '❌ REPROVADO'}  
**Testes Aprovados:** ${testResults.bloco2.testes.filter(t => t.aprovado).length}/${testResults.bloco2.testes.length}

`;

  // Detalhar cada teste do BLOCO 2
  testResults.bloco2.testes.forEach((teste, index) => {
    relatorio += `#### Teste ${index + 8}: ${teste.nome}

**Status:** ${teste.aprovado ? '✅ APROVADO' : '❌ REPROVADO'}  
**Timestamp:** ${teste.timestamp}

**Detalhes:**` + '\n' + '```json' + '\n' + `${JSON.stringify(teste.detalhes, null, 2)}` + '\n' + '```' + '\n\n'

`;
  });

  relatorio += `---

## 📊 EVIDÊNCIAS DE EXECUÇÃO

### Logs de Execução

` + '```' + '\n' + `${testResults.logs.slice(0, 100).join('\n')}` + '\n' + `${testResults.logs.length > 100 ? `\n... (${testResults.logs.length - 100} linhas adicionais)` : ''}` + '\n' + '```' + '\n'

### Resumo de Testes

| Bloco | Testes | Aprovados | Reprovados | Status |
|-------|--------|-----------|------------|--------|
| BLOCO 1 | ${testResults.bloco1.testes.length} | ${testResults.bloco1.testes.filter(t => t.aprovado).length} | ${testResults.bloco1.testes.filter(t => !t.aprovado).length} | ${testResults.bloco1.aprovado ? '✅' : '❌'} |
| BLOCO 2 | ${testResults.bloco2.testes.length} | ${testResults.bloco2.testes.filter(t => t.aprovado).length} | ${testResults.bloco2.testes.filter(t => !t.aprovado).length} | ${testResults.bloco2.aprovado ? '✅' : '❌'} |
| **TOTAL** | **${testResults.bloco1.testes.length + testResults.bloco2.testes.length}** | **${testResults.bloco1.testes.filter(t => t.aprovado).length + testResults.bloco2.testes.filter(t => t.aprovado).length}** | **${testResults.bloco1.testes.filter(t => !t.aprovado).length + testResults.bloco2.testes.filter(t => !t.aprovado).length}** | **${aprovado ? '✅' : '❌'}** |

---

## ✅ PONTOS APROVADOS

`;

  // Listar testes aprovados
  const todosTestes = [...testResults.bloco1.testes, ...testResults.bloco2.testes];
  const testesAprovados = todosTestes.filter(t => t.aprovado);
  
  if (testesAprovados.length > 0) {
    testesAprovados.forEach((teste, index) => {
      relatorio += `${index + 1}. ✅ **${teste.nome}** - ${teste.timestamp}\n`;
    });
  } else {
    relatorio += `Nenhum teste aprovado.\n`;
  }

  relatorio += `\n---\n\n## ⚠️ PONTOS DE ATENÇÃO\n\n`;

  // Listar testes reprovados
  const testesReprovados = todosTestes.filter(t => !t.aprovado);
  
  if (testesReprovados.length > 0) {
    testesReprovados.forEach((teste, index) => {
      relatorio += `${index + 1}. ❌ **${teste.nome}** - ${teste.timestamp}\n`;
      relatorio += `   - **Erro:** ${JSON.stringify(teste.detalhes)}\n\n`;
    });
  } else {
    relatorio += `Nenhum ponto de atenção identificado.\n\n`;
  }

  relatorio += `---\n\n## 📈 ANÁLISE DE PERFORMANCE\n\n`;

  // Calcular tempos médios
  const tempos = todosTestes
    .map(t => t.detalhes?.tempo)
    .filter(t => t !== undefined);
  
  if (tempos.length > 0) {
    const tempoMedio = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    const tempoMin = Math.min(...tempos);
    const tempoMax = Math.max(...tempos);
    
    relatorio += `- **Tempo Médio de Resposta:** ${tempoMedio.toFixed(2)}ms\n`;
    relatorio += `- **Tempo Mínimo:** ${tempoMin}ms\n`;
    relatorio += `- **Tempo Máximo:** ${tempoMax}ms\n\n`;
  } else {
    relatorio += `Dados de performance não disponíveis.\n\n`;
  }

  relatorio += `---\n\n## 🎯 CONCLUSÃO\n\n`;

  if (aprovado) {
    relatorio += `### ✅ APROVADO PARA PRODUÇÃO\n\n`;
    relatorio += `O sistema de lotes foi **APROVADO** após execução completa dos testes automatizados.\n\n`;
    relatorio += `**Validações Confirmadas:**\n`;
    relatorio += `- ✅ Criação e reutilização de lotes funcionando corretamente\n`;
    relatorio += `- ✅ Incremento de shotIndex consistente\n`;
    relatorio += `- ✅ Definição única de winnerIndex garantida\n`;
    relatorio += `- ✅ Encerramento imediato após gol\n`;
    relatorio += `- ✅ Proteção contra chutes após finalização\n`;
    relatorio += `- ✅ Sincronização banco x cache funcionando\n`;
    relatorio += `- ✅ Bloqueio por transação (FOR UPDATE) efetivo\n`;
    relatorio += `- ✅ Apenas um gol possível por lote\n`;
    relatorio += `- ✅ Ausência de duplicidade de shotIndex\n`;
    relatorio += `- ✅ Criação única de lotes em concorrência\n`;
    relatorio += `- ✅ Ausência de lotes órfãos\n\n`;
  } else {
    relatorio += `### ❌ REPROVADO - REQUER CORREÇÕES\n\n`;
    relatorio += `O sistema de lotes foi **REPROVADO** devido a falhas identificadas nos testes.\n\n`;
    relatorio += `**Ações Recomendadas:**\n`;
    relatorio += `- Revisar testes reprovados listados em "Pontos de Atenção"\n`;
    relatorio += `- Validar lógica de criação e encerramento de lotes\n`;
    relatorio += `- Verificar proteções contra concorrência\n`;
    relatorio += `- Testar novamente após correções\n\n`;
  }

  relatorio += `---\n\n**Relatório gerado automaticamente em:** ${new Date().toLocaleString('pt-BR')}\n`;
  relatorio += `**Sistema:** Gol de Ouro v1.2.0\n`;
  relatorio += `**MISSÃO C - Testes Automatizados**\n`;

  return relatorio;
}

// Executar se chamado diretamente
if (require.main === module) {
  // Carregar resultados dos testes (se existir arquivo de resultados)
  const resultadosPath = path.join(__dirname, 'missao-c-resultados.json');
  
  if (fs.existsSync(resultadosPath)) {
    const resultados = JSON.parse(fs.readFileSync(resultadosPath, 'utf8'));
    const relatorio = gerarRelatorio(resultados);
    
    const relatorioPath = path.join(__dirname, '..', 'RELATORIO-MISSAO-C-AUTOMATIZADA.md');
    fs.writeFileSync(relatorioPath, relatorio, 'utf8');
    
    console.log(`✅ Relatório gerado: ${relatorioPath}`);
  } else {
    console.error('❌ Arquivo de resultados não encontrado. Execute os testes primeiro.');
    process.exit(1);
  }
}

module.exports = { gerarRelatorio };

