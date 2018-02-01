'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unlockRunner = exports.PgLiteral = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _utils = require('./utils');

Object.defineProperty(exports, 'PgLiteral', {
  enumerable: true,
  get: function get() {
    return _utils.PgLiteral;
  }
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _db = require('./db');

var _db2 = _interopRequireDefault(_db);

var _migration = require('./migration');

var _migration2 = _interopRequireDefault(_migration);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var readdir = function readdir() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return new Promise(function (resolve, reject) {
    return _fs2.default.readdir.apply(_fs2.default, args.concat([function (err, files) {
      return err ? reject(err) : resolve(files);
    }]));
  });
};
var nameColumn = 'name';
var runOnColumn = 'run_on';

var loadMigrationFiles = function loadMigrationFiles(db, options) {
  return readdir(`${options.dir}/`).then(function (files) {
    return Promise.all(files.map(function (file) {
      return new Promise(function (resolve, reject) {
        return _fs2.default.lstat(`${options.dir}/${file}`, function (err, stats) {
          return err ? reject(err) : resolve(stats.isFile() ? file : null);
        });
      });
    }));
  }).then(function (files) {
    var filter = new RegExp(`^(${options.ignorePattern})$`);
    return files.filter(function (i) {
      return i && !filter.test(i);
    }).map(function (file) {
      var filePath = `${options.dir}/${file}`;
      // eslint-disable-next-line global-require,import/no-dynamic-require
      var actions = require(_path2.default.relative(__dirname, filePath));
      return new _migration2.default(db, filePath, actions, options);
    }).sort(function (m1, m2) {
      return m1.name < m2.name // eslint-disable-line no-nested-ternary
      ? -1 : m1.name > m2.name ? 1 : 0;
    });
  }).catch(function (err) {
    throw new Error(`Can't get migration files: ${err.stack}`);
  });
};

var lock = function lock(db, options) {
  var schema = (0, _utils.getMigrationTableSchema)(options);
  var lockName = _crypto2.default.randomBytes(30).toString('base64');
  var getCurrentLockName = function getCurrentLockName() {
    return db.select(`SELECT obj_description(c.oid) as "comment"
                FROM pg_class c join pg_namespace n ON (c.relnamespace = n.oid)
                WHERE c.relname = '${options.migrations_table}' and c.relkind = 'r' and n.nspname = '${schema}'`).then(function (rows) {
      if (rows.length > 1) {
        throw new Error('More then one migration table');
      } else if (rows.length === 1) {
        return rows[0].comment;
      }
      return null;
    });
  };

  return db.query('BEGIN').then(function () {
    return db.query(`LOCK "${schema}"."${options.migrations_table}" IN ACCESS EXCLUSIVE MODE`);
  }).then(getCurrentLockName).then(function (currentLockName) {
    if (currentLockName) {
      throw new Error('Another migration is already running');
    }
  }).then(function () {
    return db.query(`COMMENT ON TABLE "${schema}"."${options.migrations_table}" IS '${lockName}'`);
  }).then(function () {
    return db.query('COMMIT');
  });
};

var unlock = function unlock(db, options) {
  var schema = (0, _utils.getMigrationTableSchema)(options);
  return db.query(`COMMENT ON TABLE "${schema}"."${options.migrations_table}" IS NULL`);
};

var getRunMigrations = function getRunMigrations(db, options) {
  var schema = (0, _utils.getMigrationTableSchema)(options);
  return db.select(`SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema}' AND table_name = '${options.migrations_table}'`).then(function (migrationTables) {
    return migrationTables && migrationTables.length === 1 || db.query(`CREATE TABLE "${schema}"."${options.migrations_table}" ( id SERIAL, ${nameColumn} varchar(255) NOT NULL, ${runOnColumn} timestamp NOT NULL)`);
  }).then(function () {
    return !options.noLock ? lock(db, options) : null;
  }).then(function () {
    return !options.noLock ? db.addBeforeCloseListener(function () {
      return unlock(db, options);
    }) : null;
  }).then(function () {
    return db.column(`SELECT ${nameColumn} FROM "${schema}"."${options.migrations_table}" ORDER BY ${runOnColumn}`, nameColumn);
  }).catch(function (err) {
    throw new Error(`Unable to fetch migrations: ${err.stack}`);
  });
};

var getMigrationsToRun = function getMigrationsToRun(options, runNames, migrations) {
  if (options.direction === 'down') {
    var toRun = runNames.filter(function (migrationName) {
      return !options.file || options.file === migrationName;
    }).map(function (migrationName) {
      return migrations.find(function (_ref) {
        var name = _ref.name;
        return name === migrationName;
      }) || migrationName;
    }).slice(-Math.abs(options.count || 1)).reverse();
    var deletedMigrations = toRun.filter(function (migration) {
      return typeof migration === 'string';
    });
    if (deletedMigrations.length) {
      throw new Error(`Definitions of migrations ${deletedMigrations.join(', ')} have been deleted.`);
    }
    return toRun;
  }
  return migrations.filter(function (_ref2) {
    var name = _ref2.name;
    return runNames.indexOf(name) < 0 && (!options.file || options.file === name);
  }).slice(0, Math.abs(options.count || Infinity));
};

exports.default = function (options) {
  var _Promise$resolve$then;

  var db = (0, _db2.default)(options.database_url);
  return (_Promise$resolve$then = Promise.resolve().then(function () {
    return options.schema ? db.query(`SET SCHEMA '${options.schema}'`) : null;
  }).then(function () {
    return Promise.all([loadMigrationFiles(db, options), getRunMigrations(db, options)]);
  }).then(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        migrations = _ref4[0],
        runNames = _ref4[1];

    if (options.checkOrder) {
      var len = Math.min(runNames.length, migrations.length);
      for (var i = 0; i < len; i += 1) {
        if (runNames[i] !== migrations[i].name) {
          throw new Error(`Not run migration ${migrations[i].name} is preceding already run migration ${runNames[i]}`);
        }
      }
    }

    var toRun = getMigrationsToRun(options, runNames, migrations);

    if (!toRun.length) {
      console.log('No migrations to run!');
      return null;
    }

    // TODO: add some fancy colors to logging
    console.log('> Migrating files:');
    toRun.forEach(function (m) {
      console.log(`> - ${m.name}`);
    });

    return toRun.reduce(function (promise, migration) {
      return promise.then(function () {
        return options.direction === 'up' ? migration.applyUp() : migration.applyDown();
      });
    }, Promise.resolve());
  }).catch(function (e) {
    var _db$query;

    console.log('> Rolling back attempted migration ...');
    return (_db$query = db.query('ROLLBACK')).then.apply(_db$query, _toConsumableArray((0, _utils.finallyPromise)(function () {
      throw e;
    })));
  })).then.apply(_Promise$resolve$then, _toConsumableArray((0, _utils.finallyPromise)(db.close)));
};

var unlockRunner = exports.unlockRunner = function unlockRunner(options) {
  var _unlock;

  var db = (0, _db2.default)(options.database_url);
  return (_unlock = unlock(db, options)).then.apply(_unlock, _toConsumableArray((0, _utils.finallyPromise)(db.close)));
};