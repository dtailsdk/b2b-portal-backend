exports.up = function (knex, Promise) {
  return knex.schema.createTable('apps', table => {
    table.increments('id').primary()
    table.string('identifier')
    table.string('shopifyAppKey')
    table.string('shopifyAppSecret')
    table.string('shopifyAppHandle')
    table.timestamps(true, true, true)
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('apps')
}