'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ShopifyOAuth = undefined;

var _lib = require('../lib');

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _crypto = require('crypto');

var _middleware = require('../middleware');

var _queryString = require('query-string');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
//import { A, R } from '@mekanisme/common'


const jwt = require('jsonwebtoken');

/**
 * @class ShopifyOAuth
 * @classdesc
 * Information about Shopify OAuth:
 * - ${@link https://help.shopify.com/api/getting-started/authentication/oauth}
 * - ${@link http://gavinballard.com/shopify-oauth-flow-for-dummies/}
 * Sample implementations:
 * - ${@link https://github.com/Shopify/shopify-node-app}
 * - ${@link https://github.com/Shopify/shopify-express}
 * - ${@link https://github.com/christophergregory/shopify-node-api}
 * - ${@link https://github.com/jonpulice/node-shopify-auth}
 * - ${@link https://github.com/lpinca/shopify-token}
 *
 * General information
 * - ${@link https://help.shopify.com/api/listing-in-the-app-store/testing-your-app-before-submitting}
 * - ${@link https://help.shopify.com/api/listing-in-the-app-store/app-requirements-and-success-criteria/app-review-checklist}
 * - ${@link https://help.shopify.com/api/sdks/shopify-apps/embedded-app-sdk}
 */
class ShopifyOAuth {
  /**
   * @constructs ShopifyOAuth
   * @param {object} - config - Shopify oauth config
   * @param {string} - config.key - Shopify apps API key
   * @param {string} - config.secret -  Shopify apps API secret
   * @param {ShopifyToken} - config.tokenModel - Objection model that handles shopify tokens
   * @param {array} - [config.scope] - Array of app permissions. Defaults to read only permissions
   * @param {object} - [config.models] - Hash of Objection models to instantiate in app schema
   * @param {array} - [config.tenant_models] - Array of migration objects (with up and down functions) to run
   * in the schema of a newly created tenant
   * @param {object} - [config.multipleApps] - enables multiple apps to use the same frontend and backend, identifying the app in context with a query parameter. The data structure is an object with the app identifier as key, and the app configuration as value. The app configuration defines the Shopify app key and secret.
   * @param {function} - [config.get_shop_by_name] - Defines how to get token model enabling the configuration to filter on app as well if multipleApps configuration is set
   * @param {boolean} - [config.embedded] - Whether this app is an embedded app
   * @description
   * Create an instance of a Shopify oauth application. This instance will have
   * access to a certain set of permissions on Shopify, called scopes. See a list
   * of available scopes here:
   * ${@link https://help.shopify.com/api/getting-started/authentication/oauth/scopes}
   */
  constructor(config = {}) {
    // validate configuration
    const {
      key,
      secret,
      multipleApps = false,
      tokenModel,
      models,
      tenant_migrations = [],
      // default scope
      scope = ['read_content', 'read_products', 'read_customers', 'read_orders', 'read_checkouts'],
      embedded = false,
      create_additional_token_data = _lib.R.identity,
      get_shop_by_name = (() => {
        var _ref = _asyncToGenerator(function* (req, shopName) {
          return yield tokenModel.q.where({ shop: shopName }).first();
        });

        return function (_x, _x2) {
          return _ref.apply(this, arguments);
        };
      })(),
      knex_debug_mode = false,
      onShopInstalled = () => {}
    } = config;
    if (!multipleApps) {
      if (_lib.R.isNil(key)) {
        throw new Error('`key` not specified');
      }
      if (_lib.R.isNil(secret)) {
        throw new Error('`secret` not specified');
      }
    }
    if (_lib.R.isNil(tokenModel)) {
      throw new Error('`tokenModel` not specified');
    }
    if (_lib.R.type(scope) !== 'Array') {
      throw new Error('`scope` must be an array');
    }

    if (_lib.R.type(tenant_migrations) !== 'Array') {
      throw new Error('`tenant_migrations` must be an array');
    }

    if (_lib.R.type(create_additional_token_data) !== 'Function' && _lib.R.type(create_additional_token_data) !== 'AsyncFunction') {
      throw new Error('`create_additional_token_data` must be a Function or AsyncFunction');
    }

    if (_lib.R.type(create_additional_token_data) !== 'Function' && _lib.R.type(get_shop_by_name) !== 'AsyncFunction') {
      throw new Error('`get_shop_by_name` must be a Function or AsyncFunction');
    }

    this.key = key;
    this.secret = secret;
    this.multipleApps = multipleApps;
    this.scope = scope;
    this.tokenModel = tokenModel;
    this.models = models;
    this.tenant_migrations = tenant_migrations;
    this.embedded = !!embedded;
    this.get_shop_by_name = get_shop_by_name;
    this.knex_debug_mode = !!knex_debug_mode;
    this.create_additional_token_data = create_additional_token_data;
    this.onShopInstalled = onShopInstalled;
    this.nonces = new Map();
    this.access_tokens = new Map();

    // init model cache
    this.cache = {
      models: {},
      connections: {}
    };
  }

