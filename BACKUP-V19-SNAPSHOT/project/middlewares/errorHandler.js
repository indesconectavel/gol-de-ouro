// middlewares/errorHandler.js - Error Handler Middleware
module.exports = function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const payload = {
    requestId: req.id,
    error: status >= 500 ? 'internal_error' : (err.code || 'bad_request'),
    message: process.env.NODE_ENV === 'production' && status >= 500 ? undefined : err.message,
  };
  if (status >= 500) {
    console.error('[ERR]', req.id, err.stack || err);
  }
  res.status(status).json(payload);
};
