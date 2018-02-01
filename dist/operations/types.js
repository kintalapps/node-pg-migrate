'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.undoRenameTypeAttribute = exports.renameTypeAttribute = exports.undoRename = exports.rename = exports.addTypeValue = exports.setTypeAttribute = exports.addTypeAttribute = exports.dropTypeAttribute = exports.create = exports.drop = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var drop = exports.drop = function drop(typeName) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      ifExists = _ref.ifExists,
      cascade = _ref.cascade;

  return _utils.template`DROP TYPE${ifExists ? ' IF EXISTS' : ''} "${typeName}"${cascade ? ' CASCADE' : ''};`;
};

var create = exports.create = function create(typeShorthands) {
  var _create = function _create(typeName, options) {
    if (_lodash2.default.isArray(options)) {
      return _utils.template`CREATE TYPE "${typeName}" AS ENUM (${options.map(_utils.escapeValue).join(', ')});`;
    }
    var attributes = _lodash2.default.map(options, function (attribute, attributeName) {
      return _utils.template`"${attributeName}" ${(0, _utils.applyType)(attribute, typeShorthands).type}`;
    }).join(',\n');
    return _utils.template`CREATE TYPE "${typeName}" AS (\n${attributes}\n);`;
  };
  _create.reverse = drop;
  return _create;
};

var dropTypeAttribute = exports.dropTypeAttribute = function dropTypeAttribute(typeName, attributeName) {
  var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      ifExists = _ref2.ifExists;

  return _utils.template`ALTER TYPE "${typeName}" DROP ATTRIBUTE "${attributeName}"${ifExists ? ' IF EXISTS' : ''};`;
};

var addTypeAttribute = exports.addTypeAttribute = function addTypeAttribute(typeShorthands) {
  var _alterAttributeAdd = function _alterAttributeAdd(typeName, attributeName, attributeType) {
    return _utils.template`ALTER TYPE "${typeName}" ADD ATTRIBUTE "${attributeName}" ${(0, _utils.applyType)(attributeType, typeShorthands).type};`;
  };
  _alterAttributeAdd.reverse = dropTypeAttribute;
  return _alterAttributeAdd;
};

var setTypeAttribute = exports.setTypeAttribute = function setTypeAttribute(typeShorthands) {
  return function (typeName, attributeName, attributeType) {
    return _utils.template`ALTER TYPE "${typeName}" ALTER ATTRIBUTE "${attributeName}" SET DATA TYPE ${(0, _utils.applyType)(attributeType, typeShorthands).type};`;
  };
};

var addTypeValue = exports.addTypeValue = function addTypeValue(typeName, value) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var ifNotExists = options.ifNotExists,
      before = options.before,
      after = options.after;


  if (before && after) {
    throw new Error('"before" and "after" can\'t be specified together');
  }
  var beforeClause = before ? ` BEFORE ${before}` : '';
  var afterClause = after ? ` AFTER ${after}` : '';

  return _utils.template`ALTER TYPE "${typeName}" ADD VALUE${ifNotExists ? ' IF NOT EXISTS' : ''} ${(0, _utils.escapeValue)(value)}${beforeClause}${afterClause};`;
};

// RENAME
var rename = exports.rename = function rename(typeName, newTypeName) {
  return _utils.template`ALTER TYPE  "${typeName}" RENAME TO "${newTypeName}";`;
};

var undoRename = exports.undoRename = function undoRename(typeName, newTypeName) {
  return rename(newTypeName, typeName);
};

var renameTypeAttribute = exports.renameTypeAttribute = function renameTypeAttribute(typeName, attributeName, newAttributeName) {
  return _utils.template`ALTER TYPE "${typeName}" RENAME ATTRIBUTE "${attributeName}" TO "${newAttributeName}";`;
};

var undoRenameTypeAttribute = exports.undoRenameTypeAttribute = function undoRenameTypeAttribute(typeName, attributeName, newAttributeName) {
  return renameTypeAttribute(typeName, newAttributeName, attributeName);
};

rename.reverse = undoRename;
renameTypeAttribute.reverse = undoRenameTypeAttribute;