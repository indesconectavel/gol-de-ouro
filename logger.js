// logger.js - Logger com Morgan
const morgan = require('morgan');

// Inclui requestId no log
morgan.token('rid', (req) => req.id || '-');

module.exports = morgan(':method :url :status :res[content-length] - :response-time ms rid=:rid');
