'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requiresAuth = requiresAuth;

var _lib = require('../lib');

var _expressJwt = require('express-jwt');

var _expressJwt2 = _interopRequireDefault(_expressJwt);

var _expressUnless = require('express-unless');

var _expressUnless2 = _interopRequireDefault(_expressUnless);

var _composeMiddleware = require('compose-middleware');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function requiresAuth(options) {
  const secret = (0, _lib.getEnvironment)('SECRET');
  const credentialsRequired = _lib.R.propOr(true, 'credentialsRequired', options);

  const jwtMiddleware = (0, _expressJwt2.default)({
    secret,
    credentialsRequired
  });

  const authMiddleware = (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
      res.sendStatus(401);
    } else {
      next();
    }
  };

  const middleware = (0, _composeMiddleware.compose)([jwtMiddleware, authMiddleware]);
  middleware.unless = _expressUnless2.default;

  return middleware;
}
//import { R } from '@mekanisme/common'