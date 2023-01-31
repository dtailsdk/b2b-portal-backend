exports.up = async (knex) => {
  await knex.schema.table('shopify_tokens', t => {
    t.renameColumn('uninstalledAt', 'uninstalled_at')
  })
  await knex.schema.table('apps', t => {
    t.renameColumn('shopifyAppKey', 'shopify_app_key')
    t.renameColumn('shopifyAppSecret', 'shopify_app_secret')
    t.renameColumn('shopifyAppHandle', 'shopify_app_handle')
    t.renameColumn('createdAt', 'created_at')
    t.renameColumn('updatedAt', 'updated_at')
  })
}

exports.down = async (knex) => {
  await knex.schema.table('shopify_tokens', t => {
    t.renameColumn('uninstalled_at', 'uninstalledAt')
  })
  await knex.schema.table('apps', t => {
    t.renameColumn('shopify_app_key', 'shopifyAppKey')
    t.renameColumn('shopify_app_secret', 'shopifyAppSecret')
    t.renameColumn('shopify_app_handle', 'shopifyAppHandle')
    t.renameColumn('created_at', 'createdAt')
    t.renameColumn('updated_at', 'updatedAt')
  })
}