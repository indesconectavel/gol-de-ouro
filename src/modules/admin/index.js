// Módulo admin - Gol de Ouro V19
// Exportações do módulo admin

// Controllers
const controllers = require('./controllers');

// Routes
const routes = require('./routes');

// Services


module.exports = {
  ...controllers,
  routes,

};
