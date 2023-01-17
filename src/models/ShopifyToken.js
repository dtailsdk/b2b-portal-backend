import { ShopifyToken as baseShopifyToken } from '@mekanisme/server/models'

class ShopifyToken extends baseShopifyToken {
  static tableName = 'shopify_tokens'
}

export default ShopifyToken