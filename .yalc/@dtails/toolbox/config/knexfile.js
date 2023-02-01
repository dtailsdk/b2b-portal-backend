'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _path = require('path');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

var _ramda = require('ramda');

var _pgConnectionString = require('pg-connection-string');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const { knexSnakeCaseMappers } = require('objection');

if (process.env.NODE_ENV !== 'production') {
  _dotenv2.default.config({ silent: true });
}
if (!(0, _ramda.has)('DATABASE_URL', process.env)) {
  console.log();
  console.log(_chalk2.default.bold.red('  Server can not start without a DATABASE_URL'));
  console.log();
  process.exit(1);
}
let dbUrl = null;
let connectionObject = null;
if (process.env.NODE_ENV !== 'production') {
  dbUrl = process.env.DATABASE_URL;
  _dotenv2.default.config({ silent: true });
} else {
  dbUrl = process.env.DATABASE_URL.indexOf('?ssl=') == -1 && process.env.DATABASE_URL.indexOf('?sslmode=') == -1 ? process.env.DATABASE_URL + '?ssl=true' : process.env.DATABASE_URL; //Only append ssl=true is parameter is not already provided)  
}
connectionObject = (0, _pgConnectionString.parse)(dbUrl);
if (connectionObject.ssl == 'false') {
  connectionObject.ssl = false;
}
if (connectionObject.ssl) {
  connectionObject.ssl = { rejectUnauthorized: false };
}
console.log('mappers', knexSnakeCaseMappers());
exports.default = {
  development: _extends({
    client: 'pg',
    connection: connectionObject,
    pool: {
      min: 2,
      max: 10
    },
    ssl: {
      rejectUnauthorized: false
    },
    migrations: {
      tableName: 'migrations',
      directory: (0, _path.join)('src', 'data', 'migrations')
    },
    seeds: {
      directory: (0, _path.join)('src', 'data', 'seeds/dev')
    },
    debug: true
  }, knexSnakeCaseMappers()),
  production: _extends({
    client: 'pg',
    connection: connectionObject, //Only append ssl=true is parameter is not already provided
    pool: {
      min: 2,
      max: 10
    },
    ssl: {
      rejectUnauthorized: false
    },
    migrations: {
      tableName: 'migrations',
      directory: (0, _path.join)('src', 'data', 'migrations')
    },
    seeds: {
      directory: (0, _path.join)('src', 'data', 'seeds/prod')
    },
    debug: false
  }, knexSnakeCaseMappers())
};