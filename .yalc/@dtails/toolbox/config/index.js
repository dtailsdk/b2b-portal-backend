'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _knexfile = require('./knexfile');

Object.defineProperty(exports, 'knexfile', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_knexfile).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }