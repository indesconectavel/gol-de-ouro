// Módulo game - Gol de Ouro V19
// Exportações do módulo game

// Controllers
const controllers = require('./controllers');

// Routes
const routes = require('./routes');

// Services
const services = require('./services');

module.exports = {
  ...controllers,
  routes,
  ...services,
};
