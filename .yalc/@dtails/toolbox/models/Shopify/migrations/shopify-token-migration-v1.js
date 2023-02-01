'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function up(table) {
  table.increments('id').primary();

  table.string('shop').unique();
  table.string('token');
  table.string('scope');
  table.string('shoptimist_api_key').unique();
  table.timestamps();
}

function down(table) {}

exports.up = up;
exports.down = down;