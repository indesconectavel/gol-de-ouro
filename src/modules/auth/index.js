// Módulo auth - Gol de Ouro V19
// Exportações do módulo auth

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
