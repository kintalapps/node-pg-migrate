'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.undoRename = exports.rename = exports.alter = exports.create = exports.drop = undefined;

var _utils = require('../utils');

var parseOptions = function parseOptions(typeShorthands, options) {
  var type = options.type,
      increment = options.increment,
      minvalue = options.minvalue,
      maxvalue = options.maxvalue,
      start = options.start,
      cache = options.cache,
      cycle = options.cycle,
      owner = options.owner;

  var clauses = [];
  if (type) {
    clauses.push(`AS ${(0, _utils.applyType)(type, typeShorthands).type}`);
  }
  if (increment) {
    clauses.push(`INCREMENT BY ${increment}`);
  }
  if (minvalue) {
    clauses.push(`MINVALUE ${minvalue}`);
  } else if (minvalue === null || minvalue === false) {
    clauses.push('NO MINVALUE');
  }
  if (maxvalue) {
    clauses.push(`MAXVALUE ${maxvalue}`);
  } else if (maxvalue === null || maxvalue === false) {
    clauses.push('NO MAXVALUE');
  }
  if (start) {
    clauses.push(`START WITH ${start}`);
  }
  if (cache) {
    clauses.push(`CACHE ${cache}`);
  }
  if (cycle) {
    clauses.push('CYCLE');
  } else if (cycle === false) {
    clauses.push('NO CYCLE');
  }
  if (owner) {
    clauses.push(`OWNED BY ${owner}`);
  } else if (owner === null || owner === false) {
    clauses.push('OWNED BY NONE');
  }
  return clauses;
};

var drop = exports.drop = function drop(sequenceName) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      ifExists = _ref.ifExists,
      cascade = _ref.cascade;

  return _utils.template`DROP SEQUENCE${ifExists ? ' IF EXISTS' : ''} "${sequenceName}"${cascade ? ' CASCADE' : ''};`;
};

var create = exports.create = function create(typeShorthands) {
  var _create = function _create(sequenceName, options) {
    var temporary = options.temporary,
        ifNotExists = options.ifNotExists;

    var clauses = parseOptions(typeShorthands, options);
    return _utils.template`CREATE${temporary ? ' TEMPORARY' : ''} SEQUENCE${ifNotExists ? ' IF NOT EXISTS' : ''} "${sequenceName}"
  ${clauses.join('\n  ')};`;
  };
  _create.reverse = drop;
  return _create;
};

var alter = exports.alter = function alter(typeShorthands) {
  return function (sequenceName, options) {
    var restart = options.restart;

    var clauses = parseOptions(typeShorthands, options);
    if (restart) {
      if (restart === true) {
        clauses.push('RESTART');
      } else {
        clauses.push(`RESTART WITH ${restart}`);
      }
    }
    return _utils.template`ALTER SEQUENCE "${sequenceName}"
  ${clauses.join('\n  ')};`;
  };
};

// RENAME
var rename = exports.rename = function rename(sequenceName, newSequenceName) {
  return _utils.template`ALTER SEQUENCE "${sequenceName}" RENAME TO "${newSequenceName}";`;
};

var undoRename = exports.undoRename = function undoRename(sequenceName, newSequenceName) {
  return rename(newSequenceName, sequenceName);
};

rename.reverse = undoRename;