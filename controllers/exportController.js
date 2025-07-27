const pool = require('../db');
const { Parser } = require('json2csv');

// Exportar usuários em CSV
exports.exportarUsuariosCSV = async (req, res) => {
  try {
    const { rows: usuarios } = await pool.query('SELECT id, nome, email, saldo, data_criacao FROM usuarios');
    if (usuarios.length === 0) return res.status(404).json({ message: 'Nenhum usuário encontrado para exportar.' });

    const campos = ['id', 'nome', 'email', 'saldo', 'data_criacao'];
    const parser = new Parser({ fields: campos });
    const csv = parser.parse(usuarios);

    res.header('Content-Type', 'text/csv');
    res.attachment('usuarios.csv');
    res.send(csv);
  } catch (error) {
    console.error('Erro ao exportar CSV de usuários:', error);
    res.status(500).json({ error: 'Erro interno ao exportar usuários.' });
  }
};

// Exportar chutes em CSV
exports.exportarChutesCSV = async (req, res) => {
  try {
    const { rows: chutes } = await pool.query('SELECT id, id_usuario, id_partida, acertou, data_chute FROM tentativas_chute');
    if (chutes.length === 0) return res.status(404).json({ message: 'Nenhum chute encontrado para exportar.' });

    const campos = ['id', 'id_usuario', 'id_partida', 'acertou', 'data_chute'];
    const parser = new Parser({ fields: campos });
    const csv = parser.parse(chutes);

    res.header('Content-Type', 'text/csv');
    res.attachment('chutes.csv');
    res.send(csv);
  } catch (error) {
    console.error('Erro ao exportar CSV de chutes:', error);
    res.status(500).json({ error: 'Erro interno ao exportar chutes.' });
  }
};

// Exportar transações em CSV
exports.exportarTransacoesCSV = async (req, res) => {
  try {
    const { rows: transacoes } = await pool.query('SELECT id, id_usuario, tipo, valor, data_transacao FROM transacoes');
    if (transacoes.length === 0) return res.status(404).json({ message: 'Nenhuma transação encontrada para exportar.' });

    const campos = ['id', 'id_usuario', 'tipo', 'valor', 'data_transacao'];
    const parser = new Parser({ fields: campos });
    const csv = parser.parse(transacoes);

    res.header('Content-Type', 'text/csv');
    res.attachment('transacoes.csv');
    res.send(csv);
  } catch (error) {
    console.error('Erro ao exportar CSV de transações:', error);
    res.status(500).json({ error: 'Erro interno ao exportar transações.' });
  }
};

// Exportar saques em CSV
exports.exportarSaquesCSV = async (req, res) => {
  try {
    const { rows: saques } = await pool.query('SELECT id, user_id, amount, status, request_date FROM withdrawals');
    if (saques.length === 0) return res.status(404).json({ message: 'Nenhum saque encontrado para exportar.' });

    const campos = ['id', 'user_id', 'amount', 'status', 'request_date'];
    const parser = new Parser({ fields: campos });
    const csv = parser.parse(saques);

    res.header('Content-Type', 'text/csv');
    res.attachment('saques.csv');
    res.send(csv);
  } catch (error) {
    console.error('Erro ao exportar CSV de saques:', error);
    res.status(500).json({ error: 'Erro interno ao exportar saques.' });
  }
};

// Exportar relatório completo do sistema
exports.exportarRelatorioCompletoCSV = async (req, res) => {
  try {
    const usuarios = await pool.query('SELECT id, nome, email, saldo, data_criacao FROM usuarios');
    const transacoes = await pool.query('SELECT id, id_usuario, tipo, valor, data_transacao FROM transacoes');
    const chutes = await pool.query('SELECT id, id_usuario, id_partida, acertou, data_chute FROM tentativas_chute');
    const saques = await pool.query('SELECT id, user_id, amount, status, request_date FROM withdrawals');

    const total = usuarios.rows.length + transacoes.rows.length + chutes.rows.length + saques.rows.length;
    res.status(200).json({ total_linhas: total, mensagem: 'Relatório completo pronto para exportar.' });
  } catch (error) {
    console.error('Erro ao gerar relatório completo:', error);
    res.status(500).json({ error: 'Erro interno ao gerar relatório completo.' });
  }
};

// Status do backup
exports.statusBackup = async (req, res) => {
  try {
    const agora = new Date();
    res.status(200).json({
      status: 'Backup lógico manual disponível via endpoints CSV',
      gerado_em: agora.toISOString(),
      instrucoes: 'Acesse todos os endpoints de exportação para gerar os dados e armazenar localmente.'
    });
  } catch (error) {
    console.error('Erro ao verificar status do backup:', error);
    res.status(500).json({ error: 'Erro ao verificar status do backup.' });
  }
};
