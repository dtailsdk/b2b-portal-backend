'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.serverError = serverError;

var _errors = require('../errors');

function serverError(error, req, res, next) {
  // if headers have been sent, delegate to express handler
  if (res.headersSent) {
    return next(error);
  }

  if (!error.isBoom) {
    // allways log the stack before we transform the
    // error to a ServerError. This allows us to inspect
    // unexpected errors
    // TODO this should be sent as a crash report
    console.error('#### CAUGHT ERROR --- STACK TRACE:');
    console.error(error.stack);

    error = (0, _errors.ServerError)('Caught unhandled error');
  }

  return res.status(error.output.statusCode).json(error.data || error.output.payload);
}