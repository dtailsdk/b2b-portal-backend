import { Model } from '@mekanisme/server'
import { ShopifyToken as baseShopifyToken } from '@mekanisme/server/models'

class ShopifyToken extends baseShopifyToken {
  static tableName = 'shopify_tokens'

  static relationMappings = {
    app: {
      relation: Model.BelongsToOneRelation,
      modelClass: `${__dirname}/App`,
      join: {
        from: 'apps.id',
        to: 'shopify_tokens.app_id',
      },
    }
  }
}

export default ShopifyToken