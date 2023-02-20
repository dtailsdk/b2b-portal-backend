exports.up = function (knex, Promise) {
  return knex.schema.alterTable('product_variants', function(t) {
    t.jsonb('data').alter();
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.alterTable('product_variants', function(t) {
    t.json('data').alter();
  })
}