// Controller de usuários - Gol de Ouro
const express = require('express');

// Mock de dados temporário para correção rápida
const usuariosMock = [
  {
    id: 1,
    email: 'test@goldeouro.lol',
    nome: 'Usuário Teste',
    saldo: 100.00,
    status: 'ativo'
  },
  {
    id: 2,
    email: 'admin@goldeouro.lol',
    nome: 'Administrador',
    saldo: 1000.00,
    status: 'ativo'
  }
];

// GET /api/user/profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id || 1; // Fallback para teste
    const usuario = usuariosMock.find(u => u.id === userId);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        saldo: usuario.saldo,
        status: usuario.status
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// PUT /api/user/profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const { nome, email } = req.body;
    
    const usuario = usuariosMock.find(u => u.id === userId);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Atualizar dados
    if (nome) usuario.nome = nome;
    if (email) usuario.email = email;

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: usuario
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// GET /api/user/list
const getUsersList = async (req, res) => {
  try {
    res.json({
      success: true,
      data: usuariosMock.map(u => ({
        id: u.id,
        email: u.email,
        nome: u.nome,
        status: u.status
      }))
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// GET /api/user/stats
const getUserStats = async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const usuario = usuariosMock.find(u => u.id === userId);
    
    res.json({
      success: true,
      data: {
        totalUsuarios: usuariosMock.length,
        usuariosAtivos: usuariosMock.filter(u => u.status === 'ativo').length,
        saldoTotal: usuariosMock.reduce((sum, u) => sum + u.saldo, 0),
        meuSaldo: usuario?.saldo || 0
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// PUT /api/user/status/:id
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = usuariosMock.find(u => u.id === parseInt(id));
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    usuario.status = usuario.status === 'ativo' ? 'inativo' : 'ativo';

    res.json({
      success: true,
      message: `Usuário ${usuario.status}`,
      data: usuario
    });
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUsersList,
  getUserStats,
  toggleUserStatus
};