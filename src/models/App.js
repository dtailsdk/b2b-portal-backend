import { Model } from '@dtails/toolbox-backend'

class App extends Model {
  static tableName = 'apps'
  static hasTimestamps = true

  static relationMappings = {
    shop: {
      relation: Model.BelongsToOneRelation,
      modelClass: `${__dirname}/ShopifyToken`,
      join: {
        from: 'apps.id',
        to: 'shopify_tokens.appId',
      },
    }
  }
}

export default App
