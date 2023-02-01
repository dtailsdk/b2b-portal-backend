'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _dotenv = require('dotenv');

var _dotenv2 = _interopRequireDefault(_dotenv);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _corsGate = require('cors-gate');

var _corsGate2 = _interopRequireDefault(_corsGate);

var _objection = require('objection');

var _objection2 = _interopRequireDefault(_objection);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _expressSession = require('express-session');

var _expressSession2 = _interopRequireDefault(_expressSession);

var _regexParser = require('regex-parser');

var _regexParser2 = _interopRequireDefault(_regexParser);

var _expressPromiseRouter = require('express-promise-router');

var _expressPromiseRouter2 = _interopRequireDefault(_expressPromiseRouter);

var _connectSessionKnex = require('connect-session-knex');

var _connectSessionKnex2 = _interopRequireDefault(_connectSessionKnex);

var _winstonRequestLogger = require('winston-request-logger');

var _winstonRequestLogger2 = _interopRequireDefault(_winstonRequestLogger);

var _lib = require('../lib');

var _middleware = require('../middleware');

var middleware = _interopRequireWildcard(_middleware);

var _errors = require('../errors');

var errors = _interopRequireWildcard(_errors);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_winston2.default.configure({
  transports: [new _winston2.default.transports.Console({ colorize: true })]
});

/**
 * @class Server
 * @description
 * Singleton class for interacting with the server
 * See {@link ?content=readme|Getting Started} for a full-fledged example
 *
 * @example
 * import { Server } from '@mekanisme/server'
 * Server.init()
 * Server.listen()
 * Server.use((req, res) => res.send('Hello World'))
 * Server.useNotFound()
 * Server.useErrorHandler()
 *
 */

//import {  } from 'lib'
//import { R } from '@mekanisme/common'
class Server {
  /**
   * Get middleware module
   * @static
   * @readonly
   * @memberof Server
   */
  static get middleware() {
    return middleware;
  }

  /**
   * Get errors module
   * @static
   * @readonly
   * @memberof Server
   */
  static get errors() {
    return errors;
  }

  /**
   * Get express module
   * @static
   * @readonly
   * @memberof Server
   */
  static get express() {
    return _express2.default;
  }

  /**
   * Get cors module
   * @static
   * @readonly
   * @memberof Server
   */
  static get cors() {
    return _cors2.default;
  }

  /**
   * Get default Router
   * This is a promise based router, allowing for a route handler to return a
   * promise, and automatically calling `next` with error on rejected promises
   * {@link https://github.com/express-promise-router/express-promise-router|express-promise-router}
   * @static
   * @readonly
   * @memberof Server
   */
  static get Router() {
    return _expressPromiseRouter2.default;
  }