  mount(Server, config) {
    const {
      redirectRoute = '/',
      installRoute = '/shopify/auth/install',
      confirmRoute = '/shopify/auth/confirm',
      installHandler = this.installHandler.bind(this),
      confirmHandler = this.confirmHandler.bind(this)
    } = config;

    this.confirmRoute = confirmRoute;
    this.redirectRoute = redirectRoute;

    Server.get(installRoute, installHandler());
    Server.get(confirmRoute, confirmHandler());
  }

  installHandler() {
    return (req, res, next) => {
      this.verifyMultipleApps(req);
      const shopName = this.constructor.getShopFromQueryString(req).shop;
      console.log('Install step of OAuth flow triggered for shop', shopName);

      // Generate nonce and pass it along to shopify. Shopify will return it
      // in the oauth completion step. We store it in memory
      // so that we can verify it on completion.
      const nonce = (0, _crypto.randomBytes)(16).toString('hex');
      this.nonces.set(shopName, nonce);

      // Generate the return url
      let completeURL = (0, _lib.getServerURL)(this.confirmRoute);
      if (this.multipleApps) {
        completeURL += '?app=' + req.query.app;
      }
      const params = {
        scope: _lib.R.join(',', this.scope),
        client_id: this.getKey(req),
        state: nonce,
        redirect_uri: completeURL
      };

      const url = getShopURL(shopName, 'admin/oauth/authorize', params);
      if (this.embedded) {
        res.type('html').send(`
          <html>
            <head>
              <script type='text/javascript'>window.top.location.href = '${url}';</script>
            </head>
          </html>`);
      } else {
        return res.redirect(url);
      }
    };
  }

  confirmHandler() {
    var _this = this;

    // The merchant has confirmed that the she want to install the app with the given scopes,
    // which means Shopify has authenticated and called us back with a temporary
    // token. We will call them back to exchange it for a permanent token
    return (0, _middleware.compose)([
    // Verify nonce matches the one shopify sends us
    (req, res, next) => {
      this.verifyMultipleApps(req);
      const shopName = this.constructor.getShopFromQueryString(req).shop;
      console.log('Confirm step of OAuth flow triggered for shop', shopName);

      const nonce = this.nonces.get(shopName);
      this.nonces.delete(shopName);
      const state = _lib.R.path(['query', 'state'], req);
      if (!nonce || !state || nonce !== state) {
        console.error('Error: ShopifyOAuth.completeHandler: nonce does not match state');
        return res.sendStatus(401);
      }
      next();
    },

    // make sure we are actually being called by Shopify
    // (request without a HMAC is not allowed)
    this.authenticateShopify({ missing_ok: false }),

    // check if shop already exists with an access_token. 
    // If existing grab token and redirect
    (() => {
      var _ref2 = _asyncToGenerator(function* (req, res, next) {
        const shopName = _this.constructor.getShopFromQueryString(req).shop;
        console.log('Final redirect if app is already installed for shop', shopName);

        const dbShop = yield _this.get_shop_by_name(req, shopName);
        if (dbShop && dbShop.token) {
          // finally redirect to configured redirect route
          req.shopFromToken = dbShop;
          return res.redirect(_this.redirectRoute + '?shop=' + shopName);
        }
        next();
      });

      return function (_x3, _x4, _x5) {
        return _ref2.apply(this, arguments);
      };
    })(),

    // exchange temporary token for a permanent token. Store it in
    // map and call optional onSave and onComplete callbacks
    (() => {
      var _ref3 = _asyncToGenerator(function* (req, res, next) {
        const { code } = req.query;
        const shopName = _this.constructor.getShopFromQueryString(req).shop;
        console.log('Exchanging temporary token for permanent token for shop', shopName);
        try {
          const url = getShopURL(shopName, 'admin/oauth/access_token');
          // TODO: check for failed cases
          const response = yield _axios2.default.post(url, {
            client_id: _this.getKey(req),
            client_secret: _this.getSecret(req, _this.multipleApps),
            code
          });
          const access_token = _lib.R.path(['data', 'access_token'], response);
          _this.access_tokens.set(shopName, access_token);
          next();
        } catch (error) {
          console.error('Access token exchange failed');
          console.error(error);
          return res.sendStatus(401);
        }
      });

      return function (_x6, _x7, _x8) {
        return _ref3.apply(this, arguments);
      };
    })(),

    // save token to database
    (() => {
      var _ref4 = _asyncToGenerator(function* (req, res, next) {
        const shopName = _this.constructor.getShopFromQueryString(req).shop;
        console.log('Going to persist token to DB for shop', shopName);

        const token = yield _this.create_additional_token_data({
          shop: shopName,
          scope: _this.scope.join(','),
          token: _this.access_tokens.get(shopName)
        }, req.query.app);
        _this.access_tokens.delete(shopName);

        const dbToken = yield _this.tokenModel.q.insert(token);
        _this.onShopInstalled(dbToken, req.query.app);
        // create a database schema for this shop and create it's tables
        const connection = (0, _lib.getDBConnection)();
        // NOTE: it would be nice to use the knex query builder to construct
        // the raw SQL but we are getting errors using the following syntax
        // await connection.raw('create schema ?', [shop])
        yield connection.raw(`create schema if not exists "${shopName}"`);

        // run tenant migrations
        for (const tenantMigration of _this.tenant_migrations) {
          const schema = connection.schema.withSchema(shopName);
          yield tenantMigration.up(schema, shopName, connection);
        }

        // migrate all models
        // const migrations = await A.map(R.values(this.models), 1, model => {
        //   return connection.schema
        //     .withSchema(shop)
        //     .createTable(model.tableName, table => {
        //       model.migrations.v1.up(table)
        //     })
        // })

        // finally redirect to configured redirect route
        req.shopFromToken = dbToken;
        res.redirect(_this.redirectRoute + '?shop=' + shopName + '&app=' + req.query.app);
      });

      return function (_x9, _x10, _x11) {
        return _ref4.apply(this, arguments);
      };
    })()]);
  }

