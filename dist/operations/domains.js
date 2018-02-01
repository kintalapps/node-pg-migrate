'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.undoRename = exports.rename = exports.alter = exports.create = exports.drop = undefined;

var _utils = require('../utils');

var drop = exports.drop = function drop(domainName) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      ifExists = _ref.ifExists,
      cascade = _ref.cascade;

  return _utils.template`DROP DOMAIN${ifExists ? ' IF EXISTS' : ''} "${domainName}"${cascade ? ' CASCADE' : ''};`;
};

var create = exports.create = function create(typeShorthands) {
  var _create = function _create(domainName, type, options) {
    var defaultValue = options.default,
        collation = options.collation,
        notNull = options.notNull,
        check = options.check,
        constraintName = options.constraintName;

    var constraints = [];
    if (collation) {
      constraints.push(`COLLATE ${collation}`);
    }
    if (defaultValue !== undefined) {
      constraints.push(`DEFAULT ${(0, _utils.escapeValue)(defaultValue)}`);
    }
    if (notNull && check) {
      throw new Error('"notNull" and "check" can\'t be specified together');
    } else if (notNull || check) {
      if (constraintName) {
        constraints.push(`CONSTRAINT ${constraintName}`);
      }
      if (notNull) {
        constraints.push('NOT NULL');
      } else if (check) {
        constraints.push(`CHECK (${check})`);
      }
    }

    var constraintsString = constraints.length ? ` ${constraints.join(' ')}` : '';

    return _utils.template`CREATE DOMAIN "${domainName}" AS ${(0, _utils.applyType)(type, typeShorthands).type}${constraintsString};`;
  };
  _create.reverse = function (domainName, type, options) {
    return drop(domainName, options);
  };
  return _create;
};

var alter = exports.alter = function alter(domainName, options) {
  var defaultValue = options.default,
      notNull = options.notNull,
      allowNull = options.allowNull,
      check = options.check,
      constraintName = options.constraintName;

  var actions = [];
  if (defaultValue === null) {
    actions.push('DROP DEFAULT');
  } else if (defaultValue !== undefined) {
    actions.push(`SET DEFAULT ${(0, _utils.escapeValue)(defaultValue)}`);
  }
  if (notNull) {
    actions.push('SET NOT NULL');
  } else if (notNull === false || allowNull) {
    actions.push('DROP NOT NULL');
  }
  if (check) {
    actions.push(`${constraintName ? `CONSTRAINT ${constraintName} ` : ''}CHECK (${check})`);
  }

  return `${actions.map(function (action) {
    return _utils.template`ALTER DOMAIN "${domainName}" ${action}`;
  }).join(';\n')};`;
};

// RENAME
var rename = exports.rename = function rename(domainName, newDomainName) {
  return _utils.template`ALTER DOMAIN  "${domainName}" RENAME TO "${newDomainName}";`;
};

var undoRename = exports.undoRename = function undoRename(domainName, newDomainName) {
  return rename(newDomainName, domainName);
};

rename.reverse = undoRename;