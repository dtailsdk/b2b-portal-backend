'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withPermissions = withPermissions;

var _expressJwt = require('express-jwt');

var _expressJwt2 = _interopRequireDefault(_expressJwt);

var _expressUnless = require('express-unless');

var _expressUnless2 = _interopRequireDefault(_expressUnless);

var _expressJwtPermissions = require('express-jwt-permissions');

var _expressJwtPermissions2 = _interopRequireDefault(_expressJwtPermissions);

var _composeMiddleware = require('compose-middleware');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const guard = (0, _expressJwtPermissions2.default)({
  permissionsProperty: 'role'
});

function withPermissions(permissions) {
  const check = guard.check(permissions);

  const permissionMiddleware = (err, req, res, next) => {
    console.log(err.code);
    console.log(err.name);
    if (err.name === 'UnauthorizedError') {
      res.sendStatus(401);
    } else {
      next();
    }
  };

  const middleware = (0, _composeMiddleware.compose)([check, permissionMiddleware]);
  middleware.unless = _expressUnless2.default;

  return middleware;
}