  /**
   * Express middleware for verifying that request originates from Shopify
   *
   * @param {object} - config - Middleware config
   * @param {boolean} - config.missing_ok
   * Whether the middleware should let the request pass without a valid hmac
   * @param {function} - config.missing_callback
   * If hmac is missing, we can optionally call this callback
   */
  authenticateShopify({ missing_ok = true, missing_callback }) {
    return (req, res, next) => {
      // Shopify HMAC shows up in one of two ways:
      // 1. a query param called 'hmac' (admin)
      // 2. a request header called 'x-shopify-hmac-sha256' (webhook)
      let hmac, valid;
      if (_lib.R.has('hmac', req.query)) {
        hmac = _lib.R.path(['query', 'hmac'], req);
        valid = verifyAdminHMAC(hmac, _lib.R.omit(['hmac'], req.query), this.getSecret(req, this.multipleApps));
      } else if (_lib.R.has('x-shopify-hmac-sha256', req.headers)) {
        hmac = _lib.R.path(['query', 'hmac'], req);
        valid = verifyWebhookHMAC(hmac, req.body, this.getSecret(req, this.multipleApps));
      }
      if (hmac) {
        if (valid) {
          // TODO: do we want to set this on req?
          req._hmac_verified = true;
          return next();
        }
        return res.sendStatus(401);
      }
      // Should we reject the call?
      if (!missing_ok) {
        if (missing_callback && _lib.R.isFunction(missing_callback)) {
          return missing_callback(req, res, next);
        }
        return res.sendStatus(401);
      }
      // No HMAC and it's fine
      return next();
    };
  }

  //TODO Review with Mickey: should I drop withAuthorizedShop and only have withShop that does the caching thing?
  withAuthorizedShop() {
    var _this2 = this;

    return (() => {
      var _ref5 = _asyncToGenerator(function* (req, res, next) {
        _this2.verifyMultipleApps(req);
        const authBearer = req.headers['authorization'];
        if (authBearer) {
          try {
            const jwtToken = authBearer.replace('Bearer ', '');
            const decoded = yield jwt.verify(jwtToken, _this2.getSecret(req, _this2.multipleApps));

            //Validate JWT parameters
            const now = new Date();
            const secondsSinceEpoch = Math.floor(now / 1000);

            if (decoded.exp < secondsSinceEpoch || decoded.nbf > secondsSinceEpoch || !decoded.iss.startsWith(decoded.dest) || decoded.aud !== _this2.getKey(req)) {
              console.log('JWT parameters and seconds since epoch', decoded, secondsSinceEpoch);
              return res.send({ error: 'Validation of JWT parameters failed' });
            }

            const decodedShop = decoded.dest;
            const trimmedShopName = decodedShop.replace('https://', '').replace('.myshopify.com', '');
            const shop = yield _this2.get_shop_by_name(req, trimmedShopName);
            if (!shop) {
              return res.send({ error: 'App is not installed in shop' });
            }
            req.shopFromToken = shop;
            next();
          } catch (error) {
            console.log(error);
            return res.status(404).send({ error: 'Cannot decode JWT' });
          }
        } else {
          console.log('Service called without authorization header');
          return res.status(404).send({ error: 'Unauthorized' });
        }
      });

      return function (_x12, _x13, _x14) {
        return _ref5.apply(this, arguments);
      };
    })();
  }

