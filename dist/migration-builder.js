'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      The migration builder is used to actually create a migration from instructions
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      A new instance of MigrationBuilder is instantiated and passed to the up or down block
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      of each migration when it is being run.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      It makes the methods available via the pgm variable and stores up the sql commands.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      This is what makes it possible to do this without making everything async
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      and it makes inference of down migrations possible.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _utils = require('./utils');

var _extensions = require('./operations/extensions');

var extensions = _interopRequireWildcard(_extensions);

var _indexes = require('./operations/indexes');

var indexes = _interopRequireWildcard(_indexes);

var _tables = require('./operations/tables');

var tables = _interopRequireWildcard(_tables);

var _types = require('./operations/types');

var types = _interopRequireWildcard(_types);

var _roles = require('./operations/roles');

var roles = _interopRequireWildcard(_roles);

var _functions = require('./operations/functions');

var functions = _interopRequireWildcard(_functions);

var _triggers = require('./operations/triggers');

var triggers = _interopRequireWildcard(_triggers);

var _schemas = require('./operations/schemas');

var schemas = _interopRequireWildcard(_schemas);

var _domains = require('./operations/domains');

var domains = _interopRequireWildcard(_domains);

var _sequences = require('./operations/sequences');

var sequences = _interopRequireWildcard(_sequences);

var _operators = require('./operations/operators');

var operators = _interopRequireWildcard(_operators);

var _other = require('./operations/other');

var other = _interopRequireWildcard(_other);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MigrationBuilder = function () {
  function MigrationBuilder() {
    var _this = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, MigrationBuilder);

    this._steps = [];
    this._REVERSE_MODE = false;
    // by default, all migrations are wrapped in a transaction
    this._use_transaction = true;

    // this function wraps each operation within a function that either
    // calls the operation or its reverse, and appends the result (array of sql statements)
    // to the  steps array
    var wrap = function wrap(operation) {
      return function () {
        if (_this._REVERSE_MODE && typeof operation.reverse !== 'function') {
          throw new Error('Impossible to automatically infer down migration');
        }
        _this._steps = _this._steps.concat(_this._REVERSE_MODE ? operation.reverse.apply(operation, arguments) : operation.apply(undefined, arguments));
      };
    };

    // defines the methods that are accessible via pgm in each migrations
    // there are some convenience aliases to make usage easier
    this.createExtension = wrap(extensions.create);
    this.dropExtension = wrap(extensions.drop);
    this.addExtension = this.createExtension;

    this.createTable = wrap(tables.create(options.typeShorthands));
    this.dropTable = wrap(tables.drop);
    this.renameTable = wrap(tables.renameTable);

    this.addColumns = wrap(tables.addColumns(options.typeShorthands));
    this.dropColumns = wrap(tables.dropColumns);
    this.renameColumn = wrap(tables.renameColumn);
    this.alterColumn = wrap(tables.alterColumn);
    this.addColumn = this.addColumns;
    this.dropColumn = this.dropColumns;

    this.addConstraint = wrap(tables.addConstraint);
    this.dropConstraint = wrap(tables.dropConstraint);
    this.renameConstraint = wrap(tables.renameConstraint);
    this.createConstraint = this.addConstraint;

    this.createType = wrap(types.create(options.typeShorthands));
    this.dropType = wrap(types.drop);
    this.addType = this.createType;
    this.renameType = wrap(types.rename);
    this.renameTypeAttribute = wrap(types.renameTypeAttribute);
    this.addTypeAttribute = wrap(types.addTypeAttribute(options.typeShorthands));
    this.dropTypeAttribute = wrap(types.dropTypeAttribute);
    this.setTypeAttribute = wrap(types.setTypeAttribute(options.typeShorthands));
    this.addTypeValue = wrap(types.addTypeValue);

    this.createIndex = wrap(indexes.create);
    this.dropIndex = wrap(indexes.drop);
    this.addIndex = this.createIndex;

    this.createRole = wrap(roles.create);
    this.dropRole = wrap(roles.drop);
    this.alterRole = wrap(roles.alter);
    this.renameRole = wrap(roles.rename);

    this.createFunction = wrap(functions.create(options.typeShorthands));
    this.dropFunction = wrap(functions.drop(options.typeShorthands));
    this.renameFunction = wrap(functions.rename(options.typeShorthands));

    this.createTrigger = wrap(triggers.create(options.typeShorthands));
    this.dropTrigger = wrap(triggers.drop);
    this.renameTrigger = wrap(triggers.rename);

    this.createSchema = wrap(schemas.create);
    this.dropSchema = wrap(schemas.drop);
    this.renameSchema = wrap(schemas.rename);

    this.createDomain = wrap(domains.create(options.typeShorthands));
    this.dropDomain = wrap(domains.drop);
    this.alterDomain = wrap(domains.alter);
    this.renameDomain = wrap(domains.rename);

    this.createSequence = wrap(sequences.create(options.typeShorthands));
    this.dropSequence = wrap(sequences.drop);
    this.alterSequence = wrap(sequences.alter(options.typeShorthands));
    this.renameSequence = wrap(sequences.rename);

    this.createOperator = wrap(operators.createOperator);
    this.dropOperator = wrap(operators.dropOperator);
    this.createOperatorClass = wrap(operators.createOperatorClass(options.typeShorthands));
    this.dropOperatorClass = wrap(operators.dropOperatorClass);
    this.renameOperatorClass = wrap(operators.renameOperatorClass);
    this.createOperatorFamily = wrap(operators.createOperatorFamily);
    this.dropOperatorFamily = wrap(operators.dropOperatorFamily);
    this.renameOperatorFamily = wrap(operators.renameOperatorFamily);
    this.addToOperatorFamily = wrap(operators.addToOperatorFamily(options.typeShorthands));
    this.removeFromOperatorFamily = wrap(operators.removeFromOperatorFamily(options.typeShorthands)); // eslint-disable-line max-len

    this.sql = wrap(other.sql);

    // Other utilities which may be useful
    // .func creates a string which will not be escaped
    // common uses are for PG functions, ex: { ... default: pgm.func('NOW()') }
    this.func = _utils.PgLiteral.create;
  }

  _createClass(MigrationBuilder, [{
    key: 'enableReverseMode',
    value: function enableReverseMode() {
      this._REVERSE_MODE = true;
      return this;
    }
  }, {
    key: 'noTransaction',
    value: function noTransaction() {
      this._use_transaction = false;
      return this;
    }
  }, {
    key: 'isUsingTransaction',
    value: function isUsingTransaction() {
      return this._use_transaction;
    }
  }, {
    key: 'getSql',
    value: function getSql() {
      return `${this.getSqlSteps().join('\n')}\n`;
    }
  }, {
    key: 'getSqlSteps',
    value: function getSqlSteps() {
      // in reverse mode, we flip the order of the statements
      return this._REVERSE_MODE ? this._steps.slice().reverse() : this._steps;
    }
  }]);

  return MigrationBuilder;
}();

exports.default = MigrationBuilder;