import { Model } from '@dtails/toolbox-backend'
import { ShopifyToken as baseShopifyToken } from '@dtails/toolbox-backend/models'

class ShopifyToken extends baseShopifyToken {
  static tableName = 'shopify_tokens'

  static relationMappings = {
    app: {
      relation: Model.BelongsToOneRelation,
      modelClass: `${__dirname}/App`,
      join: {
        from: 'apps.id',
        to: 'shopify_tokens.appId',
      },
    }
  }
}

export default ShopifyToken