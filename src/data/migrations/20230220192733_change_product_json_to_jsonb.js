exports.up = function (knex, Promise) {
  return knex.schema.alterTable('products', function(t) {
    t.jsonb('data').alter();
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.alterTable('products', function(t) {
    t.json('data').alter();
  })
}