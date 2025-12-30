// Controller de usuários - Gol de Ouro v4.0 - SEM MOCKS
// =====================================================
// Data: 2025-01-12
// Status: FASE 6 - UsuarioController usando Supabase real
//
// Este controller fornece endpoints para gerenciamento de usuários,
// usando dados reais do Supabase, sem mocks.
// =====================================================

const { supabase, supabaseAdmin } = require('../../../../database/supabase-unified-config');
const response = require('../../shared/utils/response-helper');

// GET /api/user/profile
const getUserProfile = async (req, res) => {
  try {
    // Obter userId do JWT (req.user.userId)
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return response.unauthorized(res, 'Token inválido ou expirado');
    }

      // ✅ GO-LIVE FIX FASE 2: Usar supabaseAdmin para bypass de RLS
      // O token JWT já valida o usuário, então podemos usar admin para garantir acesso
      const { data: usuario, error } = await supabaseAdmin
        .from('usuarios')
        .select('id, email, username, saldo, tipo, ativo, email_verificado, total_apostas, total_ganhos, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error || !usuario) {
        console.error('❌ [USER-CONTROLLER] Erro ao buscar perfil:', error);
        // ✅ GO-LIVE FIX FASE 2: Se token é válido mas usuário não existe, retornar 401 (não 404)
        // Isso indica problema de consistência, mas não que a rota não existe
        return response.unauthorized(res, 'Usuário não encontrado ou token inválido');
      }

    // Verificar se usuário está ativo
    if (!usuario.ativo) {
      return response.forbidden(res, 'Conta desativada');
    }

    return response.success(
      res,
      {
        id: usuario.id,
        email: usuario.email,
        username: usuario.username,
        saldo: parseFloat(usuario.saldo || 0),
        tipo: usuario.tipo || 'jogador',
        ativo: usuario.ativo,
        email_verificado: usuario.email_verificado || false,
        total_apostas: usuario.total_apostas || 0,
        total_ganhos: parseFloat(usuario.total_ganhos || 0),
        created_at: usuario.created_at,
        updated_at: usuario.updated_at
      },
      'Perfil obtido com sucesso!'
    );
  } catch (error) {
    console.error('❌ [USER-CONTROLLER] Erro ao buscar perfil:', error);
    return response.serverError(res, error, 'Erro interno do servidor.');
  }
};

// PUT /api/user/profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return response.unauthorized(res, 'Token inválido ou expirado');
    }

    const { username, email } = req.body;
    
    // Validação básica
    if (!username && !email) {
      return response.validationError(res, 'Pelo menos um campo deve ser fornecido (username ou email)');
    }

    // Preparar dados para atualização
    const updateData = {};
    if (username) {
      // Validar username (mínimo 3 caracteres, máximo 100)
      if (username.length < 3 || username.length > 100) {
        return response.validationError(res, 'Username deve ter entre 3 e 100 caracteres');
      }
      updateData.username = username;
    }
    
    if (email) {
      // Validar formato de email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return response.validationError(res, 'Email inválido');
      }
      updateData.email = email;
      updateData.email_verificado = false; // Resetar verificação se email mudar
    }

    updateData.updated_at = new Date().toISOString();

    // Atualizar no Supabase
    const { data: usuarioAtualizado, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, username, saldo, tipo, ativo, email_verificado, updated_at')
      .single();

    if (error) {
      console.error('❌ [USER-CONTROLLER] Erro ao atualizar perfil:', error);
      
      // Verificar se é erro de email duplicado
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        return response.conflict(res, 'Email já está em uso por outro usuário');
      }
      
      return response.serverError(res, error, 'Erro ao atualizar perfil');
    }

    if (!usuarioAtualizado) {
        return response.unauthorized(res, 'Usuário não encontrado ou token inválido');
    }

    return response.success(
      res,
      {
        id: usuarioAtualizado.id,
        email: usuarioAtualizado.email,
        username: usuarioAtualizado.username,
        saldo: parseFloat(usuarioAtualizado.saldo || 0),
        tipo: usuarioAtualizado.tipo || 'jogador',
        ativo: usuarioAtualizado.ativo,
        email_verificado: usuarioAtualizado.email_verificado || false,
        updated_at: usuarioAtualizado.updated_at
      },
      'Perfil atualizado com sucesso!'
    );
  } catch (error) {
    console.error('❌ [USER-CONTROLLER] Erro ao atualizar perfil:', error);
    return response.serverError(res, error, 'Erro interno do servidor.');
  }
};

