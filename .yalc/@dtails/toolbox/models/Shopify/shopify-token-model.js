'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ = require('./..');

var _shopifyTokenMigrationV = require('./migrations/shopify-token-migration-v1');

var v1 = _interopRequireWildcard(_shopifyTokenMigrationV);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// TODO: safeguard singleton calls so we can't touch the tables without a shop id

class ShopifyToken extends _.ShopifyBase {}

ShopifyToken.hasTimestamps = true;
ShopifyToken.migrations = {
  v1
};
exports.default = ShopifyToken;