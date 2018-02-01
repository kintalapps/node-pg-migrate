'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// This is used to create unescaped strings
// exposed in the migrations via pgm.func
var PgLiteral = exports.PgLiteral = function () {
  _createClass(PgLiteral, null, [{
    key: 'create',
    value: function create(str) {
      return new PgLiteral(str);
    }
  }]);

  function PgLiteral(str) {
    _classCallCheck(this, PgLiteral);

    this._str = str;
  }

  _createClass(PgLiteral, [{
    key: 'toString',
    value: function toString() {
      return this._str;
    }
  }]);

  return PgLiteral;
}();

var schemalize = exports.schemalize = function schemalize(v) {
  if (typeof v === 'object') {
    var schema = v.schema,
        name = v.name;

    return (schema ? `${schema}"."` : '') + name;
  }
  return v;
};

var opSchemalize = exports.opSchemalize = function opSchemalize(v) {
  if (typeof v === 'object') {
    var schema = v.schema,
        name = v.name;

    return schema ? `OPERATOR(${schema}.${name})` : name;
  }
  return v;
};

var t = exports.t = function t(s, d) {
  return Object.keys(d || {}).reduce(function (str, p) {
    return str.replace(new RegExp(`{${p}}`, 'g'), schemalize(d[p]));
  }, s);
};

var escapeValue = exports.escapeValue = function escapeValue(val) {
  if (val === null) {
    return 'NULL';
  }
  if (typeof val === 'boolean') {
    return val.toString();
  }
  if (typeof val === 'string') {
    var dollars = void 0;
    var index = 0;
    do {
      index += 1;
      dollars = `$pg${index}$`;
    } while (val.indexOf(dollars) >= 0);
    return `${dollars}${val}${dollars}`;
  }
  if (typeof val === 'number') {
    return val;
  }
  if (Array.isArray(val)) {
    return `ARRAY[${val.map(escapeValue).join(',').replace(/ARRAY/g, '')}]`;
  }
  if (val instanceof PgLiteral) {
    return val.toString();
  }
  return '';
};

var template = exports.template = function template(strings) {
  for (var _len = arguments.length, keys = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    keys[_key - 1] = arguments[_key];
  }

  var result = [strings[0]];
  keys.forEach(function (key, i) {
    result.push(schemalize(key), strings[i + 1]);
  });
  return result.join('');
};

var opTemplate = exports.opTemplate = function opTemplate(strings) {
  for (var _len2 = arguments.length, keys = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    keys[_key2 - 1] = arguments[_key2];
  }

  var result = [strings[0]];
  keys.forEach(function (key, i) {
    result.push(opSchemalize(key), strings[i + 1]);
  });
  return result.join('');
};

var getMigrationTableSchema = exports.getMigrationTableSchema = function getMigrationTableSchema(options) {
  return options.migrations_schema || options.schema || 'public';
};

var finallyPromise = exports.finallyPromise = function finallyPromise(func) {
  return [func, function (err) {
    var errHandler = function errHandler(innerErr) {
      console.error(innerErr.stack ? innerErr.stack : innerErr);
      throw err;
    };
    try {
      return Promise.resolve(func()).then(function () {
        throw err;
      }, errHandler);
    } catch (innerErr) {
      return errHandler(innerErr);
    }
  }];
};

var quote = exports.quote = function quote(array) {
  return array.map(function (item) {
    return template`"${item}"`;
  });
};

var typeAdapters = {
  int: 'integer',
  string: 'text',
  float: 'real',
  double: 'double precision',
  datetime: 'timestamp',
  bool: 'boolean'
};

var defaultTypeShorthands = {
  id: { type: 'serial', primaryKey: true } // convenience type for serial primary keys
};

// some convenience adapters -- see above
var applyTypeAdapters = exports.applyTypeAdapters = function applyTypeAdapters(type) {
  return typeAdapters[type] ? typeAdapters[type] : type;
};

var applyType = exports.applyType = function applyType(type) {
  var extendingTypeShorthands = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var typeShorthands = _extends({}, defaultTypeShorthands, extendingTypeShorthands);
  var options = type;
  if (typeof type === 'string') {
    options = typeShorthands[type] // eslint-disable-line no-param-reassign
    ? typeShorthands[type] : { type };
  }

  options.type = applyTypeAdapters(options.type); // eslint-disable-line no-param-reassign

  return options;
};

var formatParam = function formatParam(typeShorthands) {
  return function (param) {
    var _applyType = applyType(param, typeShorthands),
        mode = _applyType.mode,
        name = _applyType.name,
        type = _applyType.type,
        defaultValue = _applyType.default;

    var options = [];
    if (mode) {
      options.push(mode);
    }
    if (name) {
      options.push(schemalize(name));
    }
    if (type) {
      options.push(type);
    }
    if (defaultValue) {
      options.push(`DEFAULT ${escapeValue(defaultValue)}`);
    }
    return options.join(' ');
  };
};

var formatParams = exports.formatParams = function formatParams() {
  var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var typeShorthands = arguments[1];
  return `(${params.map(formatParam(typeShorthands)).join(', ')})`;
};