'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      A new Migration is instantiated for each migration file.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      It is responsible for storing the name of the file and knowing how to execute
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      the up and down migrations defined in the file.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _migrationBuilder = require('./migration-builder');

var _migrationBuilder2 = _interopRequireDefault(_migrationBuilder);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Migration = function () {
  _createClass(Migration, null, [{
    key: 'create',

    // class method that creates a new migration file by cloning the migration template
    value: function create(name, directory, language) {
      // ensure the migrations directory exists
      _mkdirp2.default.sync(directory);

      // file name looks like migrations/1391877300255_migration-title.js
      var newFile = _util2.default.format(`%s/%d_%s.${language}`, directory, +new Date(), name);

      // copy the default migration template to the new file location
      _fs2.default.createReadStream(_path2.default.resolve(__dirname, `./migration-template.${language}`)).pipe(_fs2.default.createWriteStream(newFile));

      return new Migration(newFile, directory);
    }
  }]);

  function Migration(db, migrationPath) {
    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        up = _ref.up,
        down = _ref.down;

    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var log = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : console.log;

    _classCallCheck(this, Migration);

    this.db = db;
    this.path = migrationPath;
    this.name = migrationPath.split('/').pop().replace(/\.js$/, '');
    this.up = up;
    this.down = down;
    this.options = options;
    this.log = log;
  }

  _createClass(Migration, [{
    key: '_apply',
    value: function _apply(action, pgm) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        if (action.length === 2) {
          action(pgm, resolve);
        } else {
          var result = action(pgm);
          // result conforms to Promises/A+ spec
          if (typeof result === 'object' && typeof result.then === 'function') {
            result.then(resolve).catch(reject);
          } else {
            resolve();
          }
        }
      }).then(function () {
        var sqlSteps = pgm.getSqlSteps();

        var schema = (0, _utils.getMigrationTableSchema)(_this.options);
        switch (action) {
          case _this.down:
            _this.log(`### MIGRATION ${_this.name} (DOWN) ###`);
            sqlSteps.push(`DELETE FROM "${schema}"."${_this.options.migrations_table}" WHERE name='${_this.name}';`);
            break;
          case _this.up:
            _this.log(`### MIGRATION ${_this.name} (UP) ###`);
            sqlSteps.push(`INSERT INTO "${schema}"."${_this.options.migrations_table}" (name, run_on) VALUES ('${_this.name}', NOW());`);
            break;
          default:
            throw new Error('Unknown direction');
        }

        if (pgm.isUsingTransaction()) {
          // wrap in a transaction, combine into one sql statement
          sqlSteps.unshift('BEGIN;');
          sqlSteps.push('COMMIT;');
        } else {
          _this.log('#> WARNING: This migration is not wrapped in a transaction! <');
        }

        _this.log(`${sqlSteps.join('\n')}\n\n`);

        return sqlSteps.reduce(function (promise, sql) {
          return promise.then(function () {
            return _this.options.dryRun || _this.db.query(sql);
          });
        }, Promise.resolve());
      });
    }
  }, {
    key: 'applyUp',
    value: function applyUp() {
      var pgm = new _migrationBuilder2.default(this.options);

      return this._apply(this.up, pgm);
    }
  }, {
    key: 'applyDown',
    value: function applyDown() {
      var pgm = new _migrationBuilder2.default(this.options);

      if (this.down === false) {
        return Promise.reject(new Error(`User has disabled down migration on file: ${this.name}`));
      } else if (this.down === undefined) {
        // automatically infer the down migration by running the up migration in reverse mode...
        pgm.enableReverseMode();
        this.down = this.up;
      }

      return this._apply(this.down, pgm);
    }
  }]);

  return Migration;
}();

exports.default = Migration;