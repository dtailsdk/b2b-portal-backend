import { Model } from '@dtails/toolbox-backend'
import { ShopifyToken as baseShopifyToken } from '@dtails/toolbox-backend'
import { Api } from '@dtails/shopify-api'
import { getEnvironment } from '@dtails/toolbox-backend'

class ShopifyToken extends baseShopifyToken {
  static tableName = 'shopify_tokens'

  static get virtualAttributes() {
    return ['api'];
  } 
  
  api() {
    console.log({
      accessToken: this.token,
      apiVersion: getEnvironment('SHOPIFY_API_VERSION', '2023-01'),
      shopName: `${this.shop}.myshopify.com`
    })
    return new Api({
      accessToken: this.token,
      apiVersion: getEnvironment('SHOPIFY_API_VERSION', '2023-01'),
      shopName: `${this.shop}.myshopify.com`
    })
  }

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