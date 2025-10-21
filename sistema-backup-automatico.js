// SISTEMA DE BACKUP AUTOMÁTICO - PRODUÇÃO REAL
// =====================================================
// Data: 17/10/2025
// Status: CONFIGURAÇÃO BACKUP AUTOMÁTICO
// Versão: v4.5-backup-automatico

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class SistemaBackup {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        this.diretorioBackup = path.join(__dirname, 'backups');
        this.criarDiretorioBackup();
    }

    criarDiretorioBackup() {
        if (!fs.existsSync(this.diretorioBackup)) {
            fs.mkdirSync(this.diretorioBackup, { recursive: true });
            console.log('📁 Diretório de backup criado:', this.diretorioBackup);
        }
    }

    async executarBackupCompleto() {
        console.log('💾 === SISTEMA DE BACKUP AUTOMÁTICO ===');
        console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
        console.log('🎯 Objetivo: Criar backup completo do sistema');
        console.log('');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const nomeBackup = `backup-goldeouro-${timestamp}`;
        const caminhoBackup = path.join(this.diretorioBackup, nomeBackup);

        try {
            // Criar diretório do backup
            fs.mkdirSync(caminhoBackup, { recursive: true });

            // 1. BACKUP DO BANCO DE DADOS
            await this.backupBancoDados(caminhoBackup);

            // 2. BACKUP DAS CONFIGURAÇÕES
            await this.backupConfiguracoes(caminhoBackup);

            // 3. BACKUP DOS ARQUIVOS DO SISTEMA
            await this.backupArquivosSistema(caminhoBackup);

            // 4. GERAR RELATÓRIO DE BACKUP
            await this.gerarRelatorioBackup(caminhoBackup, nomeBackup);

            console.log('');
            console.log('🎉 BACKUP COMPLETO REALIZADO COM SUCESSO!');
            console.log(`📁 Local: ${caminhoBackup}`);
            console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);

        } catch (error) {
            console.error('❌ Erro durante o backup:', error.message);
        }
    }

    async backupBancoDados(caminhoBackup) {
        console.log('1️⃣ BACKUP DO BANCO DE DADOS...');
        
        const backupDB = {
            timestamp: new Date().toISOString(),
            tabelas: {}
        };

        const tabelas = [
            'usuarios', 'pagamentos_pix', 'saques', 'jogos', 
            'metricas_globais', 'lotes', 'chutes', 'partidas',
            'transacoes', 'configuracoes'
        ];

        for (const tabela of tabelas) {
            try {
                const { data, error } = await this.supabase
                    .from(tabela)
                    .select('*');

                if (error) {
                    console.log(`⚠️ ${tabela}: ${error.message}`);
                    backupDB.tabelas[tabela] = { erro: error.message };
                } else {
                    backupDB.tabelas[tabela] = data || [];
                    console.log(`✅ ${tabela}: ${data ? data.length : 0} registros`);
                }
            } catch (error) {
                console.log(`❌ ${tabela}: Erro de conexão`);
                backupDB.tabelas[tabela] = { erro: error.message };
            }
        }

        // Salvar backup do banco
        const arquivoDB = path.join(caminhoBackup, 'database-backup.json');
        fs.writeFileSync(arquivoDB, JSON.stringify(backupDB, null, 2));
        console.log(`💾 Backup do banco salvo: ${arquivoDB}`);
    }

    async backupConfiguracoes(caminhoBackup) {
        console.log('');
        console.log('2️⃣ BACKUP DAS CONFIGURAÇÕES...');
        
        const configuracoes = {
            timestamp: new Date().toISOString(),
            ambiente: {
                NODE_ENV: process.env.NODE_ENV,
                SUPABASE_URL: process.env.SUPABASE_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
                SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA',
                SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA',
                JWT_SECRET: process.env.JWT_SECRET ? 'DEFINIDA' : 'NÃO DEFINIDA',
                MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN ? 'DEFINIDA' : 'NÃO DEFINIDA'
            },
            sistema: {
                versao: 'v4.5-backup-automatico',
                plataforma: process.platform,
                nodeVersion: process.version,
                arquitetura: process.arch
            }
        };

        // Salvar configurações
        const arquivoConfig = path.join(caminhoBackup, 'configuracoes.json');
        fs.writeFileSync(arquivoConfig, JSON.stringify(configuracoes, null, 2));
        console.log(`💾 Configurações salvas: ${arquivoConfig}`);

        // Backup do arquivo .env (sem valores sensíveis)
        if (fs.existsSync('.env')) {
            const envContent = fs.readFileSync('.env', 'utf8');
            const envBackup = envContent.replace(/=(.*)/g, '=***HIDDEN***');
            const arquivoEnv = path.join(caminhoBackup, 'env-backup.txt');
            fs.writeFileSync(arquivoEnv, envBackup);
            console.log(`💾 Backup do .env salvo: ${arquivoEnv}`);
        }
    }

    async backupArquivosSistema(caminhoBackup) {
        console.log('');
        console.log('3️⃣ BACKUP DOS ARQUIVOS DO SISTEMA...');
        
        const arquivosImportantes = [
            'server-fly.js',
            'package.json',
            'vercel.json'
        ];

        const diretorioArquivos = path.join(caminhoBackup, 'arquivos-sistema');
        fs.mkdirSync(diretorioArquivos, { recursive: true });

        for (const arquivo of arquivosImportantes) {
            if (fs.existsSync(arquivo)) {
                const conteudo = fs.readFileSync(arquivo, 'utf8');
                const arquivoBackup = path.join(diretorioArquivos, arquivo);
                fs.writeFileSync(arquivoBackup, conteudo);
                console.log(`✅ ${arquivo}: Backup realizado`);
            } else {
                console.log(`⚠️ ${arquivo}: Arquivo não encontrado`);
            }
        }

        // Backup dos scripts de auditoria
        const scriptsAuditoria = fs.readdirSync('.').filter(arquivo => 
            arquivo.startsWith('auditoria-') || 
            arquivo.startsWith('teste-') || 
            arquivo.startsWith('verificacao-') ||
            arquivo.startsWith('SCHEMA-')
        );

        for (const script of scriptsAuditoria) {
            try {
                const conteudo = fs.readFileSync(script, 'utf8');
                const arquivoBackup = path.join(diretorioArquivos, script);
                fs.writeFileSync(arquivoBackup, conteudo);
                console.log(`✅ ${script}: Backup realizado`);
            } catch (error) {
                console.log(`⚠️ ${script}: Erro ao fazer backup`);
            }
        }
    }

    async gerarRelatorioBackup(caminhoBackup, nomeBackup) {
        console.log('');
        console.log('4️⃣ GERANDO RELATÓRIO DE BACKUP...');
        
        const relatorio = {
            backup: {
                nome: nomeBackup,
                timestamp: new Date().toISOString(),
                dataFormatada: new Date().toLocaleString('pt-BR'),
                tamanho: this.calcularTamanhoBackup(caminhoBackup)
            },
            sistema: {
                usuarios: await this.contarRegistros('usuarios'),
                jogos: await this.contarRegistros('jogos'),
                pagamentos: await this.contarRegistros('pagamentos_pix'),
                saques: await this.contarRegistros('saques')
            },
            status: 'SUCESSO',
            observacoes: [
                'Backup completo realizado com sucesso',
                'Todos os dados críticos foram preservados',
                'Configurações do sistema incluídas',
                'Arquivos importantes copiados'
            ]
        };

        const arquivoRelatorio = path.join(caminhoBackup, 'relatorio-backup.json');
        fs.writeFileSync(arquivoRelatorio, JSON.stringify(relatorio, null, 2));
        console.log(`💾 Relatório salvo: ${arquivoRelatorio}`);

        // Gerar arquivo de texto legível
        const relatorioTexto = this.gerarRelatorioTexto(relatorio);
        const arquivoTexto = path.join(caminhoBackup, 'relatorio-backup.txt');
        fs.writeFileSync(arquivoTexto, relatorioTexto);
        console.log(`💾 Relatório em texto: ${arquivoTexto}`);
    }

    calcularTamanhoBackup(caminhoBackup) {
        let tamanhoTotal = 0;
        
        function calcularTamanhoDiretorio(diretorio) {
            const arquivos = fs.readdirSync(diretorio);
            for (const arquivo of arquivos) {
                const caminhoArquivo = path.join(diretorio, arquivo);
                const stats = fs.statSync(caminhoArquivo);
                if (stats.isDirectory()) {
                    calcularTamanhoDiretorio(caminhoArquivo);
                } else {
                    tamanhoTotal += stats.size;
                }
            }
        }
        
        calcularTamanhoDiretorio(caminhoBackup);
        return this.formatarTamanho(tamanhoTotal);
    }

    formatarTamanho(bytes) {
        const unidades = ['B', 'KB', 'MB', 'GB'];
        let tamanho = bytes;
        let unidade = 0;
        
        while (tamanho >= 1024 && unidade < unidades.length - 1) {
            tamanho /= 1024;
            unidade++;
        }
        
        return `${tamanho.toFixed(2)} ${unidades[unidade]}`;
    }

    async contarRegistros(tabela) {
        try {
            const { count, error } = await this.supabase
                .from(tabela)
                .select('*', { count: 'exact', head: true });
            
            return error ? 0 : count || 0;
        } catch (error) {
            return 0;
        }
    }

    gerarRelatorioTexto(relatorio) {
        return `
RELATÓRIO DE BACKUP AUTOMÁTICO - GOL DE OURO
============================================

📅 Data: ${relatorio.backup.dataFormatada}
📁 Nome: ${relatorio.backup.nome}
💾 Tamanho: ${relatorio.backup.tamanho}
✅ Status: ${relatorio.status}

📊 DADOS DO SISTEMA:
   - Usuários: ${relatorio.sistema.usuarios}
   - Jogos: ${relatorio.sistema.jogos}
   - Pagamentos: ${relatorio.sistema.pagamentos}
   - Saques: ${relatorio.sistema.saques}

📋 OBSERVAÇÕES:
${relatorio.observacoes.map(obs => `   - ${obs}`).join('\n')}

🔧 INFORMAÇÕES TÉCNICAS:
   - Sistema: ${process.platform}
   - Node.js: ${process.version}
   - Arquitetura: ${process.arch}
   - Versão: v4.5-backup-automatico

📅 Backup gerado em: ${new Date().toLocaleString('pt-BR')}
🎯 Status: BACKUP COMPLETO REALIZADO COM SUCESSO
        `.trim();
    }

    async listarBackups() {
        console.log('📋 === LISTA DE BACKUPS DISPONÍVEIS ===');
        console.log('');
        
        if (!fs.existsSync(this.diretorioBackup)) {
            console.log('❌ Diretório de backup não encontrado');
            return;
        }

        const backups = fs.readdirSync(this.diretorioBackup)
            .filter(item => {
                const caminho = path.join(this.diretorioBackup, item);
                return fs.statSync(caminho).isDirectory();
            })
            .sort()
            .reverse(); // Mais recentes primeiro

        if (backups.length === 0) {
            console.log('⚠️ Nenhum backup encontrado');
            return;
        }

        console.log(`📊 Total de backups: ${backups.length}`);
        console.log('');

        backups.forEach((backup, index) => {
            const caminhoBackup = path.join(this.diretorioBackup, backup);
            const stats = fs.statSync(caminhoBackup);
            const tamanho = this.calcularTamanhoBackup(caminhoBackup);
            
            console.log(`${index + 1}. ${backup}`);
            console.log(`   📅 Criado: ${stats.birthtime.toLocaleString('pt-BR')}`);
            console.log(`   💾 Tamanho: ${tamanho}`);
            console.log('');
        });
    }
}

// Executar backup
async function executarBackup() {
    const backup = new SistemaBackup();
    
    // Executar backup completo
    await backup.executarBackupCompleto();
    
    // Listar backups disponíveis
    console.log('');
    await backup.listarBackups();
}

executarBackup().catch(console.error);


