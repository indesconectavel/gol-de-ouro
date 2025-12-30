// VERIFICAÇÃO URGENTE SISTEMA CADASTRO E LOGIN - PRODUÇÃO REAL
// =====================================================
// Data: 17/10/2025
// Status: VERIFICAÇÃO URGENTE PROBLEMAS USUÁRIOS
// Versão: v4.5-verificacao-urgente-login

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verificacaoUrgenteLogin() {
    console.log('🚨 === VERIFICAÇÃO URGENTE SISTEMA CADASTRO E LOGIN ===');
    console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
    console.log('⚠️ Problema: Usuários não conseguem cadastrar e logar');
    console.log('⚠️ Sintoma: Login entra e redireciona para tela de login');
    console.log('');

    let problemas = [];
    let solucoes = [];

    // 1. VERIFICAR BACKEND E ENDPOINTS
    console.log('1️⃣ VERIFICANDO BACKEND E ENDPOINTS...');
    
    try {
        const response = await fetch('http://localhost:8080/health');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend: Online');
            console.log(`📊 Status: ${data.message}`);
            console.log(`📊 Banco: ${data.database}`);
            console.log(`📊 Usuários: ${data.usuarios}`);
        } else {
            problemas.push('Backend não está respondendo corretamente');
            console.log('❌ Backend: Erro de resposta');
        }
    } catch (error) {
        problemas.push('Backend não está acessível');
        console.log('❌ Backend: Erro de conexão');
    }

    // 2. TESTAR ENDPOINT DE REGISTRO
    console.log('');
    console.log('2️⃣ TESTANDO ENDPOINT DE REGISTRO...');
    
    try {
        const testUser = {
            username: `teste_urgente_${Date.now()}`,
            email: `teste_urgente_${Date.now()}@goldeouro.com`,
            password: '123456'
        };

        const response = await fetch('http://localhost:8080/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Registro: Funcionando');
            console.log(`📊 Token gerado: ${data.token ? 'Sim' : 'Não'}`);
            console.log(`📊 Usuário criado: ${data.user ? 'Sim' : 'Não'}`);
            
            if (!data.token) {
                problemas.push('Endpoint de registro não está gerando token');
            }
            if (!data.user) {
                problemas.push('Endpoint de registro não está retornando dados do usuário');
            }
        } else {
            const error = await response.json();
            problemas.push(`Erro no registro: ${error.message}`);
            console.log('❌ Registro:', error.message);
        }
    } catch (error) {
        problemas.push(`Erro de conexão no registro: ${error.message}`);
        console.log('❌ Registro: Erro de conexão');
    }

    // 3. TESTAR ENDPOINT DE LOGIN
    console.log('');
    console.log('3️⃣ TESTANDO ENDPOINT DE LOGIN...');
    
    try {
        const loginData = {
            email: 'teste@goldeouro.com',
            password: '123456'
        };

        const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Login: Funcionando');
            console.log(`📊 Token gerado: ${data.token ? 'Sim' : 'Não'}`);
            console.log(`📊 Usuário retornado: ${data.user ? 'Sim' : 'Não'}`);
            
            if (!data.token) {
                problemas.push('Endpoint de login não está gerando token');
            }
            if (!data.user) {
                problemas.push('Endpoint de login não está retornando dados do usuário');
            }
        } else {
            const error = await response.json();
            console.log('⚠️ Login:', error.message, '(Usuário de teste pode não existir)');
        }
    } catch (error) {
        problemas.push(`Erro de conexão no login: ${error.message}`);
        console.log('❌ Login: Erro de conexão');
    }

    // 4. VERIFICAR SUPABASE E TABELA USUARIOS
    console.log('');
    console.log('4️⃣ VERIFICANDO SUPABASE E TABELA USUARIOS...');
    
    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Verificar estrutura da tabela usuarios
        const { data: usuarios, error: usuariosError } = await supabase
            .from('usuarios')
            .select('id, username, email, password, created_at, saldo')
            .limit(3);

        if (usuariosError) {
            problemas.push(`Erro ao consultar usuários: ${usuariosError.message}`);
            console.log('❌ Supabase:', usuariosError.message);
        } else {
            console.log('✅ Supabase: Conectado');
            console.log(`📊 Usuários encontrados: ${usuarios.length}`);
            
            if (usuarios.length > 0) {
                console.log('📋 Estrutura dos usuários:');
                usuarios.forEach((user, index) => {
                    console.log(`  ${index + 1}. ${user.username} (${user.email})`);
                    console.log(`     - ID: ${user.id}`);
                    console.log(`     - Senha: ${user.password ? 'Definida' : 'Não definida'}`);
                    console.log(`     - Saldo: R$ ${user.saldo || 0}`);
                    console.log(`     - Criado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
                });
            }
        }
    } catch (error) {
        problemas.push(`Erro de conexão Supabase: ${error.message}`);
        console.log('❌ Supabase: Erro de conexão');
    }

    // 5. VERIFICAR FRONTENDS E DEPLOYS
    console.log('');
    console.log('5️⃣ VERIFICANDO FRONTENDS E DEPLOYS...');
    
    // Player Deploy
    try {
        const response = await fetch('https://goldeouro-player-loby2my1j-goldeouro-admins-projects.vercel.app');
        if (response.ok) {
            console.log('✅ Player Deploy: Funcionando');
        } else {
            problemas.push('Player Deploy não está funcionando');
            console.log('❌ Player Deploy: Erro de resposta');
        }
    } catch (error) {
        problemas.push('Player Deploy não está acessível');
        console.log('❌ Player Deploy: Erro de conexão');
    }

    // Admin Deploy
    try {
        const response = await fetch('https://goldeouro-admin-tiqfzn2u8-goldeouro-admins-projects.vercel.app');
        if (response.ok) {
            console.log('✅ Admin Deploy: Funcionando');
        } else {
            problemas.push('Admin Deploy não está funcionando');
            console.log('❌ Admin Deploy: Erro de resposta');
        }
    } catch (error) {
        problemas.push('Admin Deploy não está acessível');
        console.log('❌ Admin Deploy: Erro de conexão');
    }

    // URLs de Produção
    const urlsProducao = [
        'https://goldeouro.lol',
        'https://app.goldeouro.lol',
        'https://admin.goldeouro.lol'
    ];

    for (const url of urlsProducao) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                console.log(`✅ ${url}: Funcionando`);
            } else {
                problemas.push(`${url} não está funcionando`);
                console.log(`❌ ${url}: Status ${response.status}`);
            }
        } catch (error) {
            problemas.push(`${url} não está acessível`);
            console.log(`❌ ${url}: Erro de conexão`);
        }
    }

    // 6. VERIFICAR CONFIGURAÇÕES DE AMBIENTE
    console.log('');
    console.log('6️⃣ VERIFICANDO CONFIGURAÇÕES DE AMBIENTE...');
    
    console.log('📋 Variáveis de ambiente:');
    console.log(`   - SUPABASE_URL: ${process.env.SUPABASE_URL ? 'Definida' : 'NÃO DEFINIDA'}`);
    console.log(`   - SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'Definida' : 'NÃO DEFINIDA'}`);
    console.log(`   - SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Definida' : 'NÃO DEFINIDA'}`);
    console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? 'Definida' : 'NÃO DEFINIDA'}`);
    console.log(`   - MERCADOPAGO_ACCESS_TOKEN: ${process.env.MERCADOPAGO_ACCESS_TOKEN ? 'Definida' : 'NÃO DEFINIDA'}`);

    if (!process.env.SUPABASE_URL) {
        problemas.push('SUPABASE_URL não está definida');
    }
    if (!process.env.SUPABASE_ANON_KEY) {
        problemas.push('SUPABASE_ANON_KEY não está definida');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        problemas.push('SUPABASE_SERVICE_ROLE_KEY não está definida');
    }
    if (!process.env.JWT_SECRET) {
        problemas.push('JWT_SECRET não está definida');
    }

    // 7. VERIFICAR MIDDLEWARE DE AUTENTICAÇÃO
    console.log('');
    console.log('7️⃣ VERIFICANDO MIDDLEWARE DE AUTENTICAÇÃO...');
    
    try {
        const response = await fetch('http://localhost:8080/api/user/profile', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer invalid-token'
            }
        });

        if (response.status === 401) {
            console.log('✅ Middleware: Rejeitando token inválido corretamente');
        } else {
            problemas.push('Middleware não está rejeitando tokens inválidos');
            console.log('❌ Middleware: Não está funcionando corretamente');
        }
    } catch (error) {
        problemas.push(`Erro ao testar middleware: ${error.message}`);
        console.log('❌ Middleware: Erro de teste');
    }

    // 8. RELATÓRIO DE PROBLEMAS E SOLUÇÕES
    console.log('');
    console.log('🚨 === RELATÓRIO DE PROBLEMAS IDENTIFICADOS ===');
    console.log('');

    if (problemas.length === 0) {
        console.log('✅ Nenhum problema crítico identificado!');
        console.log('');
        console.log('🔍 POSSÍVEIS CAUSAS DO PROBLEMA DOS USUÁRIOS:');
        console.log('1. Problema no frontend (JavaScript/CSS)');
        console.log('2. Problema de cache do navegador');
        console.log('3. Problema de CORS');
        console.log('4. Problema de configuração de ambiente no frontend');
        console.log('5. Problema de roteamento no frontend');
        console.log('');
        console.log('📋 SOLUÇÕES RECOMENDADAS:');
        console.log('1. Limpar cache do navegador');
        console.log('2. Verificar console do navegador para erros');
        console.log('3. Verificar configurações de ambiente no frontend');
        console.log('4. Testar em modo incógnito');
        console.log('5. Verificar se as URLs estão corretas');
    } else {
        console.log(`❌ ${problemas.length} problemas identificados:`);
        problemas.forEach((problema, index) => {
            console.log(`   ${index + 1}. ${problema}`);
        });
        console.log('');
        console.log('🔧 SOLUÇÕES NECESSÁRIAS:');
        problemas.forEach((problema, index) => {
            console.log(`   ${index + 1}. Corrigir: ${problema}`);
        });
    }

    // 9. TESTE COMPLETO DE FLUXO
    console.log('');
    console.log('9️⃣ TESTE COMPLETO DE FLUXO...');
    
    try {
        // Criar usuário
        const novoUsuario = {
            username: `fluxo_completo_${Date.now()}`,
            email: `fluxo_completo_${Date.now()}@goldeouro.com`,
            password: '123456'
        };

        console.log('📝 Criando usuário de teste...');
        const registroResponse = await fetch('http://localhost:8080/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoUsuario)
        });

        if (registroResponse.ok) {
            const registroData = await registroResponse.json();
            console.log('✅ Usuário criado com sucesso');
            
            if (registroData.token) {
                console.log('✅ Token gerado no registro');
                
                // Testar login com o usuário criado
                console.log('🔐 Testando login com usuário criado...');
                const loginResponse = await fetch('http://localhost:8080/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: novoUsuario.email,
                        password: novoUsuario.password
                    })
                });

                if (loginResponse.ok) {
                    const loginData = await loginResponse.json();
                    console.log('✅ Login funcionando com usuário criado');
                    
                    if (loginData.token) {
                        console.log('✅ Token gerado no login');
                        
                        // Testar endpoint protegido
                        console.log('🛡️ Testando endpoint protegido...');
                        const profileResponse = await fetch('http://localhost:8080/api/user/profile', {
                            headers: { 'Authorization': `Bearer ${loginData.token}` }
                        });

                        if (profileResponse.ok) {
                            console.log('✅ Endpoint protegido funcionando');
                            console.log('🎉 FLUXO COMPLETO FUNCIONANDO!');
                        } else {
                            problemas.push('Endpoint protegido não está funcionando');
                            console.log('❌ Endpoint protegido com problema');
                        }
                    } else {
                        problemas.push('Token não está sendo gerado no login');
                        console.log('❌ Token não gerado no login');
                    }
                } else {
                    const loginError = await loginResponse.json();
                    problemas.push(`Login falhou: ${loginError.message}`);
                    console.log('❌ Login falhou:', loginError.message);
                }
            } else {
                problemas.push('Token não está sendo gerado no registro');
                console.log('❌ Token não gerado no registro');
            }
        } else {
            const registroError = await registroResponse.json();
            problemas.push(`Registro falhou: ${registroError.message}`);
            console.log('❌ Registro falhou:', registroError.message);
        }
    } catch (error) {
        problemas.push(`Erro no teste de fluxo: ${error.message}`);
        console.log('❌ Erro no teste de fluxo:', error.message);
    }

    // 10. CONCLUSÃO E PRÓXIMOS PASSOS
    console.log('');
    console.log('🏁 === CONCLUSÃO E PRÓXIMOS PASSOS ===');
    console.log('');

    if (problemas.length === 0) {
        console.log('✅ BACKEND ESTÁ FUNCIONANDO CORRETAMENTE!');
        console.log('');
        console.log('🔍 O PROBLEMA PODE ESTAR NO FRONTEND:');
        console.log('1. Verificar configurações de ambiente no frontend');
        console.log('2. Verificar se as URLs da API estão corretas');
        console.log('3. Verificar se há erros no console do navegador');
        console.log('4. Verificar se o AuthContext está funcionando');
        console.log('5. Verificar se as rotas estão configuradas corretamente');
        console.log('');
        console.log('📋 AÇÕES IMEDIATAS:');
        console.log('1. Verificar arquivo .env do frontend');
        console.log('2. Verificar AuthContext.jsx');
        console.log('3. Verificar configurações de ambiente');
        console.log('4. Testar em navegador com console aberto');
    } else {
        console.log('❌ PROBLEMAS IDENTIFICADOS NO BACKEND!');
        console.log('');
        console.log('🔧 CORREÇÕES NECESSÁRIAS:');
        problemas.forEach((problema, index) => {
            console.log(`   ${index + 1}. ${problema}`);
        });
    }

    console.log('');
    console.log('📅 Verificação concluída em:', new Date().toLocaleString('pt-BR'));
    console.log('🎯 Status: Verificação urgente de login finalizada');
}

// Executar verificação urgente
verificacaoUrgenteLogin().catch(console.error);
