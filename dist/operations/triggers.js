'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.undoRename = exports.rename = exports.create = exports.drop = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _utils = require('../utils');

var _functions = require('./functions');

var drop = exports.drop = function drop(tableName, triggerName) {
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      ifExists = _ref.ifExists,
      cascade = _ref.cascade;

  return _utils.template`DROP TRIGGER${ifExists ? ' IF EXISTS' : ''} "${triggerName}" ON "${tableName}"${cascade ? ' CASCADE' : ''};`;
};

var create = exports.create = function create(typeShorthands) {
  var _create = function _create(tableName, triggerName) {
    var triggerOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var definition = arguments[3];
    var constraint = triggerOptions.constraint,
        condition = triggerOptions.condition,
        operation = triggerOptions.operation,
        deferrable = triggerOptions.deferrable,
        deferred = triggerOptions.deferred;
    var when = triggerOptions.when,
        _triggerOptions$level = triggerOptions.level,
        level = _triggerOptions$level === undefined ? 'STATEMENT' : _triggerOptions$level,
        functionName = triggerOptions.function;

    var operations = (0, _lodash.isArray)(operation) ? operation.join(' OR ') : operation;
    if (constraint) {
      when = 'AFTER';
    }
    var isInsteadOf = /instead\s+of/i.test(when);
    if (isInsteadOf) {
      level = 'ROW';
    }
    if (definition) {
      functionName = functionName || triggerName;
    }

    if (!when) {
      throw new Error('"when" (BEFORE/AFTER/INSTEAD OF) have to be specified');
    } else if (isInsteadOf && condition) {
      throw new Error('INSTEAD OF trigger can\'t have condition specified');
    }
    if (!operations) {
      throw new Error('"operation" (INSERT/UPDATE[ OF ...]/DELETE/TRUNCATE) have to be specified');
    }

    var defferClause = constraint ? `${deferrable ? `DEFERRABLE INITIALLY ${deferred ? 'DEFERRED' : 'IMMEDIATE'}` : 'NOT DEFERRABLE'}\n  ` : '';
    var conditionClause = condition ? `WHEN (${condition})\n  ` : '';

    var triggerSQL = _utils.template`CREATE${constraint ? ' CONSTRAINT' : ''} TRIGGER "${triggerName}"
  ${when} ${operations} ON "${tableName}"
  ${defferClause}FOR EACH ${level}
  ${conditionClause}EXECUTE PROCEDURE "${functionName}"();`;

    return `${definition ? `${(0, _functions.create)(typeShorthands)(functionName, [], _extends({}, triggerOptions, { returns: 'trigger' }), definition)}\n` : ''}${triggerSQL}`;
  };

  _create.reverse = function (tableName, triggerName) {
    var triggerOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var definition = arguments[3];
    return `${drop(tableName, triggerName, triggerOptions)}${definition ? `\n${(0, _functions.drop)(typeShorthands)(triggerOptions.function || triggerName, [], triggerOptions)}` : ''}`;
  };

  return _create;
};

var rename = exports.rename = function rename(tableName, oldTriggerName, newTriggerName) {
  return _utils.template`ALTER TRIGGER "${oldTriggerName}" ON "${tableName}" RENAME TO "${newTriggerName}";`;
};

var undoRename = exports.undoRename = function undoRename(tableName, oldTriggerName, newTriggerName) {
  return rename(tableName, newTriggerName, oldTriggerName);
};

rename.reverse = undoRename;