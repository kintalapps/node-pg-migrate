'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renameOperatorClass = exports.createOperatorClass = exports.dropOperatorClass = exports.renameOperatorFamily = exports.addToOperatorFamily = exports.removeFromOperatorFamily = exports.dropOperatorFamily = exports.createOperatorFamily = exports.dropOperator = exports.createOperator = undefined;

var _utils = require('../utils');

var createOperator = exports.createOperator = function createOperator(operatorName) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var procedure = options.procedure,
      left = options.left,
      right = options.right,
      commutator = options.commutator,
      negator = options.negator,
      restrict = options.restrict,
      join = options.join,
      hashes = options.hashes,
      merges = options.merges;


  var defs = [];
  defs.push(`PROCEDURE = ${(0, _utils.schemalize)(procedure)}`);
  if (left) {
    defs.push(`LEFTARG = ${(0, _utils.schemalize)(left)}`);
  }
  if (right) {
    defs.push(`RIGHTARG = ${(0, _utils.schemalize)(right)}`);
  }
  if (commutator) {
    defs.push(`COMMUTATOR = ${(0, _utils.opSchemalize)(commutator)}`);
  }
  if (negator) {
    defs.push(`NEGATOR = ${(0, _utils.opSchemalize)(negator)}`);
  }
  if (restrict) {
    defs.push(`RESTRICT = ${(0, _utils.schemalize)(restrict)}`);
  }
  if (join) {
    defs.push(`JOIN = ${(0, _utils.schemalize)(join)}`);
  }
  if (hashes) {
    defs.push('HASHES');
  }
  if (merges) {
    defs.push('MERGES');
  }
  return `CREATE OPERATOR ${(0, _utils.opSchemalize)(operatorName)} (${defs.join(', ')});`;
};

var dropOperator = exports.dropOperator = function dropOperator(operatorName) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var ifExists = options.ifExists,
      cascade = options.cascade,
      left = options.left,
      right = options.right;


  var leftType = left || 'none';
  var rightType = right || 'none';

  return `DROP OPERATOR${ifExists ? ' IF EXISTS' : ''} ${(0, _utils.opSchemalize)(operatorName)}(${(0, _utils.schemalize)(leftType)}, ${(0, _utils.schemalize)(rightType)})${cascade ? ' CASCADE' : ''};`;
};

var createOperatorFamily = exports.createOperatorFamily = function createOperatorFamily(operatorFamilyName, indexMethod) {
  return `CREATE OPERATOR FAMILY ${(0, _utils.schemalize)(operatorFamilyName)} USING ${indexMethod};`;
};

var dropOperatorFamily = exports.dropOperatorFamily = function dropOperatorFamily(operatorFamilyName, indexMethod) {
  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      ifExists = _ref.ifExists,
      cascade = _ref.cascade;

  return (// eslint-disable-line max-len
    `DROP OPERATOR FAMILY ${ifExists ? ' IF EXISTS' : ''} ${(0, _utils.schemalize)(operatorFamilyName)} USING ${indexMethod}${cascade ? ' CASCADE' : ''};`
  );
};

var operatorMap = function operatorMap(typeShorthands) {
  return function (_ref2) {
    var _ref2$type = _ref2.type,
        type = _ref2$type === undefined ? '' : _ref2$type,
        number = _ref2.number,
        name = _ref2.name,
        _ref2$params = _ref2.params,
        params = _ref2$params === undefined ? [] : _ref2$params;

    if (String(type).toLowerCase() === 'function') {
      if (params.length > 2) {
        throw new Error('Operator can\'t have more than 2 parameters');
      }
      return `OPERATOR ${number} ${(0, _utils.opSchemalize)(name)}${params.length > 0 ? (0, _utils.formatParams)(params, typeShorthands) : ''}`;
    } else if (String(type).toLowerCase() === 'operator') {
      return `FUNCTION ${number} ${(0, _utils.schemalize)(name)}${(0, _utils.formatParams)(params, typeShorthands)}`;
    }
    throw new Error('Operator "type" must be either "function" or "operator"');
  };
};

