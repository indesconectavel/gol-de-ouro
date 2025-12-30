// middlewares/requestId.js - Request ID Middleware
const { v4: uuidv4 } = require('uuid');

module.exports = function requestId() {
  return (req, _res, next) => {
    req.id = req.headers['x-request-id'] || uuidv4();
    next();
  };
};
