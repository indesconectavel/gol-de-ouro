
// Middleware de limpeza de memória
const memoryCleanup = (req, res, next) => {
  // Limpar dados desnecessários da requisição
  if (req.body && req.body.length > 10000) {
    req.body = req.body.substring(0, 10000) + '...';
  }
  
  // Limpar headers desnecessários
  delete req.headers['x-forwarded-for'];
  delete req.headers['x-real-ip'];
  
  next();
};

module.exports = memoryCleanup;
