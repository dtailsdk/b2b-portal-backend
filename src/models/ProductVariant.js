import { Model } from '@dtails/toolbox-backend'

class ProductVariant extends Model {
  static tableName = 'product_variants'
  static hasTimestamps = true
  static hasUser = false

  static get idColumn() {
    return ['store_id', 'variant_id'];
  }

  static relationMappings = {
    product: {
      relation: Model.BelongsToOneRelation,
      modelClass: `${__dirname}/Product`,
      join: {
        from: [
          'product_variants.store_id',
          'product_variants.product_id'
        ],
        to: [
          'products.store_id',
          'products.product_id'
        ]
      }
    },
  }
}

export default ProductVariant
