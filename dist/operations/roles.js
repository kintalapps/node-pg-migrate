'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.undoRename = exports.rename = exports.alter = exports.drop = exports.create = undefined;

var _lodash = require('lodash');

var _utils = require('../utils');

var formatRoleOptions = function formatRoleOptions() {
  var roleOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var options = [];
  options.push(roleOptions.superuser ? 'SUPERUSER' : 'NOSUPERUSER');
  options.push(roleOptions.createdb ? 'CREATEDB' : 'NOCREATEDB');
  options.push(roleOptions.createrole ? 'CREATEROLE' : 'NOCREATEROLE');
  options.push(!roleOptions.inherit ? 'NOINHERIT' : 'INHERIT');
  options.push(roleOptions.login ? 'LOGIN' : 'NOLOGIN');
  options.push(roleOptions.replication ? 'REPLICATION' : 'NOREPLICATION');
  if (roleOptions.bypassrls !== undefined) {
    options.push(roleOptions.bypassrls ? 'BYPASSRLS' : 'NOBYPASSRLS');
  }
  if (roleOptions.limit) {
    options.push(`CONNECTION LIMIT ${Number(roleOptions.limit)}`);
  }
  if (roleOptions.password) {
    options.push(`${!roleOptions.encrypted ? 'UNENCRYPTED' : 'ENCRYPTED'} PASSWORD ${(0, _utils.escapeValue)(roleOptions.password)}`);
  }
  if (roleOptions.valid) {
    options.push(`VALID UNTIL ${(0, _utils.escapeValue)(roleOptions.valid)}`);
  }
  if (roleOptions.inRole) {
    options.push(`IN ROLE ${(0, _lodash.isArray)(roleOptions.inRole) ? roleOptions.inRole.join(',') : roleOptions.inRole}`);
  }
  if (roleOptions.role) {
    options.push(`ROLE ${(0, _lodash.isArray)(roleOptions.role) ? roleOptions.role.join(',') : roleOptions.role}`);
  }
  if (roleOptions.admin) {
    options.push(`ADMIN ${(0, _lodash.isArray)(roleOptions.admin) ? roleOptions.admin.join(',') : roleOptions.admin}`);
  }

  return options.join(' ');
};

var create = exports.create = function create(roleName) {
  var roleOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var options = formatRoleOptions(roleOptions);
  return _utils.template`CREATE ROLE "${roleName}"${options ? ` WITH ${options}` : ''};`;
};

var drop = exports.drop = function drop(roleName) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      ifExists = _ref.ifExists;

  return _utils.template`DROP ROLE${ifExists ? ' IF EXISTS' : ''} "${roleName}";`;
};

var alter = exports.alter = function alter(roleName) {
  var roleOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var options = formatRoleOptions(roleOptions);
  return _utils.template`ALTER ROLE "${roleName}"${options ? ` WITH ${options}` : ''};`;
};

var rename = exports.rename = function rename(oldRoleName, newRoleName) {
  return _utils.template`ALTER ROLE "${oldRoleName}" RENAME TO "${newRoleName}";`;
};

var undoRename = exports.undoRename = function undoRename(oldRoleName, newRoleName) {
  return rename(newRoleName, oldRoleName);
};

// setup reverse functions
create.reverse = drop;
rename.reverse = undoRename;