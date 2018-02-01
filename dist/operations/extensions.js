'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.drop = exports.create = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var create = exports.create = function create(extensions) {
  if (!_lodash2.default.isArray(extensions)) extensions = [extensions]; // eslint-disable-line no-param-reassign
  return _lodash2.default.map(extensions, function (extension) {
    return _utils.template`CREATE EXTENSION "${extension}";`;
  });
};

var drop = exports.drop = function drop(extensions) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      ifExists = _ref.ifExists,
      cascade = _ref.cascade;

  if (!_lodash2.default.isArray(extensions)) extensions = [extensions]; // eslint-disable-line no-param-reassign
  return _lodash2.default.map(extensions, function (extension) {
    return _utils.template`DROP EXTENSION${ifExists ? ' IF EXISTS' : ''} "${extension}"${cascade ? ' CASCADE' : ''};`;
  });
};

// setup reverse functions
create.reverse = drop;