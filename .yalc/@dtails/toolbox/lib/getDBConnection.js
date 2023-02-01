'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDBConnection = getDBConnection;

var _knex = require('knex');

var _knex2 = _interopRequireDefault(_knex);

var _pg = require('pg');

var _index = require('./index');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }
//import { R } from '@mekanisme/common'


function getDBConnection(config = {}) {
  const { parser = {} } = config,
        knexconfig = _objectWithoutProperties(config, ['parser']);

  // initialise pg type parser with sane defaults
  const { numeric = true, date = false } = parser;

  if (numeric) {
    // implement parser for numeric types
    // see: https://github.com/brianc/node-pg-types/issues/28
    _pg.types.setTypeParser(1700, 'text', parseFloat);
  }

  if (!date) {
    // remove parser for date types
    // see: https://github.com/tgriesser/knex/issues/1085
    const dateTypes = [1082, // date
    1182, // _date ?
    1114, // timestamp without time zone
    1115, // timestamp without time zone[]
    1184, // timestamp with time zone
    1185, // timestamp with time zone[]
    1186];
    _index.R.forEach(type => _pg.types.setTypeParser(type, _index.R.identity), dateTypes);
  }

  // connect to db
  const knexfile = require('../config/knexfile').default;
  console.log('knexfile in toolbox', knexfile);
  config = _index.R.mergeDeepLeft(knexconfig, knexfile[process.env.NODE_ENV || 'development']);

  return (0, _knex2.default)(config);
}