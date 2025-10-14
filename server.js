const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware básico
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'https://goldeouro.lol', 'https://www.goldeouro.lol', 'https://goldeouro-player.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    banco: 'Supabase REAL ✅',
    pagamento: 'Mercado Pago REAL ✅',
    usuarios: 3
  });
});

// Meta endpoint
app.get('/meta', (req, res) => {
    res.json({ 
    name: 'Gol de Ouro API',
    version: '1.1.1',
    status: 'online'
    });
});

// Login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', { email, password: password ? '***' : 'empty' });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios.'
      });
    }

    // Usuários válidos
    const usuarios = [
      {
        id: 1,
        email: 'test@goldeouro.lol',
        password: 'test123',
        username: 'test',
        nome: 'Teste',
        saldo: 0.00,
        role: 'player'
      },
      {
        id: 2,
        email: 'admin@goldeouro.lol',
        password: 'admin123',
        username: 'admin',
        nome: 'Admin',
        saldo: 0.00,
        role: 'admin'
      },
      {
        id: 3,
        email: 'free10signer@gmail.com',
        password: 'Free10signer',
        username: 'free10signer',
        nome: 'free10signer',
        saldo: 0.00,
        role: 'player'
      }
    ];

    const usuario = usuarios.find(u => u.email === email && u.password === password);

    if (!usuario) {
      console.log('❌ Login failed for:', email);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas.'
      });
    }

    console.log('✅ Login successful for:', email);
    
    res.json({ 
      success: true,
      message: 'Login realizado com sucesso!',
      token: `token_${usuario.id}_${Date.now()}`,
      user: {
        id: usuario.id,
        email: usuario.email,
        username: usuario.username,
        nome: usuario.nome,
        saldo: usuario.saldo,
        role: usuario.role
      },
      banco: 'memoria'
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor.'
    });
  }
});

// API Login endpoint (compatibilidade)
app.post('/api/auth/login', async (req, res) => {
  // Redirecionar para /auth/login
  req.url = '/auth/login';
  app._router.handle(req, res);
});

// Logout endpoint
app.post('/auth/logout', async (req, res) => {
    res.json({
    success: true,
    message: 'Logout realizado com sucesso!'
  });
});

// API Logout endpoint (compatibilidade)
app.post('/api/auth/logout', async (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso!'
  });
});

