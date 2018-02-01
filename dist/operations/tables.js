'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dropConstraint = exports.addConstraint = exports.undoRenameConstraint = exports.renameConstraint = exports.undoRenameColumn = exports.renameColumn = exports.undoRenameTable = exports.renameTable = exports.alterColumn = exports.addColumns = exports.dropColumns = exports.create = exports.drop = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var formatLines = function formatLines(lines, replace) {
  var separator = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ',\n';
  return lines.join(separator).replace(/^/gm, replace);
};

var parseReferences = function parseReferences(options) {
  var references = options.references,
      match = options.match,
      onDelete = options.onDelete,
      onUpdate = options.onUpdate;

  var clauses = [typeof references === 'string' ? `REFERENCES ${references}` : _utils.template`REFERENCES "${references}"`];
  if (match) {
    clauses.push(`MATCH ${match}`);
  }
  if (onDelete) {
    clauses.push(`ON DELETE ${onDelete}`);
  }
  if (onUpdate) {
    clauses.push(`ON UPDATE ${onUpdate}`);
  }
  return clauses.join(' ');
};

var parseDeferrable = function parseDeferrable(options) {
  var deferrable = options.deferrable,
      deferred = options.deferred;

  return deferrable ? `DEFERRABLE INITIALLY ${deferred ? 'DEFERRED' : 'IMMEDIATE'}` : null;
};

var parseColumns = function parseColumns(columns) {
  var extendingTypeShorthands = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var columnsWithOptions = _lodash2.default.mapValues(columns, function (column) {
    return (0, _utils.applyType)(column, extendingTypeShorthands);
  });

  var primaryColumns = _lodash2.default.chain(columnsWithOptions).map(function (options, columnName) {
    return options.primaryKey ? columnName : null;
  }).filter().value();
  var multiplePrimaryColumns = primaryColumns.length > 1;

  if (multiplePrimaryColumns) {
    columnsWithOptions = _lodash2.default.mapValues(columnsWithOptions, function (options) {
      return _extends({}, options, { primaryKey: false });
    });
  }

  return {
    columns: _lodash2.default.map(columnsWithOptions, function (options, columnName) {
      var type = options.type,
          collation = options.collation,
          defaultValue = options.default,
          unique = options.unique,
          primaryKey = options.primaryKey,
          notNull = options.notNull,
          check = options.check,
          references = options.references,
          deferrable = options.deferrable;

      var constraints = [];
      if (collation) {
        constraints.push(`COLLATE ${collation}`);
      }
      if (defaultValue !== undefined) {
        constraints.push(`DEFAULT ${(0, _utils.escapeValue)(defaultValue)}`);
      }
      if (unique) {
        constraints.push('UNIQUE');
      }
      if (primaryKey) {
        constraints.push('PRIMARY KEY');
      }
      if (notNull) {
        constraints.push('NOT NULL');
      }
      if (check) {
        constraints.push(`CHECK (${check})`);
      }
      if (references) {
        constraints.push(parseReferences(options));
      }
      if (deferrable) {
        constraints.push(parseDeferrable(options));
      }

      var constraintsString = constraints.length ? ` ${constraints.join(' ')}` : '';

      return _utils.template`"${columnName}" ${type}${constraintsString}`;
    }),
    constraints: _extends({}, multiplePrimaryColumns ? { primaryKey: primaryColumns } : {})
  };
};

var parseConstraints = function parseConstraints(table, options) {
  var check = options.check,
      unique = options.unique,
      primaryKey = options.primaryKey,
      foreignKeys = options.foreignKeys,
      exclude = options.exclude,
      deferrable = options.deferrable;

  var tableName = typeof table === 'object' ? table.name : table;
  var constraints = [];
  if (check) {
    constraints.push(`CONSTRAINT "${tableName}_chck" CHECK (${check})`);
  }
  if (unique) {
    var uniqueArray = _lodash2.default.isArray(unique) ? unique : [unique];
    var isArrayOfArrays = uniqueArray.some(function (uniqueSet) {
      return _lodash2.default.isArray(uniqueSet);
    });
    if (isArrayOfArrays) {
      uniqueArray.forEach(function (uniqueSet, i) {
        return constraints.push(`CONSTRAINT "${tableName}_uniq_${i + 1}" UNIQUE (${(0, _utils.quote)(_lodash2.default.isArray(uniqueSet) ? uniqueSet : [uniqueSet]).join(', ')})`);
      });
    } else {
      constraints.push(`CONSTRAINT "${tableName}_uniq" UNIQUE (${(0, _utils.quote)(uniqueArray).join(', ')})`);
    }
  }
  if (primaryKey) {
    constraints.push(`CONSTRAINT "${tableName}_pkey" PRIMARY KEY (${(0, _utils.quote)(_lodash2.default.isArray(primaryKey) ? primaryKey : [primaryKey]).join(', ')})`);
  }
  if (foreignKeys) {
    (_lodash2.default.isArray(foreignKeys) ? foreignKeys : [foreignKeys]).forEach(function (fk) {
      var columns = fk.columns;

      constraints.push(`FOREIGN KEY (${(0, _utils.quote)(_lodash2.default.isArray(columns) ? columns : [columns]).join(', ')}) ${parseReferences(fk)}`);
    });
  }
  if (exclude) {
    constraints.push(`CONSTRAINT "${tableName}_excl" EXCLUDE ${exclude}`);
  }
  if (deferrable) {
    constraints.push(parseDeferrable(options));
  }

  return constraints;
};

// TABLE
var drop = exports.drop = function drop(tableName) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      ifExists = _ref.ifExists,
      cascade = _ref.cascade;

  return _utils.template`DROP TABLE${ifExists ? ' IF EXISTS' : ''} "${tableName}"${cascade ? ' CASCADE' : ''};`;
};

