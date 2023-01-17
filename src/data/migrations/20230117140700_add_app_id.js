exports.up = async (knex) => {
  await knex.schema.table('shopify_tokens', t => {
    t.integer('app_id').references('apps.id').notNull().onDelete('CASCADE')
    t.timestamp('uninstalledAt')
  })
}

exports.down = async (knex) => {
  await knex.schema.table('shopify_tokens', t => {
    t.dropColumn('app_id')
    t.dropColumn('uninstalledAt')
  })
}