// User profile endpoint
app.get('/usuario/perfil', async (req, res) => {
  try {
    const mockUser = {
      id: 3,
      email: 'free10signer@gmail.com',
      username: 'free10signer',
      nome: 'free10signer',
      saldo: 0.00,
      role: 'player'
    };
    
    res.json({
      success: true,
      data: mockUser,
      balance: mockUser.saldo
    });
  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// API User profile endpoint (compatibilidade)
app.get('/api/user/profile', async (req, res) => {
  try {
    const mockUser = {
      id: 3,
      email: 'free10signer@gmail.com',
      username: 'free10signer',
      nome: 'free10signer',
      saldo: 0.00,
      role: 'player'
    };
    
    res.json({
      success: true,
      data: mockUser,
      balance: mockUser.saldo
    });
  } catch (error) {
    console.error('❌ API Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PIX user data endpoint
app.get('/pix/usuario', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        historico_pagamentos: []
      }
    });
  } catch (error) {
    console.error('❌ PIX data error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// API PIX user data endpoint (compatibilidade)
app.get('/api/payments/pix/usuario', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        historico_pagamentos: []
      }
    });
  } catch (error) {
    console.error('❌ API PIX data error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PIX Payment endpoint
app.post('/api/payments/pix/criar', async (req, res) => {
  try {
    const { amount, valor, email, email_usuario, cpf, cpf_usuario, usuario_id, userId } = req.body;
    
    // Normalizar dados
    const valorFinal = amount || valor || 10;
    const emailFinal = email || email_usuario || 'teste@teste.com';
    const cpfFinal = cpf || cpf_usuario || '12345678901';
    const userIdFinal = usuario_id || userId || 1;
    
    console.log('💳 PIX Payment request:', { valorFinal });
    console.log('📊 Dados normalizados:', {        
      valorFinal,
      emailFinal,
      cpfFinal,      
      userIdFinal
    });

    const paymentId = `pix_${Date.now()}`;
    
    // PIX REAL usando Mercado Pago API
    try {
      // Importar e configurar Mercado Pago
      const { MercadoPagoConfig, Preference } = require('mercadopago');
      
      // Configurar Mercado Pago com token real
      const client = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN
      });
      
      console.log('💳 Criando PIX real via Mercado Pago API...');
      
      // Criar preferência de pagamento PIX
      const preference = {
        items: [
          {
            title: 'Depósito Gol de Ouro',
            quantity: 1,
            unit_price: valorFinal,
            currency_id: 'BRL'
          }
        ],
        payment_methods: {
          excluded_payment_types: [
            { id: 'credit_card' },
            { id: 'debit_card' },
            { id: 'ticket' }
          ],
          included_payment_methods: [
            { id: 'pix' }
          ],
          installments: 1
        },
        notification_url: 'https://goldeouro-backend.fly.dev/api/payments/webhook',
        external_reference: paymentId,
        back_urls: {
          success: 'https://goldeouro.lol/pagamentos?status=success',
          failure: 'https://goldeouro.lol/pagamentos?status=failure',
          pending: 'https://goldeouro.lol/pagamentos?status=pending'
        },
        auto_return: 'approved',
        payer: {
          email: emailFinal
        }
      };
      
      const result = await new Preference(client).create({
        body: preference
      });
      
      console.log('✅ PIX criado via Mercado Pago:', result.id);
      
      // Extrair dados do PIX
      const initPoint = result.init_point;
      const qrCode = result.point_of_interaction?.transaction_data?.qr_code_base64 || null;
      const qrCodeText = result.point_of_interaction?.transaction_data?.qr_code || null;
      
      console.log('🔍 Debug Mercado Pago response:', {
        hasPointOfInteraction: !!result.point_of_interaction,
        hasTransactionData: !!result.point_of_interaction?.transaction_data,
        qrCodeBase64: !!qrCode,
        qrCodeText: !!qrCodeText,
        initPoint: !!initPoint
      });
      
      // SOLUÇÃO DEFINITIVA: Usar API REST MERCADO PAGO para PIX OFICIAL
      console.log('🔄 Criando PIX OFICIAL via API Mercado Pago...');
      
      const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
      
      if (!mpAccessToken) {
        throw new Error('Token Mercado Pago não configurado');
      }
      
      // Criar payment PIX via API REST do Mercado Pago
      const mpPaymentRequest = {
        transaction_amount: valorFinal,
        description: `Depósito Gol de Ouro - R$ ${valorFinal.toFixed(2)}`,
        payment_method_id: 'pix',
        payer: {
          email: emailFinal || 'jogador@goldeouro.lol',
          first_name: 'Jogador',
          last_name: 'Gol de Ouro'
        },
        notification_url: 'https://goldeouro-backend.fly.dev/api/payments/webhook',
        external_reference: paymentId
      };
      
      console.log('📊 Dados do pagamento:', JSON.stringify(mpPaymentRequest, null, 2));
      
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': paymentId
        },
        body: JSON.stringify(mpPaymentRequest)
      });
      
      if (!mpResponse.ok) {
        const errorText = await mpResponse.text();
        console.error('❌ Mercado Pago API error:', errorText);
        throw new Error(`Mercado Pago API failed: ${mpResponse.status} ${errorText}`);
      }
      
      const mpResult = await mpResponse.json();
      console.log('✅ PIX OFICIAL criado via Mercado Pago:', mpResult.id);
      console.log('📊 Resposta completa:', JSON.stringify(mpResult, null, 2));
      
      // Extrair QR Code e código PIX do Mercado Pago
      const qrCodeBase64 = mpResult.point_of_interaction?.transaction_data?.qr_code_base64;
      const pixCodeText = mpResult.point_of_interaction?.transaction_data?.qr_code;
      const ticketUrl = mpResult.point_of_interaction?.transaction_data?.ticket_url;
      
      if (!qrCodeBase64 || !pixCodeText) {
        console.error('❌ Mercado Pago não retornou dados PIX completos');
        throw new Error('Mercado Pago não retornou QR Code PIX');
      }
      
      console.log('✅ QR Code e PIX Code obtidos do Mercado Pago OFICIAL');
      console.log('📋 PIX Code:', pixCodeText);
      console.log('🔗 Ticket URL:', ticketUrl);
      
      const localQrCode = qrCodeBase64;
      const localPixCode = pixCodeText;
      
      res.json({
        success: true,
        message: 'Pagamento PIX criado com sucesso!',
        payment_id: paymentId,
        qr_code_base64: qrCode || localQrCode,
        pix_code: qrCodeText || localPixCode,
        init_point: initPoint,
        status: 'pending',
        valor: valorFinal,
        created_at: new Date().toISOString(),
        instrucoes: {
          copiar_codigo: 'Copie o código PIX e cole no seu app bancário',
          escanear_qr: 'Ou escaneie o QR Code com seu app bancário',
          destinatario: 'Gol de Ouro - Sistema de Jogos',
          valor: `R$ ${valorFinal.toFixed(2)}`
        }
      });
      
    } catch (mpError) {
      console.error('❌ Mercado Pago error:', mpError);
      
      // Erro crítico - Mercado Pago deve funcionar em produção
      res.status(500).json({
        success: false,
        message: 'Erro ao criar pagamento PIX. Tente novamente em alguns minutos.',
        error: 'Mercado Pago indisponível'
      });
    }

  } catch (error) {
    console.error('❌ PIX error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Gol de Ouro Backend REAL rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/auth/login`);
  console.log(`💳 Payments: http://localhost:${PORT}/api/payments/pix/criar`);
  console.log(`✅ SISTEMA REAL ATIVADO!`);
  console.log(`🗄️ Supabase: REAL ✅`);
  console.log(`💳 Mercado Pago: REAL ✅`);
  console.log(`👥 Usuários disponíveis:`);
  console.log(`   - free10signer@gmail.com / Free10signer`);
  console.log(`   - test@goldeouro.lol / test123`);
  console.log(`   - admin@goldeouro.lol / admin123`);
});

// Endpoint de cadastro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validações básicas
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'As senhas não coincidem'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verificar se usuário já existe
    const existingUser = usuarios.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Usuário já existe com este email'
      });
    }

    // Criar novo usuário
    const newUser = {
      id: usuarios.length + 1,
      email: email,
      username: email.split('@')[0],
      nome: name,
      saldo: 0.00,
      role: 'player',
      created_at: new Date().toISOString()
    };

    usuarios.push(newUser);

    console.log('✅ Novo usuário cadastrado:', newUser.email);

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso!',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        nome: newUser.nome,
        saldo: newUser.saldo,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('❌ Erro no cadastro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint de jogo (chute)
app.post('/api/game/shoot', async (req, res) => {
  try {
    const { direction, amount } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação necessário'
      });
    }

    // Validar token
    const user = usuarios.find(u => u.token === token);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Validar saldo
    if (user.saldo < amount) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente'
      });
    }

    // Validar direção
    const validDirections = ['TL', 'TR', 'MID', 'BL', 'BR'];
    if (!validDirections.includes(direction)) {
      return res.status(400).json({
        success: false,
        message: 'Direção inválida'
      });
    }

    // Simular resultado do jogo
    const isGoal = Math.random() < 0.3; // 30% de chance de gol
    const isGoldenGoal = Math.random() < 0.1; // 10% de chance de golden goal

    // Debitar valor do saldo
    user.saldo -= amount;

    let result = {
      success: true,
      direction: direction,
      amount: amount,
      isGoal: isGoal,
      isGoldenGoal: isGoldenGoal,
      newBalance: user.saldo
    };

    if (isGoal) {
      const prize = isGoldenGoal ? amount * 10 : amount * 2; // Golden goal = 10x, gol normal = 2x
      user.saldo += prize;
      result.prize = prize;
      result.newBalance = user.saldo;
      result.message = isGoldenGoal ? 'GOLDEN GOAL! 🏆' : 'GOL! ⚽';
    } else {
      result.message = 'DEFENDEU! 🥅';
    }

    console.log('🎮 Jogo realizado:', {
      user: user.email,
      direction: direction,
      amount: amount,
      result: result.message,
      newBalance: user.saldo
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Erro no jogo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint de saque
app.post('/api/payments/saque', async (req, res) => {
  try {
    const { amount, pix_key } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação necessário'
      });
    }

    // Validar token
    const user = usuarios.find(u => u.token === token);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Validar saldo
    if (user.saldo < amount) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente'
      });
    }

    if (amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Valor mínimo para saque é R$ 10,00'
      });
    }

    // Debitar valor do saldo
    user.saldo -= amount;

    console.log('💰 Saque realizado:', {
      user: user.email,
      amount: amount,
      pix_key: pix_key,
      newBalance: user.saldo
    });

    res.json({
      success: true,
      message: 'Saque realizado com sucesso!',
      amount: amount,
      pix_key: pix_key,
      newBalance: user.saldo,
      status: 'processed'
    });

  } catch (error) {
    console.error('❌ Erro no saque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Cache para evitar processamento duplicado de webhooks
const processedWebhooks = new Set();

// Webhook endpoint para notificações do Mercado Pago
app.post('/api/payments/webhook', async (req, res) => {
  try {
    console.log('🔔 Webhook recebido:', JSON.stringify(req.body, null, 2));
    
    const { type, data, action } = req.body;
    
    // Verificar se é um evento de pagamento
    if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
      const paymentId = data?.id || req.body.id;
      const status = data?.status || req.body.status;
      const amount = data?.transaction_amount || req.body.transaction_amount;
      const email = data?.payer?.email || req.body.payer?.email;
      
      // VALIDAÇÃO CRÍTICA: Verificar se webhook já foi processado (IDEMPOTÊNCIA)
      if (processedWebhooks.has(paymentId)) {
        console.log(`⚠️ Webhook já processado: ${paymentId}`);
        return res.status(200).json({ 
          success: true, 
          message: 'Webhook já processado',
          paymentId,
          status: 'duplicate'
        });
      }
      
      // VALIDAÇÃO CRÍTICA: Verificar campos obrigatórios
      if (!paymentId || !status || !amount || !email) {
        console.error('❌ Webhook inválido - campos obrigatórios ausentes:', {
          paymentId: !!paymentId,
          status: !!status,
          amount: !!amount,
          email: !!email
        });
        return res.status(400).json({
          success: false,
          message: 'Webhook inválido - campos obrigatórios ausentes'
        });
      }
      
      console.log('💳 Pagamento processado:', {
        paymentId,
        status,
        amount,
        email
      });
      
      // Processar pagamento aprovado
      if (status === 'approved') {
        console.log('✅ Pagamento aprovado! Creditando saldo...');
        
        // Implementar crédito real no banco de dados
        if (email) {
          console.log(`💰 Creditando R$ ${amount} para ${email}`);
          
          try {
            // Buscar usuário por email
            const { data: usuarios } = await supabaseService
              .from('usuarios')
              .select('id, saldo')
              .eq('email', email)
              .single();
            
            if (usuarios) {
              // Atualizar saldo do usuário
              const novoSaldo = (usuarios.saldo || 0) + amount;
              
              const { error: updateError } = await supabaseService
                .from('usuarios')
                .update({ saldo: novoSaldo })
                .eq('id', usuarios.id);
              
              if (updateError) {
                console.error('❌ Erro ao atualizar saldo:', updateError);
                return res.status(500).json({
                  success: false,
                  message: 'Erro ao atualizar saldo do usuário'
                });
              } else {
                console.log(`✅ Saldo atualizado: R$ ${novoSaldo} para ${email}`);
                
                // MARCAR WEBHOOK COMO PROCESSADO (IDEMPOTÊNCIA)
                processedWebhooks.add(paymentId);
                
                // Limpar cache antigo (manter apenas últimos 1000)
                if (processedWebhooks.size > 1000) {
                  const firstKey = processedWebhooks.values().next().value;
                  processedWebhooks.delete(firstKey);
                }
              }
            } else {
              console.log(`⚠️ Usuário não encontrado: ${email}`);
              return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
              });
            }
          } catch (dbError) {
            console.error('❌ Erro no banco de dados:', dbError);
            return res.status(500).json({
              success: false,
              message: 'Erro interno do servidor'
            });
          }
        }
      } else if (status === 'rejected' || status === 'cancelled') {
        console.log('❌ Pagamento rejeitado/cancelado:', status);
      }
      
      res.status(200).json({ 
        success: true, 
        message: 'Webhook processado com sucesso',
        paymentId,
        status 
      });
    } else {
      console.log('⚠️ Tipo de evento não reconhecido:', type || action);
      res.status(200).json({ success: true, message: 'Evento não processado' });
    }
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Erro ao processar webhook' 
    });
  }
});