var create = exports.create = function create(typeShorthands) {
  var _create = function _create(tableName, columns) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var temporary = options.temporary,
        ifNotExists = options.ifNotExists,
        inherits = options.inherits,
        like = options.like,
        _options$constraints = options.constraints,
        optionsConstraints = _options$constraints === undefined ? {} : _options$constraints;

    var _parseColumns = parseColumns(columns, typeShorthands),
        columnLines = _parseColumns.columns,
        columnsConstraints = _parseColumns.constraints;

    var dupes = _lodash2.default.intersection(Object.keys(optionsConstraints), Object.keys(columnsConstraints));
    if (dupes.length > 0) {
      throw new Error(`There is duplicate constraint definition in table and columns options: ${dupes.join(', ')}`);
    }

    var constraints = _extends({}, optionsConstraints, columnsConstraints);
    var constraintLines = parseConstraints(tableName, constraints);
    var tableDefinition = [].concat(_toConsumableArray(columnLines), _toConsumableArray(constraintLines)).concat(like ? [_utils.template`LIKE "${like}"`] : []);

    return _utils.template`CREATE TABLE${temporary ? ' TEMPORARY' : ''}${ifNotExists ? ' IF NOT EXISTS' : ''} "${tableName}" (
${formatLines(tableDefinition, '  ')}
)${inherits ? _utils.template` INHERITS "${inherits}"` : ''};`;
  };
  _create.reverse = drop;
  return _create;
};

// COLUMNS
var dropColumns = exports.dropColumns = function dropColumns(tableName, columns) {
  var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      ifExists = _ref2.ifExists,
      cascade = _ref2.cascade;

  if (typeof columns === 'string') {
    columns = [columns]; // eslint-disable-line no-param-reassign
  } else if (!_lodash2.default.isArray(columns) && typeof columns === 'object') {
    columns = _lodash2.default.keys(columns); // eslint-disable-line no-param-reassign
  }
  return _utils.template`ALTER TABLE "${tableName}"
${formatLines((0, _utils.quote)(columns), `  DROP ${ifExists ? ' IF EXISTS' : ''}`, `${cascade ? ' CASCADE' : ''},\n`)};`;
};

var addColumns = exports.addColumns = function addColumns(typeShorthands) {
  var _add = function _add(tableName, columns) {
    var _parseColumns2 = parseColumns(columns, typeShorthands),
        columnLines = _parseColumns2.columns;

    return _utils.template`ALTER TABLE "${tableName}"\n${formatLines(columnLines, '  ADD ')};`;
  };
  _add.reverse = dropColumns;
  return _add;
};

var alterColumn = exports.alterColumn = function alterColumn(tableName, columnName, options) {
  var defaultValue = options.default,
      type = options.type,
      collation = options.collation,
      using = options.using,
      notNull = options.notNull,
      allowNull = options.allowNull;

  var actions = [];
  if (defaultValue === null) {
    actions.push('DROP DEFAULT');
  } else if (defaultValue !== undefined) {
    actions.push(`SET DEFAULT ${(0, _utils.escapeValue)(defaultValue)}`);
  }
  if (type) {
    actions.push(`SET DATA TYPE ${(0, _utils.applyTypeAdapters)(type)}${collation ? `COLLATE ${collation}` : ''}${using ? ` USING ${using}` : ''}`);
  }
  if (notNull) {
    actions.push('SET NOT NULL');
  } else if (notNull === false || allowNull) {
    actions.push('DROP NOT NULL');
  }

  return _utils.template`ALTER TABLE "${tableName}"\n${formatLines(actions, `  ALTER "${columnName}" `)};`;
};

// RENAME
var renameTable = exports.renameTable = function renameTable(tableName, newName) {
  return _utils.template`ALTER TABLE "${tableName}" RENAME TO "${newName}";`;
};

var undoRenameTable = exports.undoRenameTable = function undoRenameTable(tableName, newName) {
  return renameTable(newName, tableName);
};

var renameColumn = exports.renameColumn = function renameColumn(tableName, columnName, newName) {
  return _utils.template`ALTER TABLE "${tableName}" RENAME "${columnName}" TO "${newName}";`;
};

var undoRenameColumn = exports.undoRenameColumn = function undoRenameColumn(tableName, columnName, newName) {
  return renameColumn(tableName, newName, columnName);
};

var renameConstraint = exports.renameConstraint = function renameConstraint(tableName, constraintName, newName) {
  return _utils.template`ALTER TABLE "${tableName}" RENAME CONSTRAINT "${constraintName}" TO "${newName}";`;
};

var undoRenameConstraint = exports.undoRenameConstraint = function undoRenameConstraint(tableName, constraintName, newName) {
  return renameConstraint(tableName, newName, constraintName);
};

// CONSTRAINTS -- only supports named check constraints
var addConstraint = exports.addConstraint = function addConstraint(tableName, constraintName, expression) {
  return _utils.template`ALTER TABLE "${tableName}" ADD${constraintName ? ` CONSTRAINT "${constraintName}"` : ''} ${typeof expression === 'string' ? expression : parseConstraints(tableName, expression)};`;
};

var dropConstraint = exports.dropConstraint = function dropConstraint(tableName, constraintName) {
  var _ref3 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      ifExists = _ref3.ifExists,
      cascade = _ref3.cascade;

  return _utils.template`ALTER TABLE "${tableName}" DROP CONSTRAINT${ifExists ? ' IF EXISTS' : ''} "${constraintName}"${cascade ? ' CASCADE' : ''};`;
};

addColumns.reverse = dropColumns;
addConstraint.reverse = dropConstraint;
renameColumn.reverse = undoRenameColumn;
renameConstraint.reverse = undoRenameConstraint;
renameTable.reverse = undoRenameTable;