  /**
   * Express middleware for initializing a Shop on a request. It instantiates
   * an array of Shopify models and bind them to the shops schema
   * Param getShopFilter - a callback function which given the request returns
   * the knex where clause object by which to fetch the tokenmodel of the shop
   */
  //TODO Review with Mickey: should be updated, not sure whether name should come from token shop name or a query parameter though
  withShop(getShopFilter) {
    var _this3 = this;

    return (() => {
      var _ref6 = _asyncToGenerator(function* (req, res, next) {
        const sessionShopName = req.session && req.session.shopify && req.session.shopify.shop ? req.session.shopify.shop : null;

        const shopFilter = sessionShopName ? { shop: sessionShopName } : getShopFilter(req);
        if (!shopFilter) {
          return res.status(400).send("No shop filter found");
        }

        const shopData = yield _this3.tokenModel.q.findOne(shopFilter);
        if (!shopData) {
          return res.status(400).send("Shop not found");
        }
        const shopName = shopData.shop;

        // get cached models or create a new db connection with correct searchPath
        // and bind all models to that db instance, then cache them
        let cachedModels = _this3.cache.models[shopName];
        let connection = _this3.cache.connections[shopName];

        if (!cachedModels) {
          connection = (0, _lib.getDBConnection)({ debug: _this3.knex_debug_mode, searchPath: [`"${shopName}"`, 'public'] });
          cachedModels = _lib.R.map(function (model) {
            return model.bindKnex(connection);
          }, _this3.models);
          _this3.cache.models[shopName] = cachedModels;
          _this3.cache.connections[shopName] = connection;
        }
        req.models = cachedModels;
        req.connection = connection;
        next();
      });

      return function (_x15, _x16, _x17) {
        return _ref6.apply(this, arguments);
      };
    })();
  }

  static getShopFromQueryString(req) {
    //req.query.shop has shop name excluding https:// but including .myshopify.com
    const { shop } = req.query;
    const shopName = getShopNameFromFQN(shop);
    return { shop: shopName };
  }

  static getShopFromShoptimistApiKeyHeader(req) {
    const authHeader = req.headers.authorization || '';
    const [bearer, key] = _lib.R.split(' ', authHeader);
    if (bearer !== 'Bearer') return null;

    return { shoptimist_api_key: key };
  }

  getKey(req) {
    if (this.multipleApps) {
      return this.multipleApps[req.query.app].shopifyAppKey;
    } else {
      return this.key;
    }
  }

  getSecret(req) {
    if (this.multipleApps) {
      return this.multipleApps[req.query.app].shopifyAppSecret;
    } else {
      return this.secret;
    }
  }

  verifyMultipleApps(req) {
    if (this.multipleApps && (!req.query.app || !this.multipleApps[req.query.app])) {
      throw Error('When using multiple apps, then app must defined on all URLs - query app was ' + req.query.app);
    }
  }
}

exports.ShopifyOAuth = ShopifyOAuth;
const replacePercent = _lib.R.compose(_lib.R.join('%25'), _lib.R.split('%'));
const replaceAnd = _lib.R.compose(_lib.R.join('%26'), _lib.R.split('&'));
const replaceEquals = _lib.R.compose(_lib.R.join('%3D'), _lib.R.split('='));
const fixupQuery = _lib.R.compose(replacePercent, replaceAnd, replaceEquals);
function verifyAdminHMAC(hmac, params, secret) {
  let kvpairs = [];
  for (let key in params) {
    kvpairs.push(`${fixupQuery(key)}=${fixupQuery(params[key])}`);
  }
  const message = kvpairs.sort().join('&');
  const digest = (0, _crypto.createHmac)('sha256', secret).update(message).digest('hex');
  return digest === hmac;
}

// Shopify seems to be escaping forward slashes and replacing `&`
// characters, so we need to do the same
const escapeSlash = _lib.R.compose(_lib.R.join('\\/'), _lib.R.split('/'));
const replaceAndUnicode = _lib.R.compose(_lib.R.join('\\u0026'), _lib.R.split('&'));
const fixupMessage = _lib.R.compose(escapeSlash, replaceAndUnicode);
function verifyWebhookHMAC(hmac, params, secret) {
  const message = fixupMessage(JSON.stringify(params));
  const digest = (0, _crypto.createHmac)('sha256', secret).update(message).digest('hex');
  return digest === hmac;
}

function getShopURL(shop, path, params) {
  const baseUrl = `https://${shop}.myshopify.com/${path}`;
  return params ? `${baseUrl}?${(0, _queryString.stringify)(params, {
    encode: true
  })}` : baseUrl;
}

function getShopNameFromFQN(fqn) {
  return _lib.R.head(_lib.R.split('.', fqn));
}