exports.up = function (knex, Promise) {
  return knex.schema.createTable('product_variants', table => {
    table.integer('store_id').references('shopify_tokens.id').notNull()
    table.bigInteger('product_id')
    table.bigInteger('variant_id')
    table.string('sku')
    table.string('barcode')
    table.string('inventory_item_id')
    table.string('product_title')
    table.json('data')
    table.timestamps()
    table.primary(['store_id', 'variant_id']);
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('product_variants')
}