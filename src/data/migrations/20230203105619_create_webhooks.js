exports.up = function (knex, Promise) {
  return knex.schema.createTable('webhooks', table => {
    table.increments('id').primary()
    table.integer('store_id').references('shopify_tokens.id').notNull()
    table.string('store_name')
    table.string('topic')
    table.string('hmac')
    table.json('data')
    table.timestamp('queued_at')
    table.timestamp('executed_at')
    table.timestamps()
    table.index(['topic', 'hmac'], 'idx_topic_hmac', {
      storageEngineIndexType: 'btree'
    });
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('webhooks')
}