  /**
   * @static
   * @description
   * Initialize the server. Accepts an optional configuration object
   * withCors = true/false. If set to true CORS is checked against process.env.CORS_WHITELIST. If false no CORS checking is done
   * bodyParser can be passed an object where parseRawBody is true and rawBodyUrls is a list of urls for which the raw body is parsed and injected in req.rawBody
   * type is the Content-Type, defaults to application/json
   *
   * `init` is responsible for spinning up an express instance, and configuring
   * it with common features, such as:
   *
   * - load `.env` file
   * - determine if HOST env variable is set
   * - add request logger
   * - setup bodyparser
   * - initialize CORS, reading a whitelist from `process.env.CORS_WHITELIST`. Whitelist can contain string or regex to check against
   *
   * At this moment it does not return anything meaningful. After this singleton
   * has been initialized, any module that imports Server will get the same
   * singleton back, allowing the server to be configured and set up.
   *
   * @param {object} [config={}] object for configuring the server
   * @memberof Server
   */
  static init(config = {}) {
    console.log('bla bla bla');
    const {
      credentials = false,
      withCors = true,
      corsBlacklist = [],
      bodyParser = {
        limit: '100kb',
        type: ['application/json'],
        parseRawBody: false,
        rawBodyUrls: []
      }
    } = config;

    const app = (0, _express2.default)();

    _dotenv2.default.config({ silent: true });

    // initialize server constants
    // fail if we don't have a HOST set
    this.host = (0, _lib.getEnvironment)('HOST');
    this.port = (0, _lib.getEnvironment)('PORT', 3000);
    app.set('host', this.host);
    app.set('port', this.port);

    // deprecation warning
    if (process.env.API_ORIGIN) {
      console.log(_chalk2.default.bold.yellow('Deprecation Warning'), 'API_ORIGIN is deprecated. Use HOST and optionally PORT instead');
    }

    // add default request logger
    app.use(_winstonRequestLogger2.default.create(_winston2.default));

    if (bodyParser.parseRawBody && !bodyParser.rawBodyUrls) {
      console.log('Server is setup to parse the raw body but no urls is setup. Check the bodyParser configuration: "rawBodyUrls"');
    }

    // setup bodyparser
    app.use(_bodyParser2.default.json({
      limit: bodyParser.limit,
      type: bodyParser.type,
      verify: function (req, res, buf, encoding) {
        const pattern = new RegExp('\\?.*');
        const requestedBasePath = req.url.replace(pattern, '');
        if (!bodyParser.parseRawBody || !bodyParser.rawBodyUrls || _lib.R.indexOf(requestedBasePath, bodyParser.rawBodyUrls) == -1) {
          console.log('Url not matched or rawBody parser not setup for URL ' + requestedBasePath);
          return;
        }
        req.rawBody = buf.toString();
      }
    }));
    app.use(_bodyParser2.default.urlencoded({
      extended: false
    }));

    // setup CORS
    if (withCors) {
      const apiOrigin = (0, _lib.getServerURL)();
      app.use(_corsGate2.default.originFallbackToReferrer());
      const corsWhitelist = _lib.R.map(c => {
        if (c[0] !== '/') {
          //it's not a regex. Test against /
          return _lib.R.trim(c);
        } else {
          return (0, _regexParser2.default)(c);
        }
      }, _lib.R.split(',', (0, _lib.getEnvironment)('CORS_WHITELIST')));

      const originCheck = (0, _cors2.default)({
        origin: (origin, cb) => {
          if (_lib.R.contains(origin, corsWhitelist) || _lib.R.find(c => c instanceof RegExp && _lib.R.test(c, origin), corsWhitelist)) {
            cb(null, true);
          } else {
            console.log(_chalk2.default.bold.red(` ${origin} not in CORS whitelist`));
            if (!origin) {
              console.log(_chalk2.default.bold.red(` Origin is undefined or null, check for missing Origin header`));
            }
            cb(null, false);
          }
        },
        credentials
      });
      const corsGateCheck = (0, _corsGate2.default)({
        strict: true,
        allowSafe: true,
        origin: apiOrigin
      });

      const corsCheck = middleware.compose(originCheck, corsGateCheck);
      app.use(corsCheck.unless({
        path: corsBlacklist
      }));
    }

    this.config = config;
    this.app = app;
  }

  /**
   * @static
   * @description
   * Initialize a base model with a database connection. This will use a default
   * knexfile that defines a postgres `development` and `production` environment
   * with seeds and migrations, and obeys a `process.env.DATABASE_URL` variable.
   *
   * @param {any} model
   * Base model to bind to database connection. Must extend
   * {@link ?api=all#Model|Model}
   * @param {any} [config={}]
   * optional configuration to merge with default knexfile and set postgres
   * parser options, `numeric` and `date`
   * @memberof Server
   */
  static initModel(model, config = {}) {
    const db = (0, _lib.getDBConnection)(config);
    this.db = db;
    model.knex(db);
  }

