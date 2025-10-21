// LIMPEZA SEGURA DO SISTEMA - GOL DE OURO
// ============================================
// Data: 20/10/2025
// Status: LIMPEZA SEGURA DE ARQUIVOS DUPLICADOS

const fs = require('fs');
const path = require('path');

console.log('🧹 === LIMPEZA SEGURA DO SISTEMA ===');
console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
console.log('');

// Diretórios para organizar arquivos
const organizarDiretorios = {
  'docs/auditorias': [],
  'docs/relatorios': [],
  'docs/configuracoes': [],
  'scripts/obsoletos': [],
  'backups/arquivos-antigos': []
};

// Arquivos críticos que NUNCA devem ser removidos
const arquivosCriticos = [
  'server-fly.js',
  'package.json',
  'package-lock.json',
  '.env',
  'Dockerfile',
  'fly.toml',
  'README.md',
  'GUIA-2-ACOES-FINAIS.md',
  'middlewares/',
  'controllers/',
  'routes/',
  'services/',
  'database/',
  'goldeouro-admin/',
  'goldeouro-player/',
  'goldeouro-mobile/'
];

// Padrões de arquivos para organizar
const padroesOrganizacao = {
  'docs/auditorias': [
    'AUDITORIA-*.md',
    'auditoria-*.js',
    'auditoria-*.html'
  ],
  'docs/relatorios': [
    'RELATORIO-*.md',
    'relatorio-*.js',
    'RELATORIO-*.json'
  ],
  'docs/configuracoes': [
    'CONFIGURACAO-*.md',
    'GUIA-*.md',
    'INSTRUCOES-*.md'
  ],
  'scripts/obsoletos': [
    'teste-*.js',
    'debug-*.js',
    'verificacao-*.js',
    'validacao-*.js'
  ]
};

function criarDiretorios() {
  console.log('📁 Criando diretórios de organização...');
  
  Object.keys(organizarDiretorios).forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   ✅ Criado: ${dir}`);
    } else {
      console.log(`   ℹ️ Já existe: ${dir}`);
    }
  });
}

function organizarArquivos() {
  console.log('');
  console.log('📋 Organizando arquivos...');
  
  let totalOrganizados = 0;
  
  Object.entries(padroesOrganizacao).forEach(([diretorio, padroes]) => {
    padroes.forEach(padrao => {
      const regex = new RegExp(padrao.replace('*', '.*'));
      const arquivos = fs.readdirSync('.')
        .filter(arquivo => regex.test(arquivo) && fs.statSync(arquivo).isFile());
      
      arquivos.forEach(arquivo => {
        // Verificar se é arquivo crítico
        if (arquivosCriticos.some(critico => arquivo.includes(critico))) {
          console.log(`   ⚠️ Mantido (crítico): ${arquivo}`);
          return;
        }
        
        const origem = arquivo;
        const destino = path.join(diretorio, arquivo);
        
        try {
          fs.renameSync(origem, destino);
          console.log(`   ✅ Movido: ${origem} → ${destino}`);
          totalOrganizados++;
        } catch (error) {
          console.log(`   ❌ Erro ao mover ${origem}: ${error.message}`);
        }
      });
    });
  });
  
  return totalOrganizados;
}

function limparBackupsAntigos() {
  console.log('');
  console.log('🗑️ Limpando backups antigos...');
  
  const backupsAntigos = fs.readdirSync('.')
    .filter(arquivo => arquivo.startsWith('BACKUP-') && fs.statSync(arquivo).isDirectory());
  
  // Manter apenas os 3 mais recentes
  const backupsOrdenados = backupsAntigos
    .map(backup => ({
      nome: backup,
      data: fs.statSync(backup).mtime
    }))
    .sort((a, b) => b.data - a.data);
  
  const backupsParaManter = backupsOrdenados.slice(0, 3);
  const backupsParaMover = backupsOrdenados.slice(3);
  
  console.log(`   📊 Total de backups: ${backupsAntigos.length}`);
  console.log(`   ✅ Mantendo: ${backupsParaManter.length}`);
  console.log(`   🗑️ Movendo: ${backupsParaMover.length}`);
  
  backupsParaMover.forEach(backup => {
    const origem = backup.nome;
    const destino = path.join('backups/arquivos-antigos', backup.nome);
    
    try {
      fs.renameSync(origem, destino);
      console.log(`   ✅ Movido: ${origem} → ${destino}`);
    } catch (error) {
      console.log(`   ❌ Erro ao mover ${origem}: ${error.message}`);
    }
  });
  
  return backupsParaMover.length;
}

function gerarRelatorio() {
  console.log('');
  console.log('📊 === RELATÓRIO DE LIMPEZA ===');
  
  const stats = {
    arquivosOrganizados: 0,
    backupsMovidos: 0,
    diretoriosCriados: Object.keys(organizarDiretorios).length
  };
  
  // Contar arquivos organizados
  Object.keys(organizarDiretorios).forEach(dir => {
    if (fs.existsSync(dir)) {
      const arquivos = fs.readdirSync(dir);
      stats.arquivosOrganizados += arquivos.length;
    }
  });
  
  console.log(`📁 Diretórios criados: ${stats.diretoriosCriados}`);
  console.log(`📄 Arquivos organizados: ${stats.arquivosOrganizados}`);
  console.log(`🗑️ Backups movidos: ${stats.backupsMovidos}`);
  console.log('');
  console.log('✅ LIMPEZA SEGURA CONCLUÍDA!');
  console.log('🎯 Sistema organizado e pronto para produção');
}

// Executar limpeza
try {
  criarDiretorios();
  const arquivosOrganizados = organizarArquivos();
  const backupsMovidos = limparBackupsAntigos();
  gerarRelatorio();
} catch (error) {
  console.log('❌ Erro durante limpeza:', error.message);
  process.exit(1);
}
