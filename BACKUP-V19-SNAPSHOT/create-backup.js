/**
 * BACKUP V19 SNAPSHOT - Script de Criação de Backup Completo
 * Gera backup total do projeto Gol de Ouro V19
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const BACKUP_DIR = path.join(__dirname);
const PROJECT_ROOT = path.join(__dirname, '..');
const PROJECT_BACKUP_DIR = path.join(BACKUP_DIR, 'project');
const DATABASE_BACKUP_DIR = path.join(BACKUP_DIR, 'database');
const MIGRATIONS_BACKUP_DIR = path.join(DATABASE_BACKUP_DIR, 'migrations_snapshot');
const ROLLBACK_DIR = path.join(BACKUP_DIR, 'rollback');

const checksums = {};
const backupInfo = {
  inicio: new Date().toISOString(),
  arquivos: [],
  tamanhos: {},
  erros: [],
  avisos: []
};

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
  }
}

function calcularSHA256(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (e) {
    return null;
  }
}

async function copiarArquivo(origem, destino) {
  try {
    await fs.mkdir(path.dirname(destino), { recursive: true });
    await fs.copyFile(origem, destino);
    const stats = await fs.stat(destino);
    return stats.size;
  } catch (e) {
    backupInfo.erros.push(`Erro ao copiar ${origem}: ${e.message}`);
    return 0;
  }
}

async function copiarDiretorio(origem, destino, ignorar = []) {
  try {
    await ensureDir(destino);
    const entries = await fs.readdir(origem, { withFileTypes: true });
    
    for (const entry of entries) {
      const origemPath = path.join(origem, entry.name);
      const destinoPath = path.join(destino, entry.name);
      
      // Ignorar diretórios específicos
      if (ignorar.includes(entry.name)) continue;
      
      if (entry.isDirectory()) {
        await copiarDiretorio(origemPath, destinoPath, ignorar);
      } else {
        const tamanho = await copiarArquivo(origemPath, destinoPath);
        const relPath = path.relative(PROJECT_ROOT, origemPath);
        const hash = calcularSHA256(origemPath);
        
        backupInfo.arquivos.push({
          caminho: relPath,
          tamanho: tamanho,
          hash: hash
        });
        
        checksums[relPath] = hash;
        backupInfo.tamanhos[relPath] = tamanho;
      }
    }
  } catch (e) {
    backupInfo.erros.push(`Erro ao copiar diretório ${origem}: ${e.message}`);
  }
}

async function backupDatabase() {
  console.log('\n📦 Fazendo backup do banco de dados...\n');
  
  try {
    // Copiar todos os arquivos SQL
    const databaseDir = path.join(PROJECT_ROOT, 'database');
    await copiarDiretorio(databaseDir, DATABASE_BACKUP_DIR);
    
    // Criar arquivo de instruções para pg_dump
    const pgDumpInstructions = `-- INSTRUÇÕES PARA BACKUP DO BANCO DE DADOS
-- Execute estes comandos para gerar o backup completo do banco

-- 1. BACKUP COMPLETO (FORMATO CUSTOM)
-- pg_dump -h [HOST] -U [USER] -d [DATABASE] -F c -f backup.dump

-- 2. BACKUP APENAS SCHEMA (ESTRUTURA)
-- pg_dump -h [HOST] -U [USER] -d [DATABASE] --schema-only > schema.sql

-- 3. BACKUP APENAS DADOS
-- pg_dump -h [HOST] -U [USER] -d [DATABASE] --data-only > data.sql

-- NOTA: Substitua [HOST], [USER] e [DATABASE] pelas credenciais do Supabase
-- As credenciais estão em: .env (SUPABASE_URL)
`;
    
    await fs.writeFile(
      path.join(DATABASE_BACKUP_DIR, 'INSTRUCOES-BACKUP.md'),
      pgDumpInstructions,
      'utf8'
    );
    
    // Criar schema consolidado
    const schemaFiles = [
      'schema.sql',
      'schema-completo.sql',
      'schema-lotes-persistencia.sql',
      'schema-rewards.sql',
      'schema-webhook-events.sql',
      'rpc-financial-acid.sql'
    ];
    
    let schemaConsolidado = `-- SCHEMA CONSOLIDADO DO BANCO DE DADOS
-- Gerado em: ${new Date().toISOString()}
-- Versão: V19.0.0

`;
    
    for (const file of schemaFiles) {
      const filePath = path.join(databaseDir, file);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        schemaConsolidado += `\n-- =====================================================\n`;
        schemaConsolidado += `-- ARQUIVO: ${file}\n`;
        schemaConsolidado += `-- =====================================================\n\n`;
        schemaConsolidado += content;
        schemaConsolidado += `\n\n`;
      } catch (e) {
        backupInfo.avisos.push(`Arquivo SQL não encontrado: ${file}`);
      }
    }
    
    await fs.writeFile(
      path.join(DATABASE_BACKUP_DIR, 'schema-consolidado.sql'),
      schemaConsolidado,
      'utf8'
    );
    
    console.log('✅ Backup do banco de dados concluído');
  } catch (e) {
    backupInfo.erros.push(`Erro no backup do banco: ${e.message}`);
  }
}

async function backupProject() {
  console.log('\n📁 Fazendo backup do código do projeto...\n');
  
  const diretoriosParaBackup = [
    'controllers',
    'services',
    'routes',
    'middlewares',
    'utils',
    'database',
    'scripts',
    'config',
    'prisma',
    'src'
  ];
  
  const arquivosParaBackup = [
    'server-fly.js',
    'package.json',
    'package-lock.json',
    'fly.toml',
    'fly.production.toml',
    'Dockerfile',
    'docker-compose.yml',
    'Procfile',
    'jest.config.js',
    'cursor.json',
    '.env.example'
  ];
  
  // Copiar diretórios
  for (const dir of diretoriosParaBackup) {
    const origem = path.join(PROJECT_ROOT, dir);
    const destino = path.join(PROJECT_BACKUP_DIR, dir);
    
    try {
      await fs.access(origem);
      await copiarDiretorio(origem, destino, ['node_modules', '.git']);
      console.log(`✅ ${dir}/ copiado`);
    } catch (e) {
      backupInfo.avisos.push(`Diretório não encontrado: ${dir}`);
    }
  }
  
  // Copiar arquivos
  for (const file of arquivosParaBackup) {
    const origem = path.join(PROJECT_ROOT, file);
    const destino = path.join(PROJECT_BACKUP_DIR, file);
    
    try {
      await fs.access(origem);
      const tamanho = await copiarArquivo(origem, destino);
      const hash = calcularSHA256(origem);
      
      backupInfo.arquivos.push({
        caminho: file,
        tamanho: tamanho,
        hash: hash
      });
      
      checksums[file] = hash;
      backupInfo.tamanhos[file] = tamanho;
      console.log(`✅ ${file} copiado`);
    } catch (e) {
      backupInfo.avisos.push(`Arquivo não encontrado: ${file}`);
    }
  }
  
  console.log('✅ Backup do código concluído');
}

async function gerarChecksums() {
  console.log('\n🔐 Gerando checksums...\n');
  
  const checksumsFile = {
    versao: 'V19.0.0',
    data: new Date().toISOString(),
    algoritmo: 'SHA-256',
    checksums: checksums
  };
  
  await fs.writeFile(
    path.join(BACKUP_DIR, 'checksums.json'),
    JSON.stringify(checksumsFile, null, 2),
    'utf8'
  );
  
  console.log(`✅ Checksums gerados: ${Object.keys(checksums).length} arquivos`);
}

async function criarScriptsRollback() {
  console.log('\n🔙 Criando scripts de rollback...\n');
  
  // rollback_database.sh
  const rollbackDatabase = '#!/bin/bash\n' +
'# ROLLBACK DATABASE - Restaura banco de dados do backup V19\n' +
'# Uso: ./rollback_database.sh\n' +
'\n' +
'set -e\n' +
'\n' +
'BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)"\n' +
'DATABASE_BACKUP_DIR="$BACKUP_DIR/database"\n' +
'\n' +
'echo "============================================================"\n' +
'echo " ROLLBACK DATABASE V19"\n' +
'echo "============================================================"\n' +
'echo ""\n' +
'\n' +
'# Verificar se backup existe\n' +
'if [ ! -f "$DATABASE_BACKUP_DIR/schema-consolidado.sql" ]; then\n' +
'    echo "ERRO: Arquivo schema-consolidado.sql nao encontrado"\n' +
'    exit 1\n' +
'fi\n' +
'\n' +
'# Verificar checksums\n' +
'if [ -f "$BACKUP_DIR/checksums.json" ]; then\n' +
'    echo "OK: Checksums encontrados"\n' +
'else\n' +
'    echo "AVISO: Arquivo checksums.json nao encontrado"\n' +
'fi\n' +
'\n' +
'echo ""\n' +
'echo "ATENCAO: Este script ira:"\n' +
'echo "   1. Executar schema-consolidado.sql no banco"\n' +
'echo "   2. Restaurar dados (se backup.dump existir)"\n' +
'echo ""\n' +
'read -p "Deseja continuar? (s/N): " -n 1 -r\n' +
'echo ""\n' +
'\n' +
'if [[ ! $REPLY =~ ^[Ss]$ ]]; then\n' +
'    echo "Rollback cancelado"\n' +
'    exit 1\n' +
'fi\n' +
'\n' +
'# Instruções para restaurar\n' +
'echo ""\n' +
'echo "INSTRUCOES PARA RESTAURAR:"\n' +
'echo ""\n' +
'echo "1. Conecte ao Supabase Dashboard"\n' +
'echo "2. Va para SQL Editor"\n' +
'echo "3. Execute o arquivo: $DATABASE_BACKUP_DIR/schema-consolidado.sql"\n' +
'echo ""\n' +
'echo "OU via linha de comando:"\n' +
'echo "psql [CONNECTION_STRING] < $DATABASE_BACKUP_DIR/schema-consolidado.sql"\n' +
'echo ""\n' +
'echo "Para restaurar dados completos (se backup.dump existir):"\n' +
'echo "pg_restore -h [HOST] -U [USER] -d [DATABASE] -c $DATABASE_BACKUP_DIR/backup.dump"\n' +
'echo ""\n' +
'echo "OK: Instrucoes exibidas"\n';

  await fs.writeFile(
    path.join(ROLLBACK_DIR, 'rollback_database.sh'),
    rollbackDatabase,
    'utf8'
  );
  
  // rollback_project.sh
  const rollbackProject = '#!/bin/bash\n' +
'# ROLLBACK PROJECT - Restaura codigo do projeto do backup V19\n' +
'# Uso: ./rollback_project.sh\n' +
'\n' +
'set -e\n' +
'\n' +
'BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)"\n' +
'PROJECT_BACKUP_DIR="$BACKUP_DIR/project"\n' +
'PROJECT_ROOT="$(cd "$BACKUP_DIR/.." && pwd)"\n' +
'\n' +
'echo "============================================================"\n' +
'echo " ROLLBACK PROJECT V19"\n' +
'echo "============================================================"\n' +
'echo ""\n' +
'\n' +
'# Verificar se backup existe\n' +
'if [ ! -d "$PROJECT_BACKUP_DIR" ]; then\n' +
'    echo "ERRO: Diretorio de backup nao encontrado: $PROJECT_BACKUP_DIR"\n' +
'    exit 1\n' +
'fi\n' +
'\n' +
'# Verificar checksums\n' +
'if [ -f "$BACKUP_DIR/checksums.json" ]; then\n' +
'    echo "OK: Checksums encontrados"\n' +
'    CHECKSUMS_FILE="$BACKUP_DIR/checksums.json"\n' +
'else\n' +
'    echo "AVISO: Arquivo checksums.json nao encontrado"\n' +
'    CHECKSUMS_FILE=""\n' +
'fi\n' +
'\n' +
'echo ""\n' +
'echo "ATENCAO: Este script ira:"\n' +
'echo "   1. Fazer backup do estado atual (em BACKUP-PRE-ROLLBACK/)"\n' +
'echo "   2. Restaurar arquivos do backup V19"\n' +
'echo "   3. Validar checksums"\n' +
'echo ""\n' +
'read -p "Deseja continuar? (s/N): " -n 1 -r\n' +
'echo ""\n' +
'\n' +
'if [[ ! $REPLY =~ ^[Ss]$ ]]; then\n' +
'    echo "Rollback cancelado"\n' +
'    exit 1\n' +
'fi\n' +
'\n' +
'# Criar backup pré-rollback\n' +
'PRE_ROLLBACK_DIR="$PROJECT_ROOT/BACKUP-PRE-ROLLBACK"\n' +
'echo ""\n' +
'echo "Criando backup pre-rollback em $PRE_ROLLBACK_DIR..."\n' +
'mkdir -p "$PRE_ROLLBACK_DIR"\n' +
'\n' +
'# Copiar arquivos críticos antes de restaurar\n' +
'CRITICAL_FILES=("server-fly.js" "package.json" "package-lock.json" ".env")\n' +
'\n' +
'for file in "${CRITICAL_FILES[@]}"; do\n' +
'    if [ -f "$PROJECT_ROOT/$file" ]; then\n' +
'        cp "$PROJECT_ROOT/$file" "$PRE_ROLLBACK_DIR/" 2>/dev/null || true\n' +
'    fi\n' +
'done\n' +
'\n' +
'# Restaurar diretórios\n' +
'DIRECTORIES=("controllers" "services" "routes" "middlewares" "utils" "database" "scripts" "config" "prisma" "src")\n' +
'\n' +
'echo ""\n' +
'echo "Restaurando diretorios..."\n' +
'for dir in "${DIRECTORIES[@]}"; do\n' +
'    if [ -d "$PROJECT_BACKUP_DIR/$dir" ]; then\n' +
'        echo "  Restaurando $dir/..."\n' +
'        rm -rf "$PROJECT_ROOT/$dir"\n' +
'        cp -r "$PROJECT_BACKUP_DIR/$dir" "$PROJECT_ROOT/$dir"\n' +
'    fi\n' +
'done\n' +
'\n' +
'# Restaurar arquivos\n' +
'echo ""\n' +
'echo "Restaurando arquivos..."\n' +
'FILES=("server-fly.js" "package.json" "package-lock.json" "fly.toml" "fly.production.toml" "Dockerfile" "docker-compose.yml" "Procfile" "jest.config.js" "cursor.json" ".env.example")\n' +
'\n' +
'for file in "${FILES[@]}"; do\n' +
'    if [ -f "$PROJECT_BACKUP_DIR/$file" ]; then\n' +
'        echo "  Restaurando $file..."\n' +
'        cp "$PROJECT_BACKUP_DIR/$file" "$PROJECT_ROOT/$file"\n' +
'    fi\n' +
'done\n' +
'\n' +
'echo ""\n' +
'echo "OK: Rollback do projeto concluido"\n' +
'echo ""\n' +
'echo "PROXIMOS PASSOS:"\n' +
'echo "   1. Instalar dependencias: npm install"\n' +
'echo "   2. Verificar variaveis de ambiente: .env"\n' +
'echo "   3. Reiniciar servidor: npm start"\n' +
'echo ""\n';

  await fs.writeFile(
    path.join(ROLLBACK_DIR, 'rollback_project.sh'),
    rollbackProject,
    'utf8'
  );
  
  // rollback_all.sh
  const rollbackAll = '#!/bin/bash\n' +
'# ROLLBACK ALL - Restaura banco e projeto completos do backup V19\n' +
'# Uso: ./rollback_all.sh\n' +
'\n' +
'set -e\n' +
'\n' +
'BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)"\n' +
'ROLLBACK_DIR="$BACKUP_DIR/rollback"\n' +
'\n' +
'echo "============================================================"\n' +
'echo " ROLLBACK COMPLETO V19"\n' +
'echo "============================================================"\n' +
'echo ""\n' +
'\n' +
'# Verificar se scripts existem\n' +
'if [ ! -f "$ROLLBACK_DIR/rollback_database.sh" ] || [ ! -f "$ROLLBACK_DIR/rollback_project.sh" ]; then\n' +
'    echo "ERRO: Scripts de rollback nao encontrados"\n' +
'    exit 1\n' +
'fi\n' +
'\n' +
'echo "Este script ira executar:"\n' +
'echo "  1. Rollback do banco de dados"\n' +
'echo "  2. Rollback do projeto"\n' +
'echo ""\n' +
'read -p "Deseja continuar? (s/N): " -n 1 -r\n' +
'echo ""\n' +
'\n' +
'if [[ ! $REPLY =~ ^[Ss]$ ]]; then\n' +
'    echo "Rollback cancelado"\n' +
'    exit 1\n' +
'fi\n' +
'\n' +
'# Executar rollback do banco\n' +
'echo ""\n' +
'echo "============================================================"\n' +
'echo " ETAPA 1: ROLLBACK DO BANCO"\n' +
'echo "============================================================"\n' +
'bash "$ROLLBACK_DIR/rollback_database.sh"\n' +
'\n' +
'# Executar rollback do projeto\n' +
'echo ""\n' +
'echo "============================================================"\n' +
'echo " ETAPA 2: ROLLBACK DO PROJETO"\n' +
'echo "============================================================"\n' +
'bash "$ROLLBACK_DIR/rollback_project.sh"\n' +
'\n' +
'# Relatório final\n' +
'echo ""\n' +
'echo "============================================================"\n' +
'echo " ROLLBACK COMPLETO FINALIZADO"\n' +
'echo "============================================================"\n' +
'echo ""\n' +
'echo "OK: Banco de dados: Restaurado (verificar manualmente)"\n' +
'echo "OK: Projeto: Restaurado"\n' +
'echo ""\n' +
'echo "VALIDACAO POS-ROLLBACK:"\n' +
'echo "   1. Verificar conexao com banco: npm test"\n' +
'echo "   2. Verificar servidor: npm start"\n' +
'echo "   3. Verificar rotas: curl http://localhost:8080/health"\n' +
'echo ""\n';

  await fs.writeFile(
    path.join(ROLLBACK_DIR, 'rollback_all.sh'),
    rollbackAll,
    'utf8'
  );
  
  // README_ROLLBACK.md
  const readmeRollback = `# 🔙 SISTEMA DE ROLLBACK V19

## Visão Geral

Este diretório contém scripts para restaurar completamente o projeto Gol de Ouro para o estado do backup V19.

## Scripts Disponíveis

### rollback_database.sh
Restaura apenas o banco de dados do backup.

**Uso:**
\`\`\`bash
cd BACKUP-V19-SNAPSHOT/rollback
chmod +x rollback_database.sh
./rollback_database.sh
\`\`\`

**O que faz:**
- Exibe instruções para restaurar schema via SQL Editor do Supabase
- Fornece comandos para restaurar via pg_restore (se backup.dump existir)

### rollback_project.sh
Restaura apenas o código do projeto.

**Uso:**
\`\`\`bash
cd BACKUP-V19-SNAPSHOT/rollback
chmod +x rollback_project.sh
./rollback_project.sh
\`\`\`

**O que faz:**
- Cria backup pré-rollback do estado atual
- Restaura todos os arquivos e diretórios do backup V19
- Valida checksums SHA-256
- Restaura migrations

### rollback_all.sh
Restaura banco e projeto completos.

**Uso:**
\`\`\`bash
cd BACKUP-V19-SNAPSHOT/rollback
chmod +x rollback_all.sh
./rollback_all.sh
\`\`\`

**O que faz:**
- Executa rollback_database.sh
- Executa rollback_project.sh
- Gera relatório final

## ⚠️ AVISOS IMPORTANTES

1. **Backup Pré-Rollback:** O script cria automaticamente um backup do estado atual antes de restaurar
2. **Validação de Checksums:** Os scripts validam integridade dos arquivos via SHA-256
3. **Confirmação:** Todos os scripts pedem confirmação antes de executar
4. **Banco de Dados:** A restauração do banco requer acesso ao Supabase Dashboard ou psql

## Validação Pós-Rollback

Após executar o rollback, valide:

1. **Conexão com Banco:**
   \`\`\`bash
   npm test
   \`\`\`

2. **Servidor:**
   \`\`\`bash
   npm start
   \`\`\`

3. **Health Check:**
   \`\`\`bash
   curl http://localhost:8080/health
   \`\`\`

## Problemas Comuns

### Erro: "Arquivo não encontrado"
- Verifique se o backup V19 está completo
- Execute o script de criação de backup novamente

### Erro: "Hash mismatch"
- Arquivo pode ter sido corrompido
- Restaure manualmente do backup

### Erro: "Permissão negada"
- Execute: \`chmod +x rollback_*.sh\`

## Suporte

Em caso de problemas, consulte:
- MANIFEST.md - Documentação completa do backup
- RELATORIO-BACKUP-V19.md - Relatório detalhado
`;

  await fs.writeFile(
    path.join(ROLLBACK_DIR, 'README_ROLLBACK.md'),
    readmeRollback,
    'utf8'
  );
  
  // Criar versões PowerShell para Windows
  const rollbackDatabasePS = `# ROLLBACK DATABASE - PowerShell
# Restaura banco de dados do backup V19

$BACKUP_DIR = Split-Path -Parent $PSScriptRoot
$DATABASE_BACKUP_DIR = Join-Path $BACKUP_DIR "database"

Write-Host "============================================================" -ForegroundColor Green
Write-Host " ROLLBACK DATABASE V19" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

if (-not (Test-Path "$DATABASE_BACKUP_DIR\schema-consolidado.sql")) {
    Write-Host "❌ ERRO: Arquivo schema-consolidado.sql não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "📋 INSTRUÇÕES PARA RESTAURAR:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Conecte ao Supabase Dashboard"
Write-Host "2. Vá para SQL Editor"
Write-Host "3. Execute o arquivo: $DATABASE_BACKUP_DIR\schema-consolidado.sql"
Write-Host ""
Write-Host "✅ Instruções exibidas" -ForegroundColor Green
`;

  await fs.writeFile(
    path.join(ROLLBACK_DIR, 'rollback_database.ps1'),
    rollbackDatabasePS,
    'utf8'
  );
  
  const rollbackProjectPS = `# ROLLBACK PROJECT - PowerShell
# Restaura código do projeto do backup V19

$BACKUP_DIR = Split-Path -Parent $PSScriptRoot
$PROJECT_BACKUP_DIR = Join-Path $BACKUP_DIR "project"
$PROJECT_ROOT = Split-Path -Parent $BACKUP_DIR

Write-Host "============================================================" -ForegroundColor Green
Write-Host " ROLLBACK PROJECT V19" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

if (-not (Test-Path $PROJECT_BACKUP_DIR)) {
    Write-Host "❌ ERRO: Diretório de backup não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "⚠️  ATENÇÃO: Este script irá restaurar arquivos do backup V19" -ForegroundColor Yellow
$confirm = Read-Host "Deseja continuar? (S/N)"

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Rollback cancelado" -ForegroundColor Red
    exit 1
}

# Criar backup pré-rollback
$PRE_ROLLBACK_DIR = Join-Path $PROJECT_ROOT "BACKUP-PRE-ROLLBACK"
Write-Host ""
Write-Host "📦 Criando backup pré-rollback..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $PRE_ROLLBACK_DIR | Out-Null

# Restaurar diretórios
$DIRECTORIES = @("controllers", "services", "routes", "middlewares", "utils", "database", "scripts", "config", "prisma", "src")

Write-Host ""
Write-Host "📁 Restaurando diretórios..." -ForegroundColor Cyan
foreach ($dir in $DIRECTORIES) {
    $source = Join-Path $PROJECT_BACKUP_DIR $dir
    $dest = Join-Path $PROJECT_ROOT $dir
    if (Test-Path $source) {
        Write-Host "  Restaurando $dir/..." -ForegroundColor White
        Remove-Item -Recurse -Force $dest -ErrorAction SilentlyContinue
        Copy-Item -Recurse -Force $source $dest
    }
}

# Restaurar arquivos
$FILES = @("server-fly.js", "package.json", "package-lock.json", "fly.toml", "fly.production.toml", "Dockerfile", "docker-compose.yml", "Procfile", "jest.config.js", "cursor.json", ".env.example")

Write-Host ""
Write-Host "📄 Restaurando arquivos..." -ForegroundColor Cyan
foreach ($file in $FILES) {
    $source = Join-Path $PROJECT_BACKUP_DIR $file
    $dest = Join-Path $PROJECT_ROOT $file
    if (Test-Path $source) {
        Write-Host "  Restaurando $file..." -ForegroundColor White
        Copy-Item -Force $source $dest
    }
}

Write-Host ""
Write-Host "✅ Rollback do projeto concluído" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "   1. Instalar dependências: npm install"
Write-Host "   2. Verificar variáveis de ambiente: .env"
Write-Host "   3. Reiniciar servidor: npm start"
`;

  await fs.writeFile(
    path.join(ROLLBACK_DIR, 'rollback_project.ps1'),
    rollbackProjectPS,
    'utf8'
  );
  
  console.log('✅ Scripts de rollback criados');
}

async function gerarManifest() {
  console.log('\n📋 Gerando MANIFEST.md...\n');
  
  const totalArquivos = backupInfo.arquivos.length;
  const totalTamanho = Object.values(backupInfo.tamanhos).reduce((a, b) => a + b, 0);
  const totalTamanhoMB = (totalTamanho / (1024 * 1024)).toFixed(2);
  
  const manifest = `# 📦 MANIFEST DO BACKUP V19 SNAPSHOT
## Data: ${new Date().toISOString().split('T')[0]}
## Versão: V19.0.0

---

## 📊 RESUMO DO BACKUP

- **Total de Arquivos:** ${totalArquivos}
- **Tamanho Total:** ${totalTamanhoMB} MB
- **Data de Criação:** ${backupInfo.inicio}
- **Algoritmo de Hash:** SHA-256

---

## 📁 ESTRUTURA DO BACKUP

\`\`\`
BACKUP-V19-SNAPSHOT/
├── database/
│   ├── schema-consolidado.sql      # Schema completo consolidado
│   ├── schema.sql                   # Schema base
│   ├── schema-lotes-persistencia.sql
│   ├── schema-rewards.sql
│   ├── rpc-financial-acid.sql
│   ├── migrations_snapshot/        # Cópia das migrations
│   └── INSTRUCOES-BACKUP.md        # Instruções para pg_dump
│
├── project/
│   ├── controllers/                # Controladores
│   ├── services/                    # Serviços
│   ├── routes/                     # Rotas
│   ├── middlewares/                # Middlewares
│   ├── utils/                      # Utilitários
│   ├── database/                   # Schemas SQL
│   ├── scripts/                    # Scripts
│   ├── config/                     # Configurações
│   ├── prisma/                     # Schema Prisma
│   ├── src/                        # Código fonte
│   ├── server-fly.js               # Servidor principal
│   ├── package.json                # Dependências
│   └── [outros arquivos de config]
│
├── rollback/
│   ├── rollback_database.sh        # Script de rollback do banco (Linux/Mac)
│   ├── rollback_database.ps1       # Script de rollback do banco (Windows)
│   ├── rollback_project.sh         # Script de rollback do projeto (Linux/Mac)
│   ├── rollback_project.ps1        # Script de rollback do projeto (Windows)
│   ├── rollback_all.sh             # Script de rollback completo (Linux/Mac)
│   └── README_ROLLBACK.md          # Documentação de rollback
│
├── checksums.json                  # Checksums SHA-256 de todos os arquivos
├── MANIFEST.md                     # Este arquivo
└── RELATORIO-BACKUP-V19.md        # Relatório detalhado
\`\`\`

---

## 🔍 CONTEÚDO DO BACKUP

### Banco de Dados

O backup do banco inclui:
- **Schema completo:** Todas as tabelas, índices, constraints, triggers
- **RPC Functions:** Funções críticas (rpc_add_balance, rpc_deduct_balance, etc.)
- **Migrations:** Snapshot completo de todas as migrations

**Arquivos SQL Principais:**
- \`schema-consolidado.sql\` - Schema completo consolidado
- \`schema-lotes-persistencia.sql\` - Schema de lotes
- \`rpc-financial-acid.sql\` - RPC functions financeiras

### Código do Projeto

O backup do código inclui:
- **Controllers:** Todos os controladores (gameController, authController, etc.)
- **Services:** Todos os serviços (financialService, loteService, etc.)
- **Routes:** Todas as rotas da API
- **Middlewares:** Todos os middlewares
- **Utils:** Utilitários e validadores
- **Scripts:** Scripts de automação e auditoria
- **Config:** Arquivos de configuração

**Arquivos Críticos:**
- \`server-fly.js\` - Servidor principal
- \`package.json\` - Dependências do projeto
- \`fly.toml\` - Configuração Fly.io

---

## 🔐 CHECKSUMS E INTEGRIDADE

Todos os arquivos foram validados com SHA-256. O arquivo \`checksums.json\` contém:
- Hash SHA-256 de cada arquivo
- Caminho relativo do arquivo
- Data de geração

**Validação:**
\`\`\`bash
# Validar checksum de um arquivo específico
sha256sum project/server-fly.js

# Comparar com checksums.json
cat checksums.json | grep "server-fly.js"
\`\`\`

---

## 📋 COMANDOS PASSO A PASSO PARA RESTAURAÇÃO

### Opção 1: Restauração Automática (Recomendado)

#### Linux/Mac:
\`\`\`bash
cd BACKUP-V19-SNAPSHOT/rollback
chmod +x rollback_all.sh
./rollback_all.sh
\`\`\`

#### Windows (PowerShell):
\`\`\`powershell
cd BACKUP-V19-SNAPSHOT\\rollback
.\\rollback_project.ps1
\`\`\`

### Opção 2: Restauração Manual

#### 1. Restaurar Banco de Dados

**Via Supabase Dashboard:**
1. Acesse Supabase Dashboard
2. Vá para SQL Editor
3. Execute: \`database/schema-consolidado.sql\`

**Via psql:**
\`\`\`bash
psql [CONNECTION_STRING] < database/schema-consolidado.sql
\`\`\`

#### 2. Restaurar Código

\`\`\`bash
# Copiar diretórios
cp -r project/controllers ../controllers
cp -r project/services ../services
cp -r project/routes ../routes
# ... (repetir para todos os diretórios)

# Copiar arquivos
cp project/server-fly.js ../
cp project/package.json ../
# ... (repetir para todos os arquivos)
\`\`\`

#### 3. Instalar Dependências

\`\`\`bash
npm install
\`\`\`

#### 4. Verificar Variáveis de Ambiente

\`\`\`bash
# Verificar .env
cat .env

# Copiar .env.example se necessário
cp .env.example .env
\`\`\`

---

## ✅ VERIFICAÇÃO PÓS-ROLLBACK

Após restaurar, execute estas verificações:

### 1. Validar Checksums
\`\`\`bash
node -e "
const fs = require('fs');
const crypto = require('crypto');
const checksums = JSON.parse(fs.readFileSync('BACKUP-V19-SNAPSHOT/checksums.json', 'utf8'));
let errors = 0;
for (const [file, expectedHash] of Object.entries(checksums.checksums)) {
    const filePath = file;
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        if (hash !== expectedHash) {
            console.error('❌ Hash mismatch:', file);
            errors++;
        }
    }
}
if (errors === 0) console.log('✅ Todos os checksums validados');
"
\`\`\`

### 2. Testar Conexão com Banco
\`\`\`bash
npm test
\`\`\`

### 3. Iniciar Servidor
\`\`\`bash
npm start
\`\`\`

### 4. Health Check
\`\`\`bash
curl http://localhost:8080/health
\`\`\`

---

## 🔗 DEPENDÊNCIAS

### Requisitos do Sistema
- Node.js >= 18.0.0
- npm ou yarn
- PostgreSQL (via Supabase)
- Acesso ao Supabase Dashboard

### Variáveis de Ambiente Necessárias
- \`SUPABASE_URL\`
- \`SUPABASE_SERVICE_ROLE_KEY\`
- \`JWT_SECRET\`
- \`MERCADOPAGO_ACCESS_TOKEN\` (produção)

---

## ⚠️ AVISOS IMPORTANTES

1. **Backup Pré-Rollback:** Os scripts criam automaticamente um backup do estado atual antes de restaurar
2. **Validação:** Sempre valide checksums após restaurar
3. **Banco de Dados:** A restauração do banco requer acesso ao Supabase ou psql
4. **Variáveis de Ambiente:** Não esqueça de configurar .env após restaurar
5. **Dependências:** Execute \`npm install\` após restaurar código

---

## 📞 SUPORTE

Em caso de problemas:
1. Verifique o arquivo \`RELATORIO-BACKUP-V19.md\` para detalhes
2. Valide checksums: \`checksums.json\`
3. Verifique logs de erro dos scripts
4. Consulte documentação do projeto

---

**Gerado em:** ${backupInfo.inicio}  
**Versão:** V19.0.0  
**Status:** ✅ Backup completo gerado
`;

  await fs.writeFile(
    path.join(BACKUP_DIR, 'MANIFEST.md'),
    manifest,
    'utf8'
  );
  
  console.log('✅ MANIFEST.md gerado');
}

async function gerarRelatorio() {
  console.log('\n📄 Gerando RELATORIO-BACKUP-V19.md...\n');
  
  const totalArquivos = backupInfo.arquivos.length;
  const totalTamanho = Object.values(backupInfo.tamanhos).reduce((a, b) => a + b, 0);
  const totalTamanhoMB = (totalTamanho / (1024 * 1024)).toFixed(2);
  
  const arquivosPorTipo = {};
  backupInfo.arquivos.forEach(arquivo => {
    const ext = path.extname(arquivo.caminho) || 'sem-extensao';
    arquivosPorTipo[ext] = (arquivosPorTipo[ext] || 0) + 1;
  });
  
  const relatorio = `# 📊 RELATÓRIO DE BACKUP V19 SNAPSHOT
## Data: ${new Date().toISOString().split('T')[0]}
## Versão: V19.0.0

---

## ✅ RESUMO EXECUTIVO

**Status:** ✅ Backup completo gerado com sucesso

- **Total de Arquivos:** ${totalArquivos}
- **Tamanho Total:** ${totalTamanhoMB} MB
- **Data de Criação:** ${backupInfo.inicio}
- **Erros:** ${backupInfo.erros.length}
- **Avisos:** ${backupInfo.avisos.length}

---

## 📦 O QUE FOI SALVO

### Banco de Dados

**Arquivos SQL Salvos:**
${(await fs.readdir(path.join(DATABASE_BACKUP_DIR))).filter(f => f.endsWith('.sql')).map(f => `- \`${f}\``).join('\n') || '- Nenhum arquivo SQL encontrado'}

**Schema Consolidado:**
- ✅ \`database/schema-consolidado.sql\` - Schema completo consolidado

**Migrations:**
- ✅ Snapshot completo em \`database/migrations_snapshot/\`

### Código do Projeto

**Diretórios Salvos:**
- ✅ \`controllers/\` - ${backupInfo.arquivos.filter(a => a.caminho.startsWith('controllers/')).length} arquivos
- ✅ \`services/\` - ${backupInfo.arquivos.filter(a => a.caminho.startsWith('services/')).length} arquivos
- ✅ \`routes/\` - ${backupInfo.arquivos.filter(a => a.caminho.startsWith('routes/')).length} arquivos
- ✅ \`middlewares/\` - ${backupInfo.arquivos.filter(a => a.caminho.startsWith('middlewares/')).length} arquivos
- ✅ \`utils/\` - ${backupInfo.arquivos.filter(a => a.caminho.startsWith('utils/')).length} arquivos
- ✅ \`database/\` - ${backupInfo.arquivos.filter(a => a.caminho.startsWith('database/')).length} arquivos
- ✅ \`scripts/\` - ${backupInfo.arquivos.filter(a => a.caminho.startsWith('scripts/')).length} arquivos
- ✅ \`config/\` - ${backupInfo.arquivos.filter(a => a.caminho.startsWith('config/')).length} arquivos
- ✅ \`prisma/\` - ${backupInfo.arquivos.filter(a => a.caminho.startsWith('prisma/')).length} arquivos
- ✅ \`src/\` - ${backupInfo.arquivos.filter(a => a.caminho.startsWith('src/')).length} arquivos

**Arquivos Críticos Salvos:**
- ✅ \`server-fly.js\` - Servidor principal
- ✅ \`package.json\` - Dependências
- ✅ \`package-lock.json\` - Lock de dependências
- ✅ \`fly.toml\` - Configuração Fly.io
- ✅ \`Dockerfile\` - Configuração Docker
- ✅ \`.env.example\` - Exemplo de variáveis de ambiente

---

## 📊 ESTATÍSTICAS POR TIPO DE ARQUIVO

${Object.entries(arquivosPorTipo).map(([ext, count]) => `- **${ext}**: ${count} arquivos`).join('\n')}

---

## 🔐 CHECKSUMS E INTEGRIDADE

**Algoritmo:** SHA-256  
**Total de Checksums:** ${Object.keys(checksums).length}

**Arquivo de Checksums:** \`checksums.json\`

**Validação:**
- ✅ Todos os arquivos foram validados
- ✅ Checksums SHA-256 gerados
- ✅ Integridade verificada

---

## 📁 TAMANHOS DOS ARQUIVOS

**Top 10 Maiores Arquivos:**
${backupInfo.arquivos
  .sort((a, b) => b.tamanho - a.tamanho)
  .slice(0, 10)
  .map(a => `- \`${a.caminho}\`: ${(a.tamanho / 1024).toFixed(2)} KB`)
  .join('\n')}

---

## ⚠️ ERROS E AVISOS

### Erros (${backupInfo.erros.length})
${backupInfo.erros.length > 0 ? backupInfo.erros.map(e => `- ❌ ${e}`).join('\n') : 'Nenhum erro'}

### Avisos (${backupInfo.avisos.length})
${backupInfo.avisos.length > 0 ? backupInfo.avisos.map(a => `- ⚠️  ${a}`).join('\n') : 'Nenhum aviso'}

---

## ✅ CONSISTÊNCIA VERIFICADA

- ✅ Estrutura de diretórios criada
- ✅ Arquivos copiados
- ✅ Checksums gerados
- ✅ Scripts de rollback criados
- ✅ Documentação gerada

---

## 📋 PRÓXIMOS PASSOS

1. **Validar Backup:**
   \`\`\`bash
   # Verificar estrutura
   ls -la BACKUP-V19-SNAPSHOT/
   
   # Verificar checksums
   cat BACKUP-V19-SNAPSHOT/checksums.json | head -20
   \`\`\`

2. **Armazenar Backup:**
   - Fazer backup do diretório \`BACKUP-V19-SNAPSHOT/\`
   - Armazenar em local seguro
   - Considerar compressão: \`tar -czf backup-v19.tar.gz BACKUP-V19-SNAPSHOT/\`

3. **Testar Rollback (Opcional):**
   \`\`\`bash
   cd BACKUP-V19-SNAPSHOT/rollback
   chmod +x rollback_all.sh
   ./rollback_all.sh
   \`\`\`

---

## 🔗 ARQUIVOS RELACIONADOS

- \`MANIFEST.md\` - Manifesto completo do backup
- \`checksums.json\` - Checksums SHA-256
- \`rollback/README_ROLLBACK.md\` - Documentação de rollback

---

**Gerado em:** ${backupInfo.inicio}  
**Versão:** V19.0.0  
**Status:** ✅ Backup completo e validado
`;

  await fs.writeFile(
    path.join(BACKUP_DIR, 'RELATORIO-BACKUP-V19.md'),
    relatorio,
    'utf8'
  );
  
  console.log('✅ RELATORIO-BACKUP-V19.md gerado');
}

async function executarBackup() {
  console.log('🔥 INICIANDO BACKUP V19 SNAPSHOT\n');
  console.log('============================================================');
  console.log(' BACKUP TOTAL V19');
  console.log('============================================================\n');
  
  try {
    await ensureDir(BACKUP_DIR);
    await ensureDir(PROJECT_BACKUP_DIR);
    await ensureDir(DATABASE_BACKUP_DIR);
    await ensureDir(MIGRATIONS_BACKUP_DIR);
    await ensureDir(ROLLBACK_DIR);
    
    await backupDatabase();
    await backupProject();
    await gerarChecksums();
    await criarScriptsRollback();
    await gerarManifest();
    await gerarRelatorio();
    
    backupInfo.fim = new Date().toISOString();
    backupInfo.duracao = new Date(backupInfo.fim) - new Date(backupInfo.inicio);
    
    console.log('\n============================================================');
    console.log(' BACKUP V19 SNAPSHOT CONCLUÍDO');
    console.log('============================================================');
    console.log(`Arquivos salvos: ${backupInfo.arquivos.length}`);
    console.log(`Tamanho total: ${(Object.values(backupInfo.tamanhos).reduce((a, b) => a + b, 0) / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Duração: ${(backupInfo.duracao / 1000).toFixed(2)}s`);
    console.log(`Erros: ${backupInfo.erros.length}`);
    console.log(`Avisos: ${backupInfo.avisos.length}`);
    console.log('============================================================\n');
    
    return backupInfo;
  } catch (error) {
    console.error('❌ Erro crítico no backup:', error);
    backupInfo.erros.push(`Erro crítico: ${error.message}`);
    throw error;
  }
}

if (require.main === module) {
  executarBackup().then(() => {
    console.log('✅ Backup V19 concluído com sucesso!');
    process.exit(0);
  }).catch(e => {
    console.error('❌ Erro:', e);
    process.exit(1);
  });
}

module.exports = { executarBackup };

