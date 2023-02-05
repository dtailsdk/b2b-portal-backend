import { Model } from '@dtails/toolbox-backend'

class Product extends Model {
  static tableName = 'products'
  static hasTimestamps = true
  static hasUser = false

  static get idColumn() {
    return ['store_id', 'product_id'];
  }

  static relationMappings = {
    variants: {
      relation: Model.HasManyRelation,
      modelClass: `${__dirname}/ProductVariant`,
      join: {
        from: [
          'products.store_id',
          'products.product_id'
        ],
        to: [
          'product_variants.store_id',
          'product_variants.product_id'
        ]
      }
    }
  }
}

export default Product
