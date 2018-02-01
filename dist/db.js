'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// or native libpq bindings
// import pg from 'pg/native';

exports.default = function (connectionString) {
  var log = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : console.error;

  var client = new _pg2.default.Client(connectionString);
  var clientActive = false;
  var beforeCloseListeners = [];

  var createConnection = function createConnection() {
    return new Promise(function (resolve, reject) {
      return clientActive ? resolve() : client.connect(function (err) {
        if (err) {
          log('could not connect to postgres', err);
          reject(err);
        } else {
          clientActive = true;
          resolve();
        }
      });
    });
  };

  var query = function query(string) {
    return createConnection().then(function () {
      return new Promise(function (resolve, reject) {
        return client.query(string, function (err, result) {
          return err ? reject(err) : resolve(result);
        });
      });
    }).catch(function (err) {
      var message = err.message,
          position = err.position;

      if (message && position >= 1) {
        var endLineWrapIndexOf = string.indexOf('\n', position);
        var endLineWrapPos = endLineWrapIndexOf >= 0 ? endLineWrapIndexOf : string.length;
        var stringStart = string.substring(0, endLineWrapPos);
        var stringEnd = string.substr(endLineWrapPos);
        var startLineWrapPos = stringStart.lastIndexOf('\n') + 1;
        var padding = ' '.repeat(position - startLineWrapPos - 1);
        log(`Error executing:
${stringStart}
${padding}^^^^${stringEnd}

${message}
`);
      } else {
        log(`Error executing:
${string}
${err}
`);
      }
      throw err;
    });
  };

  var select = function select(string) {
    return query(string).then(function (result) {
      return result && result.rows;
    });
  };
  var column = function column(string, columnName) {
    return select(string).then(function (rows) {
      return rows.map(function (r) {
        return r[columnName];
      });
    });
  };

  return {
    query,
    select,
    column,

    addBeforeCloseListener: function addBeforeCloseListener(listener) {
      return beforeCloseListeners.push(listener);
    },

    close: function close() {
      return beforeCloseListeners.reduce(function (promise, listener) {
        return promise.then(listener).catch(function (err) {
          return log(err.stack || err);
        });
      }, Promise.resolve()).then(function () {
        clientActive = false;
        if (client) {
          client.end();
        }
      });
    }
  };
}; /*
    This file just manages the database connection and provides a query method
    */