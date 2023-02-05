exports.up = function (knex, Promise) {
  return knex.schema.createTable('products', table => {
    table.bigInteger('product_id').primary()
    table.integer('store_id').references('shopify_tokens.id').notNull()
    table.string('handle')
    table.string('title')
    table.text('tags')
    table.json('data')
    table.timestamps()
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('products')
}
