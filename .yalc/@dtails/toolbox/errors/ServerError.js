'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ServerError = ServerError;

var _boom = require('@hapi/boom');

var _boom2 = _interopRequireDefault(_boom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ServerError(message) {
  var error = new Error('Internal Server Error');
  return _boom2.default.boomify(error, { statusCode: 500, message });
}