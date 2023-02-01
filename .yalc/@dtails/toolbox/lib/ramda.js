'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sample = exports.random = exports.replaceRight = exports.defaults = exports.keyBy = exports.mapIndexed = undefined;

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const mapIndexed = exports.mapIndexed = _ramda2.default.addIndex(_ramda2.default.map);

/**
 * @func
 * @sig (a -> String) -> [a] -> {String: a}
 * @param {Function} keyFn Function :: a -> String
 * @param {Array} list The array to key by
 * @return {Object} An object with the output of `fn` as keys, mapped to the
 *         last element that produced that key when passed to `fn`.
 *         Implements `lodash.keyBy`
 */

//export * from 'ramda'
const keyBy = exports.keyBy = _ramda2.default.curry((keyFn, list) => _ramda2.default.map(_ramda2.default.last, _ramda2.default.groupBy(keyFn, list)));

/**
 * @func
 */
const defaults = exports.defaults = (...args) => _ramda2.default.compose(_ramda2.default.mergeAll, _ramda2.default.reverse)(args);

const replaceRight = exports.replaceRight = _ramda2.default.curry((regex, replacement, str) => _ramda2.default.reverse(_ramda2.default.replace(regex, replacement, _ramda2.default.reverse(str))));

/**
 * Return a random integer between min and max (inclusive)
 */
const random = exports.random = (min, max) => {
  if (_ramda2.default.isNil(max)) {
    max = min;
    min = 0;
  }
  return min + Math.floor(Math.random() * (max - min + 1));
};

/**
 * Return `count` random values from a list. If count is not
 * specified, return a single random element
 */
const sample = exports.sample = (list, count) => {
  const length = _ramda2.default.length(list);
  if (!count) {
    return list[random(length - 1)];
  }
  let sample = _ramda2.default.clone(list);
  let last = length - 1;
  count = Math.max(Math.min(count, length), 0);
  for (let index = 0; index < count; index++) {
    const rand = random(index, last);
    const temp = sample[index];
    sample[index] = sample[rand];
    sample[rand] = temp;
  }
  return sample.slice(0, n);
};

// list (object) of additional functions defined by team
const addendum = {
  mapIndexed,
  keyBy,
  defaults,
  replaceRight,
  random,
  sample,
  debounce: _lodash.debounce

  // export default a merge of ramda's functions and ours
};exports.default = _ramda2.default.merge(_ramda2.default, addendum);