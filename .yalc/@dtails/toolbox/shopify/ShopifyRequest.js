'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ShopifyRequest = undefined;

var _lib = require('../lib');

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _axiosCancel = require('axios-cancel');

var _axiosCancel2 = _interopRequireDefault(_axiosCancel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//import { R } from '@mekanisme/common'
const cache = {};

class ShopifyOAuthRequest {
  constructor(data = {}) {
    const { shop, access_token } = data;
    if (_lib.R.isNil(shop) || _lib.R.isNil(access_token)) {
      console.log('Error: ShopifyRequest: missing shop or access_token');
    }
    let request = _lib.R.prop(shop, cache);
    if (_lib.R.isNil(request)) {
      const baseURL = `https://${shop}.myshopify.com`;
      request = _axios2.default.create({
        baseURL
      });
      (0, _axiosCancel2.default)(request, {
        debug: false
      });
      request.isCancel = _axios2.default.isCancel;
      request.interceptors.request.use(config => {
        config.headers['X-Shopify-Access-Token'] = access_token;
        return config;
      });
      cache[shop] = request;
    }
    this.request = request;
  }
}

class ShopifyPrivateRequest {
  constructor(data = {}) {
    this.data = data;
  }
}

class ShopifyRequest {
  constructor(type, data) {
    this.type = type;
    this.data = data;

    if (type === 'oauth') {
      this.handler = new ShopifyOAuthRequest(data);
    } else if (type === 'private') {
      this.handler = new ShopifyPrivateRequest(data);
    } else {
      console.log('Error: ShopifyRequest: invalid request type', type);
    }
  }

  get(endpoint, config) {
    return this.handler.request.get(endpoint, config);
  }

  head(endpoint, config) {
    return this.handler.request.head(endpoint, config);
  }

  options(endpoint, config) {
    return this.handler.request.options(endpoint, config);
  }

  delete(endpoint, config) {
    return this.handler.request.delete(endpoint, config);
  }

  post(endpoint, data, config) {
    return this.handler.request.post(endpoint, data, config);
  }

  put(endpoint, data, config) {
    return this.handler.request.put(endpoint, data, config);
  }

  patch(endpoint, data, config) {
    return this.handler.request.patch(endpoint, data, config);
  }
}
exports.ShopifyRequest = ShopifyRequest;