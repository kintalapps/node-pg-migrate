'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rename = exports.create = exports.drop = undefined;

var _utils = require('../utils');

var drop = exports.drop = function drop(typeShorthands) {
  return function (functionName) {
    var functionParams = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        ifExists = _ref.ifExists,
        cascade = _ref.cascade;

    return _utils.template`DROP FUNCTION${ifExists ? ' IF EXISTS' : ''} "${functionName}"${(0, _utils.formatParams)(functionParams, typeShorthands)}${cascade ? ' CASCADE' : ''};`;
  };
};

var create = exports.create = function create(typeShorthands) {
  var _create = function _create(functionName) {
    var functionParams = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var functionOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var definition = arguments[3];
    var replace = functionOptions.replace,
        _functionOptions$retu = functionOptions.returns,
        returns = _functionOptions$retu === undefined ? 'void' : _functionOptions$retu,
        language = functionOptions.language,
        window = functionOptions.window,
        _functionOptions$beha = functionOptions.behavior,
        behavior = _functionOptions$beha === undefined ? 'VOLATILE' : _functionOptions$beha,
        onNull = functionOptions.onNull,
        _functionOptions$para = functionOptions.parallel,
        parallel = _functionOptions$para === undefined ? 'UNSAFE' : _functionOptions$para;

    var options = [];
    if (behavior) {
      options.push(behavior);
    }
    if (language) {
      options.push(`LANGUAGE ${language}`);
    } else {
      throw new Error(`Language for function ${functionName} have to be specified`);
    }
    if (window) {
      options.push('WINDOW');
    }
    if (onNull) {
      options.push('RETURNS NULL ON NULL INPUT');
    }
    if (parallel) {
      options.push(`PARALLEL ${parallel}`);
    }

    return _utils.template`CREATE${replace ? ' OR REPLACE' : ''} FUNCTION "${functionName}"${(0, _utils.formatParams)(functionParams, typeShorthands)}
  RETURNS ${returns}
  AS ${(0, _utils.escapeValue)(definition)}
  ${options.join('\n  ')};`;
  };

  _create.reverse = drop(typeShorthands);

  return _create;
};

var rename = exports.rename = function rename(typeShorthands) {
  var _rename = function _rename(oldFunctionName) {
    var functionParams = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var newFunctionName = arguments[2];
    return _utils.template`ALTER FUNCTION "${oldFunctionName}"${(0, _utils.formatParams)(functionParams, typeShorthands)} RENAME TO "${newFunctionName}";`;
  };

  _rename.reverse = function (oldFunctionName, functionParams, newFunctionName) {
    return _rename(newFunctionName, functionParams, oldFunctionName);
  };

  return _rename;
};