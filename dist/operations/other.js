'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sql = undefined;

var _utils = require('../utils');

// eslint-disable-next-line import/prefer-default-export
var sql = exports.sql = function sql() {
  // applies some very basic templating using the utils.p
  var s = _utils.t.apply(undefined, arguments);
  // add trailing ; if not present
  if (s.lastIndexOf(';') !== s.length - 1) {
    s += ';';
  }
  return s;
};