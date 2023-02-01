'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ramda = require('ramda');

var _objection = require('objection');

/**
 * @class QueryBuilder
 * @extends {ObjectionQueryBuilder}
 * @description
 * Extends the base Objection QueryBuilder with some convenience methods and
 * a few overridden ones.
 */
class QueryBuilder extends _objection.QueryBuilder {
  constructor(modelClass) {
    super(modelClass);

    this.onBuild(builder => {
      if (modelClass.softDelete && builder.isFind() && !builder.context().withDeleted) {
        builder.whereNull('deleted_at');
      }
    });
  }

  /**
   * Set the user that this query should refer to.
   *
   * Used for models that have `hasUser` set to true.
   *
   * @param {object} [user={}] - object containing at least user id
   * @returns {QueryBuilder}
   * @memberof QueryBuilder
   */
  withUser(user = {}) {
    return this.context({ user });
  }

  /**
   * Informs query that deleted entries should be returned
   *
   * @returns {QueryBuilder}
   * @memberof QueryBuilder
   */
  withDeleted() {
    return this.context({ withDeleted: true });
  }

  /**
   * Overwrites `delete`, handling a soft delete if `softDelete` is true
   * on the model. It will delegate to a `patch` if true and also set the
   * current user if `withUser` has been chained. It will fall back to a real
   * delete if not set.
   *
   * @returns {QueryBuilder}
   * @memberof QueryBuilder
   */
  delete() {
    const { hasUser, softDelete } = this.modelClass();

    if (softDelete) {
      const userId = (0, _ramda.pathOr)(false, ['user', 'id'], this.context());
      const deleted_at = new Date().toISOString();
      let patch = { deleted_at };
      if (hasUser && userId) {
        patch.deleted_by = userId;
      }
      this.context({
        softDeleting: true
      });
      return super.patch(patch);
    }

    return super.delete();
  }

  /**
   * Like {@link ?api=all#QueryBuilder#delete|delete}, but for a specific `id`.
   * It will look up what the name of the models id field is.
   *
   * @param {any} id The id of the entry to delete
   * @returns {QueryBuilder}
   * @memberof QueryBuilder
   */
  deleteById(id) {
    const model = this.modelClass();
    const { hasUser, softDelete } = model;

    if (softDelete) {
      const userId = (0, _ramda.pathOr)(false, ['user', 'id'], this.context());
      const idColumn = this.fullIdColumnFor(model);
      const deleted_at = new Date().toISOString();
      let patch = { deleted_at };
      if (hasUser && userId) {
        patch.deleted_by = userId;
      }
      this.context({
        softDeleting: true
      });
      return (0, _ramda.type)(id) === 'Array' ? super.patch(patch).whereIn(idColumn, id) : super.patch(patch).where(idColumn, id);
    }

    return super.deleteById(id);
  }

  /**
   * Calls out to objections real delete, going around `softDelete`
   *
   * @returns {QueryBuilder}
   * @memberof QueryBuilder
   */
  forceDelete() {
    return super.delete();
  }

  /**
   * Overrides patchAndFetchById to ensure that the patched object id (as "objectId") is added to the context
   * @returns {QueryBuilder}
   * @memberof QueryBuilder
   */
  patchAndFetchById(id, modelOrObject) {
    this.context({ objectId: id });
    return super.patchAndFetchById(id, modelOrObject);
  }

  /**
   * Overrides updateAndFetchById to ensure that the updated object id (as "objectId") is added to the context
   * @returns {QueryBuilder}
   * @memberof QueryBuilder
   */
  updateAndFetchById(id, modelOrObject) {
    this.context({ objectId: id });
    return super.updateAndFetchById(id, modelOrObject);
  }
}

/**
 * @class Model
 * @extends {ObjectionModel}
 * @description
 * The main purpose of Model is to handle common scenarios with simple
 * configuration and method calls.
 *
 * It is responsible for handling created_at and updated_at timestamps,
 * keeping track of user responsible for changes and
 * soft deletion at this point
 *
 * It uses the QueryBuilder also documented here, and has all of the
 * other methods documented in the
 * <a href="http://vincit.github.io/objection.js/#query" target="_blank">
 * Objection Documentation
 * </a>
 *
 * **Reference**
 *
 * - <a href="https://www.npmjs.com/package/objection-softdelete" target="_blank">objection-softdelete</a>
 * - <a href="https://github.com/Vincit/objection.js/issues/335" target="_blank">Discussion on plugins</a>
 *
 * @property {boolean} hasTimestamp
 *    `static` - set `created_at/updated_at` on `insert/update`
 * @property {boolean} hasUser
 *    `static` - set `created_by/updated_by` on `insert/update/delete` if the
 *    query has been chained with a `.withUser({ id })`
 * @property {boolean} softDelete
 *    `static` - set `deleted_at` on `delete` instead of really deleting and
 *    `deleted_by` if `hasUser` is true and a `withUser` has been chained
 *
 * @example
 * class User extends Model {
 *   static hasTimestamps = true
 *   static softDelete = true
 * }
 *
 * await User.q.insert({ id: 1 })
 * await User.q.deleteById(1)
 * await User.q.withDeleted().where({ id: 1 })
 * // => { id: 1, deleted_at: `timestamp` }
 *
 */
class Model extends _objection.Model {

  /**
   * @static
   * @readonly
   * @description
   * Convenience alias for
   * <a href="http://vincit.github.io/objection.js/#query" target="_blank">
   * .query()
   * </a>
   *
   * Returns an instance of the {@link ?api=all#QueryBuilder|QueryBuilder}
   * for this model.
   *
   * @example
   * class User extends Model {}
   * User.q
   * // => QueryBuilder
   *
   * @memberof Model
   */
  static get q() {
    return this.query();
  }

  /**
   * @static
   * @readonly
   * @description
   * Convenience alias for
   * <a href="http://vincit.github.io/objection.js/#raw" target="_blank">
   * objection.raw()
   * </a>
   *
   * Used to create a raw expression. See:
   * <a href="http://knexjs.org/#Raw" target="_blank">knex.raw</a>
   *
   * @example
   * class User extends Model {}
   * User.q.select(User.raw('sum(profit)'))
   *
   * @memberof Model
   */

  $beforeInsert(context) {
    const { hasUser, hasTimestamps } = this.constructor;
    const userId = (0, _ramda.pathOr)(false, ['user', 'id'], context);

    if (hasUser && userId) {
      this.created_by = userId;
      this.updated_by = userId;
    }

    if (hasTimestamps) {
      const now = new Date().toISOString();
      this.created_at = now;
      this.updated_at = now;
    }
  }

  $beforeUpdate(opt, context) {
    const { hasUser, hasTimestamps } = this.constructor;
    const userId = (0, _ramda.pathOr)(false, ['user', 'id'], context);
    const softDeleting = (0, _ramda.pathOr)(false, ['softDeleting'], context);

    // if we are doing a soft delete, don't set updated_(at/by)
    if (softDeleting) {
      return;
    }

    if (hasUser && userId) {
      this.updated_by = userId;
    }

    if (hasTimestamps) {
      const now = new Date().toISOString();
      this.updated_at = now;
    }
  }
}

Model.QueryBuilder = QueryBuilder;
Model.RelatedQueryBuilder = QueryBuilder;
Model.hasTimestamps = true;
Model.hasUser = false;
Model.softDelete = false;
exports.default = Model;