// GET /api/user/list
const getUsersList = async (req, res) => {
  try {
    // Verificar se é admin (opcional - pode ser removido se não necessário)
    const isAdmin = req.user?.role === 'admin' || req.user?.tipo === 'admin';
    
    // Paginação
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Máximo 100
    const offset = (page - 1) * limit;

    // Filtros opcionais
    const ativo = req.query.ativo;
    const tipo = req.query.tipo;
    const search = req.query.search; // Busca por email ou username

    // Construir query
    let query = supabaseAdmin
      .from('usuarios')
      .select('id, email, username, saldo, tipo, ativo, email_verificado, total_apostas, total_ganhos, created_at', { count: 'exact' });

    // Aplicar filtros
    if (ativo !== undefined) {
      query = query.eq('ativo', ativo === 'true');
    }
    
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    
    if (search) {
      query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%`);
    }

    // Ordenar por created_at (mais recentes primeiro)
    query = query.order('created_at', { ascending: false });

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1);

    const { data: usuarios, error, count } = await query;

    if (error) {
      console.error('❌ [USER-CONTROLLER] Erro ao listar usuários:', error);
      return response.serverError(res, error, 'Erro ao listar usuários');
    }

    return response.success(
      res,
      {
        usuarios: usuarios || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      },
      'Lista de usuários obtida com sucesso!'
    );
  } catch (error) {
    console.error('❌ [USER-CONTROLLER] Erro ao listar usuários:', error);
    return response.serverError(res, error, 'Erro interno do servidor.');
  }
};

// GET /api/user/stats
const getUserStats = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return response.unauthorized(res, 'Token inválido ou expirado');
    }

      // ✅ GO-LIVE FIX FASE 2: Usar supabaseAdmin para bypass de RLS
      const { data: usuario, error: userError } = await supabaseAdmin
        .from('usuarios')
        .select('saldo, total_apostas, total_ganhos')
        .eq('id', userId)
        .single();

      if (userError || !usuario) {
        console.error('❌ [USER-CONTROLLER] Erro ao buscar usuário:', userError);
        // ✅ GO-LIVE FIX FASE 2: Retornar 401 em vez de 404 se token válido mas usuário não existe
        return response.unauthorized(res, 'Usuário não encontrado ou token inválido');
      }

    // Buscar estatísticas globais (usando admin para acesso completo)
    const { data: usuarios, error: statsError } = await supabaseAdmin
      .from('usuarios')
      .select('id, saldo, ativo');

    if (statsError) {
      console.error('❌ [USER-CONTROLLER] Erro ao buscar estatísticas:', statsError);
      // Continuar mesmo com erro nas estatísticas globais
    }

    const usuariosAtivos = usuarios?.filter(u => u.ativo === true).length || 0;
    const totalUsuarios = usuarios?.length || 0;
    const saldoTotal = usuarios?.reduce((sum, u) => sum + parseFloat(u.saldo || 0), 0) || 0;

    return response.success(
      res,
      {
        totalUsuarios,
        usuariosAtivos,
        saldoTotal: parseFloat(saldoTotal),
        meuSaldo: parseFloat(usuario.saldo || 0),
        minhasApostas: usuario.total_apostas || 0,
        meusGanhos: parseFloat(usuario.total_ganhos || 0)
      },
      'Estatísticas obtidas com sucesso!'
    );
  } catch (error) {
    console.error('❌ [USER-CONTROLLER] Erro ao buscar estatísticas:', error);
    return response.serverError(res, error, 'Erro interno do servidor.');
  }
};

// PUT /api/user/status/:id
const toggleUserStatus = async (req, res) => {
  try {
    // Verificar se é admin
    const isAdmin = req.user?.role === 'admin' || req.user?.tipo === 'admin';
    
    if (!isAdmin) {
      return response.forbidden(res, 'Acesso negado. Apenas administradores podem alterar status de usuários.');
    }

    const { id } = req.params;
    
    if (!id) {
      return response.validationError(res, 'ID do usuário é obrigatório');
    }

    // Buscar usuário atual
    const { data: usuario, error: fetchError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, username, ativo')
      .eq('id', id)
      .single();

    if (fetchError || !usuario) {
        return response.unauthorized(res, 'Usuário não encontrado ou token inválido');
    }

    // Não permitir desativar a si mesmo
    const currentUserId = req.user?.userId || req.user?.id;
    if (id === currentUserId) {
      return response.forbidden(res, 'Você não pode desativar sua própria conta');
    }

    // Alternar status
    const novoStatus = !usuario.ativo;

    // Atualizar no Supabase
    const { data: usuarioAtualizado, error } = await supabaseAdmin
      .from('usuarios')
      .update({
        ativo: novoStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, email, username, ativo, updated_at')
      .single();

    if (error) {
      console.error('❌ [USER-CONTROLLER] Erro ao alterar status:', error);
      return response.serverError(res, error, 'Erro ao alterar status do usuário');
    }

    return response.success(
      res,
      {
        id: usuarioAtualizado.id,
        email: usuarioAtualizado.email,
        username: usuarioAtualizado.username,
        ativo: usuarioAtualizado.ativo,
        updated_at: usuarioAtualizado.updated_at
      },
      `Status do usuário alterado para ${novoStatus ? 'ativo' : 'inativo'}`
    );
  } catch (error) {
    console.error('❌ [USER-CONTROLLER] Erro ao alterar status:', error);
    return response.serverError(res, error, 'Erro interno do servidor.');
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUsersList,
  getUserStats,
  toggleUserStatus
};
