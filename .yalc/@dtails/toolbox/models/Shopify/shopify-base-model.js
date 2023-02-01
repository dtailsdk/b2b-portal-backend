'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ = require('./..');

// class QueryBuilder extends Model.QueryBuilder {
//   constructor(modelClass) {
//     super(modelClass)

//     this.onBuild(builder => {
//       console.log('SHOPIFY BASE SHOP', ShopifyBase.shop)
//     })
//   }
// }

class ShopifyBase extends _.Model {
  // static QueryBuilder = QueryBuilder
  // static RelatedQueryBuilder = QueryBuilder
  // static setShop(id) {
  //   ShopifyBase.shop = id
  // }
}

exports.default = ShopifyBase;