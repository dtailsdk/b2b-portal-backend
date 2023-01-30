import { Model } from '@dtails/toolbox'

class App extends Model {
  static tableName = 'apps'
  static hasTimestamps = true

  static relationMappings = {
    shop: {
      relation: Model.BelongsToOneRelation,
      modelClass: `${__dirname}/ShopifyToken`,
      join: {
        from: 'apps.id',
        to: 'shopify_tokens.app_id',
      },
    }
  }
}

export default App