  /**
   * @static
   * @description
   * Initialize a session handler. It can be configured to either use a memory
   * store (for development purposes), use knex (default if database is setup)
   * or any of a variety of session stores here:
   * {@link https://github.com/expressjs/session#compatible-session-stores}.
   * Uses ${@link https://github.com/expressjs/session|express-session} and
   * ${@link https://github.com/llambda/connect-session-knex|connect-session-knex}
   * under the hood.
   *
   * @param {String} secret
   * Secret to use for signing session ID cookie
   * @param {any} _store
   * Optional store to use for session. If not specified will default to either
   * MemoryStore or current database, depending on if database is initialized.
   * @memberof Server
   */
  static initSession(secret, _store, options = {}) {
    if (!this.app) {
      console.log(_chalk2.default.bold.red('   Initialize App before setting up sessions'));
      return;
    }
    let store = _store;
    const { cookie = {}, resave = false, saveUninitialized = false } = options;
    if (_lib.R.isNil(store) && this.db) {
      store = new ((0, _connectSessionKnex2.default)(_expressSession2.default))({
        knex: this.db
      });
    }
    this.app.use((0, _expressSession2.default)({
      secret,
      store,
      cookie,
      resave,
      saveUninitialized
    }));
  }

  static transaction(handler) {
    if (!this.db) {
      console.log('Initialize DB before using transactions');
      return;
    }
    return _objection2.default.transaction(this.db, handler);
  }

  /**
   * Delegates `use` to the underlying express instance
   * @static
   * @param {any} args
   * same arguments as express
   * {@link https:/https://expressjs.com/en/4x/api.html#app.use|use()} accepts
   * @memberof Server
   */
  static use(...args) {
    this.app.use(...args);
  }

  /**
   * Delegates `get` to the underlying express instance
   * @static
   * @param {any} args
   * same arguments as express
   * {@link https:/https://expressjs.com/en/4x/api.html#app.get|get()} accepts
   * @memberof Server
   */
  static get(...args) {
    this.app.get(...args);
  }

  /**
   * Delegates `put` to the underlying express instance
   * @static
   * @param {any} args
   * same arguments as express
   * {@link https:/https://expressjs.com/en/4x/api.html#app.put|put()} accepts
   * @memberof Server
   */
  static put(...args) {
    this.app.put(...args);
  }

  /**
   * Delegates `post` to the underlying express instance
   * @static
   * @param {any} args
   * same arguments as express
   * {@link https:/https://expressjs.com/en/4x/api.html#app.post|post()} accepts
   * @memberof Server
   */
  static post(...args) {
    this.app.post(...args);
  }

  /**
   * Delegates `delete` to the underlying express instance
   * @static
   * @param {any} args
   * same arguments as express
   * {@link https:/https://expressjs.com/en/4x/api.html#app.delete|delete()} accepts
   * @memberof Server
   */
  static delete(...args) {
    this.app.delete(...args);
  }

  /**
   * Mounts a NotFound 404 middleware. Must be used after all other routes,
   * but before error middleware.
   * @static
   * @memberof Server
   */
  static useNotFound() {
    this.app.use(middleware.notFound);
  }

  /**
   * Mounts an error middleware. Must be used as the last route in an application.
   * Understands `Boom` errors.
   * @static
   * @memberof Server
   */
  static useErrorHandler() {
    this.app.use(middleware.serverError);
  }

  /**
   * @static
   * @description
   * Start a regular node `http` server running the express app. Attach event
   * listeners and attempt to listen to requested port / host combination. If
   * requested port is in use, request a new port.
   * @returns {server}
   * @memberof Server
   */
  static listen() {
    const server = _http2.default.createServer(this.app);

    server.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        _winston2.default.warn(_chalk2.default.bold.yellow(`could not open requested port ${this.port}`));

        server.close();
        server.listen(undefined, this.host);
      } else {
        _winston2.default.error(_chalk2.default.bold.red('could not start express server'));
        _winston2.default.error(err);
        server.close();
      }
    });

    server.on('listening', _ => {
      const { address, port, family } = server.address();
      _winston2.default.info(_chalk2.default.bold.green('Success:'), 'Server running on', _chalk2.default.bold(`http://${family === 'IPv6' ? `[${address}]` : address}:${port}`), '\n');
    });

    server.listen(this.port, this.host);
    return server;
  }
}

exports.default = Server;