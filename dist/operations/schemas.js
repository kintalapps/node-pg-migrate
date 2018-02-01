'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.undoRename = exports.rename = exports.create = exports.drop = undefined;

var _utils = require('../utils');

var drop = exports.drop = function drop(schemaName) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      ifExists = _ref.ifExists,
      cascade = _ref.cascade;

  return _utils.template`DROP SCHEMA${ifExists ? ' IF EXISTS' : ''} "${schemaName}"${cascade ? ' CASCADE' : ''};`;
};

var create = exports.create = function create(schemaName, options) {
  var ifNotExists = options.ifNotExists,
      authorization = options.authorization;

  return _utils.template`CREATE SCHEMA${ifNotExists ? ' IF NOT EXISTS' : ''} "${schemaName}"${authorization ? ` AUTHORIZATION ${authorization}` : ''};`;
};

// RENAME
var rename = exports.rename = function rename(schemaName, newSchemaName) {
  return _utils.template`ALTER SCHEMA  "${schemaName}" RENAME TO "${newSchemaName}";`;
};

var undoRename = exports.undoRename = function undoRename(schemaName, newSchemaName) {
  return rename(newSchemaName, schemaName);
};

create.reverse = drop;
rename.reverse = undoRename;