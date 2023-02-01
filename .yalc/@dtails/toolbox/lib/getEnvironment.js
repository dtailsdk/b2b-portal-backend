'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getEnvironment = getEnvironment;

var _index = require('./index');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getEnvironment(key, fallback, config = {}) {
  if (!key) {
    return process.env;
  }

  const { allowEmpty = false, isRequired = true } = config;

  const value = _index.R.propOr(fallback, key, process.env);

  if (_index.R.isNil(value) && !(allowEmpty && _index.R.isEmpty(value)) && isRequired) {
    console.log();
    console.log(_chalk2.default.bold.red(`  Server can not start without '${key}' set in environment`));
    console.log();
    process.exit(1);
  }

  return value;
}
//import { R } from '@mekanisme/common'