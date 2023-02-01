'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.methodNotAllowed = methodNotAllowed;

var _boom = require('@hapi/boom');

var _boom2 = _interopRequireDefault(_boom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function methodNotAllowed(req, res, next) {
  return next(_boom2.default.methodNotAllowed());
}