var removeFromOperatorFamily = exports.removeFromOperatorFamily = function removeFromOperatorFamily(typeShorthands) {
  return function (operatorFamilyName, indexMethod, operatorList) {
    return `ALTER OPERATOR FAMILY ${(0, _utils.schemalize)(operatorFamilyName)} USING ${indexMethod} DROP
  ${operatorList.map(operatorMap(typeShorthands)).join(',\n  ')};`;
  };
};

var addToOperatorFamily = exports.addToOperatorFamily = function addToOperatorFamily(typeShorthands) {
  var _add = function _add(operatorFamilyName, indexMethod, operatorList) {
    return `ALTER OPERATOR FAMILY ${(0, _utils.schemalize)(operatorFamilyName)} USING ${indexMethod} ADD
    ${operatorList.map(operatorMap(typeShorthands)).join(',\n  ')};`;
  };
  _add.reverse = removeFromOperatorFamily(typeShorthands);
  return _add;
};

var renameOperatorFamily = exports.renameOperatorFamily = function renameOperatorFamily(oldOperatorFamilyName, indexMethod, newOperatorFamilyName) {
  return (// eslint-disable-line max-len
    `ALTER OPERATOR FAMILY ${(0, _utils.schemalize)(oldOperatorFamilyName)} USING ${indexMethod} RENAME TO ${(0, _utils.schemalize)(newOperatorFamilyName)};`
  );
};

var undoRenameOperatorFamily = function undoRenameOperatorFamily(oldOperatorFamilyName, indexMethod, newOperatorFamilyName) {
  return (// eslint-disable-line max-len
    renameOperatorFamily(newOperatorFamilyName, indexMethod, oldOperatorFamilyName)
  );
};

var dropOperatorClass = exports.dropOperatorClass = function dropOperatorClass(operatorClassName, indexMethod) {
  var _ref3 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      ifExists = _ref3.ifExists,
      cascade = _ref3.cascade;

  return (// eslint-disable-line max-len
    `DROP OPERATOR CLASS ${ifExists ? ' IF EXISTS' : ''} ${(0, _utils.schemalize)(operatorClassName)} USING ${indexMethod}${cascade ? ' CASCADE' : ''};`
  );
};

var createOperatorClass = exports.createOperatorClass = function createOperatorClass(typeShorthands) {
  var _create = function _create(operatorClassName, type, indexMethod, operatorList, options) {
    var isDefault = options.default,
        family = options.family;

    return `CREATE OPERATOR CLASS ${(0, _utils.schemalize)(operatorClassName)}${isDefault ? ' DEFAULT' : ''} FOR TYPE ${(0, _utils.schemalize)((0, _utils.applyType)(type).type)} USING ${(0, _utils.schemalize)(indexMethod)} ${family ? ` FAMILY ${family}` : ''} AS
  ${operatorList.map(operatorMap(typeShorthands)).join(',\n  ')};`;
  };
  _create.reverse = function (operatorClassName, type, indexMethod, operatorList, options) {
    return dropOperatorClass(operatorClassName, indexMethod, options);
  };
  return _create;
};

var renameOperatorClass = exports.renameOperatorClass = function renameOperatorClass(oldOperatorClassName, indexMethod, newOperatorClassName) {
  return (// eslint-disable-line max-len
    `ALTER OPERATOR CLASS ${(0, _utils.schemalize)(oldOperatorClassName)} USING ${indexMethod} RENAME TO ${(0, _utils.schemalize)(newOperatorClassName)};`
  );
};

var undoRenameOperatorClass = function undoRenameOperatorClass(oldOperatorClassName, indexMethod, newOperatorClassName) {
  return (// eslint-disable-line max-len
    renameOperatorClass(newOperatorClassName, indexMethod, oldOperatorClassName)
  );
};

// setup reverse functions
createOperator.reverse = dropOperator;
createOperatorFamily.reverse = dropOperatorFamily;
renameOperatorFamily.reverse = undoRenameOperatorFamily;
renameOperatorClass.reverse = undoRenameOperatorClass;