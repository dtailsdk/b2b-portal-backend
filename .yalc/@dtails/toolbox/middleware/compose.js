'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compose = compose;

var _composeMiddleware = require('compose-middleware');

var _expressUnless = require('express-unless');

var _expressUnless2 = _interopRequireDefault(_expressUnless);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function compose(...middleware) {
  const handler = (0, _composeMiddleware.compose)(...middleware);
  handler.unless = _expressUnless2.default;
  return handler;
}