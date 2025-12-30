// Módulo monitor - Gol de Ouro V19
// Exportações do módulo monitor

// Controllers
const controllers = require('./controllers');

// Routes
const routes = require('./routes');

// Services


module.exports = {
  ...controllers,
  routes,

};
