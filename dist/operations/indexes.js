'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.drop = exports.create = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function generateIndexName(table, columns, options) {
  var tableName = typeof table === 'object' ? table.name : table;
  return options.name ? options.name : _utils.template`${tableName}_${_lodash2.default.isArray(columns) ? columns.join('_') : columns}${options.unique ? '_unique' : ''}_index`;
}

function generateColumnString(column) {
  return (/.+\(.*\)/.test(column) ? column // expression
    : _utils.template`"${column}"`
  ); // single column
}

function generateColumnsString(columns) {
  return _lodash2.default.isArray(columns) ? columns.map(generateColumnString).join(', ') : generateColumnString(columns);
}

var create = exports.create = function create(tableName, columns) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  /*
   columns - the column, columns, or expression to create the index on
    Options
   name - explicitly specify the name for the index
   unique - is this a unique index
   where - where clause
   concurrently -
   options.method -  [ btree | hash | gist | spgist | gin ]
   */
  var indexName = generateIndexName(tableName, columns, options);
  var columnsString = generateColumnsString(columns);
  var unique = options.unique ? ' UNIQUE ' : '';
  var concurrently = options.concurrently ? ' CONCURRENTLY ' : '';
  var method = options.method ? ` USING ${options.method}` : '';
  var where = options.where ? ` WHERE ${options.where}` : '';

  return _utils.template`CREATE ${unique} INDEX ${concurrently} "${indexName}" ON "${tableName}"${method} (${columnsString})${where};`;
};

var drop = exports.drop = function drop(tableName, columns) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var concurrently = options.concurrently,
      ifExists = options.ifExists,
      cascade = options.cascade;

  return `DROP INDEX${concurrently ? ' CONCURRENTLY' : ''}${ifExists ? ' IF EXISTS' : ''} "${generateIndexName(tableName, columns, options)}"${cascade ? ' CASCADE' : ''};`;
};

// setup reverse functions
create.reverse = drop;