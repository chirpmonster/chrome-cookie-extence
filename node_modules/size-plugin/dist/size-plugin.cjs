var path = require('path');
var promisify = require('util.promisify');
var globPromise = require('glob');
var minimatch = require('minimatch');
var gzipSize = require('gzip-size');
var chalk = require('chalk');
var prettyBytes = require('pretty-bytes');
var escapeRegExp = require('escape-string-regexp');
var ciEnv = require('ci-env');
var axios = require('axios');
var fs = require('fs');
var constants = require('constants');
var require$$0 = require('stream');
var util = require('util');
var assert = require('assert');
var os = require('os');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var promisify__default = /*#__PURE__*/_interopDefaultLegacy(promisify);
var globPromise__default = /*#__PURE__*/_interopDefaultLegacy(globPromise);
var minimatch__default = /*#__PURE__*/_interopDefaultLegacy(minimatch);
var gzipSize__default = /*#__PURE__*/_interopDefaultLegacy(gzipSize);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var prettyBytes__default = /*#__PURE__*/_interopDefaultLegacy(prettyBytes);
var escapeRegExp__default = /*#__PURE__*/_interopDefaultLegacy(escapeRegExp);
var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var constants__default = /*#__PURE__*/_interopDefaultLegacy(constants);
var require$$0__default = /*#__PURE__*/_interopDefaultLegacy(require$$0);
var util__default = /*#__PURE__*/_interopDefaultLegacy(util);
var assert__default = /*#__PURE__*/_interopDefaultLegacy(assert);
var os__default = /*#__PURE__*/_interopDefaultLegacy(os);

/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
function toMap(names, values) {
  return names.reduce((map, name, i) => {
    map[name] = values[i];
    return map;
  }, {});
}
function dedupe(item, index, arr) {
  return arr.indexOf(item) === index;
}
function toFileMap(files) {
  return files.reduce((result, file) => {
    if (file.size) {
      // excluding files with size 0
      result[file.filename] = file.size;
    }

    return result;
  }, {});
}

const SIZE_STORE_ENDPOINT = process.env.SIZE_STORE_ENDPOINT || 'https://size-plugin-store.now.sh'; // TODO: add option to turn off publishing of sizes.

async function publishDiff(diff, filename) {
  if (process.env.NODE_ENV !== 'test' && ciEnv.ci && ciEnv.event == 'pull_request') {
    try {
      const params = {
        ci: ciEnv.ci,
        repo: ciEnv.repo,
        branch: ciEnv.branch,
        sha: ciEnv.sha,
        pull_request_number: ciEnv.pull_request_number,
        diff,
        filename
      };
      await axios__default['default'].post(`${SIZE_STORE_ENDPOINT}/diff`, params);
    } catch (error) {
      console.error('error: while publishing diff', error);
    }
  }
}
async function publishSizes(size, filename) {
  // TODO: read allowed branch from configuration
  if (process.env.NODE_ENV !== 'test' && ciEnv.ci && ciEnv.event == 'push' && ciEnv.branch === 'master') {
    try {
      const params = {
        ci: ciEnv.ci,
        repo: ciEnv.repo,
        branch: ciEnv.branch,
        sha: ciEnv.sha,
        pull_request_number: ciEnv.pull_request_number,
        size,
        filename
      };
      await axios__default['default'].post(`${SIZE_STORE_ENDPOINT}/size`, params);
    } catch (error) {
      console.error('error: while publishing sizes', error);
    }
  }
}

function createCommonjsModule(fn) {
  var module = { exports: {} };
	return fn(module, module.exports), module.exports;
}

var fromCallback = function (fn) {
  return Object.defineProperty(function () {
    if (typeof arguments[arguments.length - 1] === 'function') fn.apply(this, arguments);
    else {
      return new Promise((resolve, reject) => {
        arguments[arguments.length] = (err, res) => {
          if (err) return reject(err)
          resolve(res);
        };
        arguments.length++;
        fn.apply(this, arguments);
      })
    }
  }, 'name', { value: fn.name })
};

var fromPromise = function (fn) {
  return Object.defineProperty(function () {
    const cb = arguments[arguments.length - 1];
    if (typeof cb !== 'function') return fn.apply(this, arguments)
    else fn.apply(this, arguments).then(r => cb(null, r), cb);
  }, 'name', { value: fn.name })
};

var universalify = {
	fromCallback: fromCallback,
	fromPromise: fromPromise
};

var fs_1 = clone(fs__default['default']);

function clone (obj) {
  if (obj === null || typeof obj !== 'object')
    return obj

  if (obj instanceof Object)
    var copy = { __proto__: obj.__proto__ };
  else
    var copy = Object.create(null);

  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
  });

  return copy
}

var origCwd = process.cwd;
var cwd = null;

var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;

process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process);
  return cwd
};
try {
  process.cwd();
} catch (er) {}

var chdir = process.chdir;
process.chdir = function(d) {
  cwd = null;
  chdir.call(process, d);
};

var polyfills = patch;

function patch (fs) {
  // (re-)implement some things that are known busted or missing.

  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (constants__default['default'].hasOwnProperty('O_SYMLINK') &&
      process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs);
  }

  // lutimes implementation, or no-op
  if (!fs.lutimes) {
    patchLutimes(fs);
  }

  // https://github.com/isaacs/node-graceful-fs/issues/4
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.

  fs.chown = chownFix(fs.chown);
  fs.fchown = chownFix(fs.fchown);
  fs.lchown = chownFix(fs.lchown);

  fs.chmod = chmodFix(fs.chmod);
  fs.fchmod = chmodFix(fs.fchmod);
  fs.lchmod = chmodFix(fs.lchmod);

  fs.chownSync = chownFixSync(fs.chownSync);
  fs.fchownSync = chownFixSync(fs.fchownSync);
  fs.lchownSync = chownFixSync(fs.lchownSync);

  fs.chmodSync = chmodFixSync(fs.chmodSync);
  fs.fchmodSync = chmodFixSync(fs.fchmodSync);
  fs.lchmodSync = chmodFixSync(fs.lchmodSync);

  fs.stat = statFix(fs.stat);
  fs.fstat = statFix(fs.fstat);
  fs.lstat = statFix(fs.lstat);

  fs.statSync = statFixSync(fs.statSync);
  fs.fstatSync = statFixSync(fs.fstatSync);
  fs.lstatSync = statFixSync(fs.lstatSync);

  // if lchmod/lchown do not exist, then make them no-ops
  if (!fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchmodSync = function () {};
  }
  if (!fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchownSync = function () {};
  }

  // on Windows, A/V software can lock the directory, causing this
  // to fail with an EACCES or EPERM if the directory contains newly
  // created files.  Try again on failure, for up to 60 seconds.

  // Set the timeout this long because some Windows Anti-Virus, such as Parity
  // bit9, may lock files for up to a minute, causing npm package install
  // failures. Also, take care to yield the scheduler. Windows scheduling gives
  // CPU to a busy looping process, which can cause the program causing the lock
  // contention to be starved of CPU by node, so the contention doesn't resolve.
  if (platform === "win32") {
    fs.rename = (function (fs$rename) { return function (from, to, cb) {
      var start = Date.now();
      var backoff = 0;
      fs$rename(from, to, function CB (er) {
        if (er
            && (er.code === "EACCES" || er.code === "EPERM")
            && Date.now() - start < 60000) {
          setTimeout(function() {
            fs.stat(to, function (stater, st) {
              if (stater && stater.code === "ENOENT")
                fs$rename(from, to, CB);
              else
                cb(er);
            });
          }, backoff);
          if (backoff < 100)
            backoff += 10;
          return;
        }
        if (cb) cb(er);
      });
    }})(fs.rename);
  }

  // if read() returns EAGAIN, then just try it again.
  fs.read = (function (fs$read) { return function (fd, buffer, offset, length, position, callback_) {
    var callback;
    if (callback_ && typeof callback_ === 'function') {
      var eagCounter = 0;
      callback = function (er, _, __) {
        if (er && er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++;
          return fs$read.call(fs, fd, buffer, offset, length, position, callback)
        }
        callback_.apply(this, arguments);
      };
    }
    return fs$read.call(fs, fd, buffer, offset, length, position, callback)
  }})(fs.read);

  fs.readSync = (function (fs$readSync) { return function (fd, buffer, offset, length, position) {
    var eagCounter = 0;
    while (true) {
      try {
        return fs$readSync.call(fs, fd, buffer, offset, length, position)
      } catch (er) {
        if (er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++;
          continue
        }
        throw er
      }
    }
  }})(fs.readSync);
}

function patchLchmod (fs) {
  fs.lchmod = function (path, mode, callback) {
    fs.open( path
           , constants__default['default'].O_WRONLY | constants__default['default'].O_SYMLINK
           , mode
           , function (err, fd) {
      if (err) {
        if (callback) callback(err);
        return
      }
      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      fs.fchmod(fd, mode, function (err) {
        fs.close(fd, function(err2) {
          if (callback) callback(err || err2);
        });
      });
    });
  };

  fs.lchmodSync = function (path, mode) {
    var fd = fs.openSync(path, constants__default['default'].O_WRONLY | constants__default['default'].O_SYMLINK, mode);

    // prefer to return the chmod error, if one occurs,
    // but still try to close, and report closing errors if they occur.
    var threw = true;
    var ret;
    try {
      ret = fs.fchmodSync(fd, mode);
      threw = false;
    } finally {
      if (threw) {
        try {
          fs.closeSync(fd);
        } catch (er) {}
      } else {
        fs.closeSync(fd);
      }
    }
    return ret
  };
}

function patchLutimes (fs) {
  if (constants__default['default'].hasOwnProperty("O_SYMLINK")) {
    fs.lutimes = function (path, at, mt, cb) {
      fs.open(path, constants__default['default'].O_SYMLINK, function (er, fd) {
        if (er) {
          if (cb) cb(er);
          return
        }
        fs.futimes(fd, at, mt, function (er) {
          fs.close(fd, function (er2) {
            if (cb) cb(er || er2);
          });
        });
      });
    };

    fs.lutimesSync = function (path, at, mt) {
      var fd = fs.openSync(path, constants__default['default'].O_SYMLINK);
      var ret;
      var threw = true;
      try {
        ret = fs.futimesSync(fd, at, mt);
        threw = false;
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd);
          } catch (er) {}
        } else {
          fs.closeSync(fd);
        }
      }
      return ret
    };

  } else {
    fs.lutimes = function (_a, _b, _c, cb) { if (cb) process.nextTick(cb); };
    fs.lutimesSync = function () {};
  }
}

function chmodFix (orig) {
  if (!orig) return orig
  return function (target, mode, cb) {
    return orig.call(fs_1, target, mode, function (er) {
      if (chownErOk(er)) er = null;
      if (cb) cb.apply(this, arguments);
    })
  }
}

function chmodFixSync (orig) {
  if (!orig) return orig
  return function (target, mode) {
    try {
      return orig.call(fs_1, target, mode)
    } catch (er) {
      if (!chownErOk(er)) throw er
    }
  }
}


function chownFix (orig) {
  if (!orig) return orig
  return function (target, uid, gid, cb) {
    return orig.call(fs_1, target, uid, gid, function (er) {
      if (chownErOk(er)) er = null;
      if (cb) cb.apply(this, arguments);
    })
  }
}

function chownFixSync (orig) {
  if (!orig) return orig
  return function (target, uid, gid) {
    try {
      return orig.call(fs_1, target, uid, gid)
    } catch (er) {
      if (!chownErOk(er)) throw er
    }
  }
}


function statFix (orig) {
  if (!orig) return orig
  // Older versions of Node erroneously returned signed integers for
  // uid + gid.
  return function (target, cb) {
    return orig.call(fs_1, target, function (er, stats) {
      if (!stats) return cb.apply(this, arguments)
      if (stats.uid < 0) stats.uid += 0x100000000;
      if (stats.gid < 0) stats.gid += 0x100000000;
      if (cb) cb.apply(this, arguments);
    })
  }
}

function statFixSync (orig) {
  if (!orig) return orig
  // Older versions of Node erroneously returned signed integers for
  // uid + gid.
  return function (target) {
    var stats = orig.call(fs_1, target);
    if (stats.uid < 0) stats.uid += 0x100000000;
    if (stats.gid < 0) stats.gid += 0x100000000;
    return stats;
  }
}

// ENOSYS means that the fs doesn't support the op. Just ignore
// that, because it doesn't matter.
//
// if there's no getuid, or if getuid() is something other
// than 0, and the error is EINVAL or EPERM, then just ignore
// it.
//
// This specific case is a silent failure in cp, install, tar,
// and most other unix tools that manage permissions.
//
// When running as root, or if other types of errors are
// encountered, then it's strict.
function chownErOk (er) {
  if (!er)
    return true

  if (er.code === "ENOSYS")
    return true

  var nonroot = !process.getuid || process.getuid() !== 0;
  if (nonroot) {
    if (er.code === "EINVAL" || er.code === "EPERM")
      return true
  }

  return false
}

var Stream = require$$0__default['default'].Stream;

var legacyStreams = legacy;

function legacy (fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  }

  function ReadStream (path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);

    Stream.call(this);

    var self = this;

    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;

    this.flags = 'r';
    this.mode = 438; /*=0666*/
    this.bufferSize = 64 * 1024;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.encoding) this.setEncoding(this.encoding);

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }

      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }

      this.pos = this.start;
    }

    if (this.fd !== null) {
      process.nextTick(function() {
        self._read();
      });
      return;
    }

    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }

      self.fd = fd;
      self.emit('open', fd);
      self._read();
    });
  }

  function WriteStream (path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);

    Stream.call(this);

    this.path = path;
    this.fd = null;
    this.writable = true;

    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438; /*=0666*/
    this.bytesWritten = 0;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }

      this.pos = this.start;
    }

    this.busy = false;
    this._queue = [];

    if (this.fd === null) {
      this._open = fs.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
      this.flush();
    }
  }
}

var gracefulFs = createCommonjsModule(function (module) {
var queue = [];



function noop () {}

var debug = noop;
if (util__default['default'].debuglog)
  debug = util__default['default'].debuglog('gfs4');
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
  debug = function() {
    var m = util__default['default'].format.apply(util__default['default'], arguments);
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ');
    console.error(m);
  };

if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
  process.on('exit', function() {
    debug(queue);
    assert__default['default'].equal(queue.length, 0);
  });
}

module.exports = patch(fs_1);
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH) {
  module.exports = patch(fs__default['default']);
}

// Always patch fs.close/closeSync, because we want to
// retry() whenever a close happens *anywhere* in the program.
// This is essential when multiple graceful-fs instances are
// in play at the same time.
module.exports.close =
fs__default['default'].close = (function (fs$close) { return function (fd, cb) {
  return fs$close.call(fs__default['default'], fd, function (err) {
    if (!err)
      retry();

    if (typeof cb === 'function')
      cb.apply(this, arguments);
  })
}})(fs__default['default'].close);

module.exports.closeSync =
fs__default['default'].closeSync = (function (fs$closeSync) { return function (fd) {
  // Note that graceful-fs also retries when fs.closeSync() fails.
  // Looks like a bug to me, although it's probably a harmless one.
  var rval = fs$closeSync.apply(fs__default['default'], arguments);
  retry();
  return rval
}})(fs__default['default'].closeSync);

function patch (fs) {
  // Everything that references the open() function needs to be in here
  polyfills(fs);
  fs.gracefulify = patch;
  fs.FileReadStream = ReadStream;  // Legacy name.
  fs.FileWriteStream = WriteStream;  // Legacy name.
  fs.createReadStream = createReadStream;
  fs.createWriteStream = createWriteStream;
  var fs$readFile = fs.readFile;
  fs.readFile = readFile;
  function readFile (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$readFile(path, options, cb)

    function go$readFile (path, options, cb) {
      return fs$readFile(path, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$readFile, [path, options, cb]]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
          retry();
        }
      })
    }
  }

  var fs$writeFile = fs.writeFile;
  fs.writeFile = writeFile;
  function writeFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$writeFile(path, data, options, cb)

    function go$writeFile (path, data, options, cb) {
      return fs$writeFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$writeFile, [path, data, options, cb]]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
          retry();
        }
      })
    }
  }

  var fs$appendFile = fs.appendFile;
  if (fs$appendFile)
    fs.appendFile = appendFile;
  function appendFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$appendFile(path, data, options, cb)

    function go$appendFile (path, data, options, cb) {
      return fs$appendFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$appendFile, [path, data, options, cb]]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
          retry();
        }
      })
    }
  }

  var fs$readdir = fs.readdir;
  fs.readdir = readdir;
  function readdir (path, options, cb) {
    var args = [path];
    if (typeof options !== 'function') {
      args.push(options);
    } else {
      cb = options;
    }
    args.push(go$readdir$cb);

    return go$readdir(args)

    function go$readdir$cb (err, files) {
      if (files && files.sort)
        files.sort();

      if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
        enqueue([go$readdir, [args]]);
      else {
        if (typeof cb === 'function')
          cb.apply(this, arguments);
        retry();
      }
    }
  }

  function go$readdir (args) {
    return fs$readdir.apply(fs, args)
  }

  if (process.version.substr(0, 4) === 'v0.8') {
    var legStreams = legacyStreams(fs);
    ReadStream = legStreams.ReadStream;
    WriteStream = legStreams.WriteStream;
  }

  var fs$ReadStream = fs.ReadStream;
  ReadStream.prototype = Object.create(fs$ReadStream.prototype);
  ReadStream.prototype.open = ReadStream$open;

  var fs$WriteStream = fs.WriteStream;
  WriteStream.prototype = Object.create(fs$WriteStream.prototype);
  WriteStream.prototype.open = WriteStream$open;

  fs.ReadStream = ReadStream;
  fs.WriteStream = WriteStream;

  function ReadStream (path, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
  }

  function ReadStream$open () {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy();

        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
        that.read();
      }
    });
  }

  function WriteStream (path, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
  }

  function WriteStream$open () {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        that.destroy();
        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
      }
    });
  }

  function createReadStream (path, options) {
    return new ReadStream(path, options)
  }

  function createWriteStream (path, options) {
    return new WriteStream(path, options)
  }

  var fs$open = fs.open;
  fs.open = open;
  function open (path, flags, mode, cb) {
    if (typeof mode === 'function')
      cb = mode, mode = null;

    return go$open(path, flags, mode, cb)

    function go$open (path, flags, mode, cb) {
      return fs$open(path, flags, mode, function (err, fd) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$open, [path, flags, mode, cb]]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
          retry();
        }
      })
    }
  }

  return fs
}

function enqueue (elem) {
  debug('ENQUEUE', elem[0].name, elem[1]);
  queue.push(elem);
}

function retry () {
  var elem = queue.shift();
  if (elem) {
    debug('RETRY', elem[0].name, elem[1]);
    elem[0].apply(null, elem[1]);
  }
}
});

var fs_1$1 = createCommonjsModule(function (module, exports) {
// This is adapted from https://github.com/normalize/mz
// Copyright (c) 2014-2016 Jonathan Ong me@jongleberry.com and Contributors
const u = universalify.fromCallback;


const api = [
  'access',
  'appendFile',
  'chmod',
  'chown',
  'close',
  'copyFile',
  'fchmod',
  'fchown',
  'fdatasync',
  'fstat',
  'fsync',
  'ftruncate',
  'futimes',
  'lchown',
  'lchmod',
  'link',
  'lstat',
  'mkdir',
  'mkdtemp',
  'open',
  'readFile',
  'readdir',
  'readlink',
  'realpath',
  'rename',
  'rmdir',
  'stat',
  'symlink',
  'truncate',
  'unlink',
  'utimes',
  'writeFile'
].filter(key => {
  // Some commands are not available on some systems. Ex:
  // fs.copyFile was added in Node.js v8.5.0
  // fs.mkdtemp was added in Node.js v5.10.0
  // fs.lchown is not available on at least some Linux
  return typeof gracefulFs[key] === 'function'
});

// Export all keys:
Object.keys(gracefulFs).forEach(key => {
  if (key === 'promises') {
    // fs.promises is a getter property that triggers ExperimentalWarning
    // Don't re-export it here, the getter is defined in "lib/index.js"
    return
  }
  exports[key] = gracefulFs[key];
});

// Universalify async methods:
api.forEach(method => {
  exports[method] = u(gracefulFs[method]);
});

// We differ from mz/fs in that we still ship the old, broken, fs.exists()
// since we are a drop-in replacement for the native module
exports.exists = function (filename, callback) {
  if (typeof callback === 'function') {
    return gracefulFs.exists(filename, callback)
  }
  return new Promise(resolve => {
    return gracefulFs.exists(filename, resolve)
  })
};

// fs.read() & fs.write need special treatment due to multiple callback args

exports.read = function (fd, buffer, offset, length, position, callback) {
  if (typeof callback === 'function') {
    return gracefulFs.read(fd, buffer, offset, length, position, callback)
  }
  return new Promise((resolve, reject) => {
    gracefulFs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer) => {
      if (err) return reject(err)
      resolve({ bytesRead, buffer });
    });
  })
};

// Function signature can be
// fs.write(fd, buffer[, offset[, length[, position]]], callback)
// OR
// fs.write(fd, string[, position[, encoding]], callback)
// We need to handle both cases, so we use ...args
exports.write = function (fd, buffer, ...args) {
  if (typeof args[args.length - 1] === 'function') {
    return gracefulFs.write(fd, buffer, ...args)
  }

  return new Promise((resolve, reject) => {
    gracefulFs.write(fd, buffer, ...args, (err, bytesWritten, buffer) => {
      if (err) return reject(err)
      resolve({ bytesWritten, buffer });
    });
  })
};
});

// get drive on windows
function getRootPath (p) {
  p = path__default['default'].normalize(path__default['default'].resolve(p)).split(path__default['default'].sep);
  if (p.length > 0) return p[0]
  return null
}

// http://stackoverflow.com/a/62888/10333 contains more accurate
// TODO: expand to include the rest
const INVALID_PATH_CHARS = /[<>:"|?*]/;

function invalidWin32Path (p) {
  const rp = getRootPath(p);
  p = p.replace(rp, '');
  return INVALID_PATH_CHARS.test(p)
}

var win32 = {
  getRootPath,
  invalidWin32Path
};

const invalidWin32Path$1 = win32.invalidWin32Path;

const o777 = parseInt('0777', 8);

function mkdirs (p, opts, callback, made) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  } else if (!opts || typeof opts !== 'object') {
    opts = { mode: opts };
  }

  if (process.platform === 'win32' && invalidWin32Path$1(p)) {
    const errInval = new Error(p + ' contains invalid WIN32 path characters.');
    errInval.code = 'EINVAL';
    return callback(errInval)
  }

  let mode = opts.mode;
  const xfs = opts.fs || gracefulFs;

  if (mode === undefined) {
    mode = o777 & (~process.umask());
  }
  if (!made) made = null;

  callback = callback || function () {};
  p = path__default['default'].resolve(p);

  xfs.mkdir(p, mode, er => {
    if (!er) {
      made = made || p;
      return callback(null, made)
    }
    switch (er.code) {
      case 'ENOENT':
        if (path__default['default'].dirname(p) === p) return callback(er)
        mkdirs(path__default['default'].dirname(p), opts, (er, made) => {
          if (er) callback(er, made);
          else mkdirs(p, opts, callback, made);
        });
        break

      // In the case of any other error, just see if there's a dir
      // there already.  If so, then hooray!  If not, then something
      // is borked.
      default:
        xfs.stat(p, (er2, stat) => {
          // if the stat fails, then that's super weird.
          // let the original error be the failure reason.
          if (er2 || !stat.isDirectory()) callback(er, made);
          else callback(null, made);
        });
        break
    }
  });
}

var mkdirs_1 = mkdirs;

const invalidWin32Path$2 = win32.invalidWin32Path;

const o777$1 = parseInt('0777', 8);

function mkdirsSync (p, opts, made) {
  if (!opts || typeof opts !== 'object') {
    opts = { mode: opts };
  }

  let mode = opts.mode;
  const xfs = opts.fs || gracefulFs;

  if (process.platform === 'win32' && invalidWin32Path$2(p)) {
    const errInval = new Error(p + ' contains invalid WIN32 path characters.');
    errInval.code = 'EINVAL';
    throw errInval
  }

  if (mode === undefined) {
    mode = o777$1 & (~process.umask());
  }
  if (!made) made = null;

  p = path__default['default'].resolve(p);

  try {
    xfs.mkdirSync(p, mode);
    made = made || p;
  } catch (err0) {
    if (err0.code === 'ENOENT') {
      if (path__default['default'].dirname(p) === p) throw err0
      made = mkdirsSync(path__default['default'].dirname(p), opts, made);
      mkdirsSync(p, opts, made);
    } else {
      // In the case of any other error, just see if there's a dir there
      // already. If so, then hooray!  If not, then something is borked.
      let stat;
      try {
        stat = xfs.statSync(p);
      } catch (err1) {
        throw err0
      }
      if (!stat.isDirectory()) throw err0
    }
  }

  return made
}

var mkdirsSync_1 = mkdirsSync;

const u = universalify.fromCallback;
const mkdirs$1 = u(mkdirs_1);


var mkdirs_1$1 = {
  mkdirs: mkdirs$1,
  mkdirsSync: mkdirsSync_1,
  // alias
  mkdirp: mkdirs$1,
  mkdirpSync: mkdirsSync_1,
  ensureDir: mkdirs$1,
  ensureDirSync: mkdirsSync_1
};

// HFS, ext{2,3}, FAT do not, Node.js v0.10 does not
function hasMillisResSync () {
  let tmpfile = path__default['default'].join('millis-test-sync' + Date.now().toString() + Math.random().toString().slice(2));
  tmpfile = path__default['default'].join(os__default['default'].tmpdir(), tmpfile);

  // 550 millis past UNIX epoch
  const d = new Date(1435410243862);
  gracefulFs.writeFileSync(tmpfile, 'https://github.com/jprichardson/node-fs-extra/pull/141');
  const fd = gracefulFs.openSync(tmpfile, 'r+');
  gracefulFs.futimesSync(fd, d, d);
  gracefulFs.closeSync(fd);
  return gracefulFs.statSync(tmpfile).mtime > 1435410243000
}

function hasMillisRes (callback) {
  let tmpfile = path__default['default'].join('millis-test' + Date.now().toString() + Math.random().toString().slice(2));
  tmpfile = path__default['default'].join(os__default['default'].tmpdir(), tmpfile);

  // 550 millis past UNIX epoch
  const d = new Date(1435410243862);
  gracefulFs.writeFile(tmpfile, 'https://github.com/jprichardson/node-fs-extra/pull/141', err => {
    if (err) return callback(err)
    gracefulFs.open(tmpfile, 'r+', (err, fd) => {
      if (err) return callback(err)
      gracefulFs.futimes(fd, d, d, err => {
        if (err) return callback(err)
        gracefulFs.close(fd, err => {
          if (err) return callback(err)
          gracefulFs.stat(tmpfile, (err, stats) => {
            if (err) return callback(err)
            callback(null, stats.mtime > 1435410243000);
          });
        });
      });
    });
  });
}

function timeRemoveMillis (timestamp) {
  if (typeof timestamp === 'number') {
    return Math.floor(timestamp / 1000) * 1000
  } else if (timestamp instanceof Date) {
    return new Date(Math.floor(timestamp.getTime() / 1000) * 1000)
  } else {
    throw new Error('fs-extra: timeRemoveMillis() unknown parameter type')
  }
}

function utimesMillis (path, atime, mtime, callback) {
  // if (!HAS_MILLIS_RES) return fs.utimes(path, atime, mtime, callback)
  gracefulFs.open(path, 'r+', (err, fd) => {
    if (err) return callback(err)
    gracefulFs.futimes(fd, atime, mtime, futimesErr => {
      gracefulFs.close(fd, closeErr => {
        if (callback) callback(futimesErr || closeErr);
      });
    });
  });
}

function utimesMillisSync (path, atime, mtime) {
  const fd = gracefulFs.openSync(path, 'r+');
  gracefulFs.futimesSync(fd, atime, mtime);
  return gracefulFs.closeSync(fd)
}

var utimes = {
  hasMillisRes,
  hasMillisResSync,
  timeRemoveMillis,
  utimesMillis,
  utimesMillisSync
};

/* eslint-disable node/no-deprecated-api */
var buffer = function (size) {
  if (typeof Buffer.allocUnsafe === 'function') {
    try {
      return Buffer.allocUnsafe(size)
    } catch (e) {
      return new Buffer(size)
    }
  }
  return new Buffer(size)
};

const mkdirpSync = mkdirs_1$1.mkdirsSync;
const utimesSync = utimes.utimesMillisSync;

const notExist = Symbol('notExist');

function copySync (src, dest, opts) {
  if (typeof opts === 'function') {
    opts = {filter: opts};
  }

  opts = opts || {};
  opts.clobber = 'clobber' in opts ? !!opts.clobber : true; // default to true for now
  opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber; // overwrite falls back to clobber

  // Warn about using preserveTimestamps on 32-bit node
  if (opts.preserveTimestamps && process.arch === 'ia32') {
    console.warn(`fs-extra: Using the preserveTimestamps option in 32-bit node is not recommended;\n
    see https://github.com/jprichardson/node-fs-extra/issues/269`);
  }

  const destStat = checkPaths(src, dest);

  if (opts.filter && !opts.filter(src, dest)) return

  const destParent = path__default['default'].dirname(dest);
  if (!gracefulFs.existsSync(destParent)) mkdirpSync(destParent);
  return startCopy(destStat, src, dest, opts)
}

function startCopy (destStat, src, dest, opts) {
  if (opts.filter && !opts.filter(src, dest)) return
  return getStats(destStat, src, dest, opts)
}

function getStats (destStat, src, dest, opts) {
  const statSync = opts.dereference ? gracefulFs.statSync : gracefulFs.lstatSync;
  const srcStat = statSync(src);

  if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts)
  else if (srcStat.isFile() ||
           srcStat.isCharacterDevice() ||
           srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts)
  else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts)
}

function onFile (srcStat, destStat, src, dest, opts) {
  if (destStat === notExist) return copyFile(srcStat, src, dest, opts)
  return mayCopyFile(srcStat, src, dest, opts)
}

function mayCopyFile (srcStat, src, dest, opts) {
  if (opts.overwrite) {
    gracefulFs.unlinkSync(dest);
    return copyFile(srcStat, src, dest, opts)
  } else if (opts.errorOnExist) {
    throw new Error(`'${dest}' already exists`)
  }
}

function copyFile (srcStat, src, dest, opts) {
  if (typeof gracefulFs.copyFileSync === 'function') {
    gracefulFs.copyFileSync(src, dest);
    gracefulFs.chmodSync(dest, srcStat.mode);
    if (opts.preserveTimestamps) {
      return utimesSync(dest, srcStat.atime, srcStat.mtime)
    }
    return
  }
  return copyFileFallback(srcStat, src, dest, opts)
}

function copyFileFallback (srcStat, src, dest, opts) {
  const BUF_LENGTH = 64 * 1024;
  const _buff = buffer(BUF_LENGTH);

  const fdr = gracefulFs.openSync(src, 'r');
  const fdw = gracefulFs.openSync(dest, 'w', srcStat.mode);
  let pos = 0;

  while (pos < srcStat.size) {
    const bytesRead = gracefulFs.readSync(fdr, _buff, 0, BUF_LENGTH, pos);
    gracefulFs.writeSync(fdw, _buff, 0, bytesRead);
    pos += bytesRead;
  }

  if (opts.preserveTimestamps) gracefulFs.futimesSync(fdw, srcStat.atime, srcStat.mtime);

  gracefulFs.closeSync(fdr);
  gracefulFs.closeSync(fdw);
}

function onDir (srcStat, destStat, src, dest, opts) {
  if (destStat === notExist) return mkDirAndCopy(srcStat, src, dest, opts)
  if (destStat && !destStat.isDirectory()) {
    throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`)
  }
  return copyDir(src, dest, opts)
}

function mkDirAndCopy (srcStat, src, dest, opts) {
  gracefulFs.mkdirSync(dest);
  copyDir(src, dest, opts);
  return gracefulFs.chmodSync(dest, srcStat.mode)
}

function copyDir (src, dest, opts) {
  gracefulFs.readdirSync(src).forEach(item => copyDirItem(item, src, dest, opts));
}

function copyDirItem (item, src, dest, opts) {
  const srcItem = path__default['default'].join(src, item);
  const destItem = path__default['default'].join(dest, item);
  const destStat = checkPaths(srcItem, destItem);
  return startCopy(destStat, srcItem, destItem, opts)
}

function onLink (destStat, src, dest, opts) {
  let resolvedSrc = gracefulFs.readlinkSync(src);

  if (opts.dereference) {
    resolvedSrc = path__default['default'].resolve(process.cwd(), resolvedSrc);
  }

  if (destStat === notExist) {
    return gracefulFs.symlinkSync(resolvedSrc, dest)
  } else {
    let resolvedDest;
    try {
      resolvedDest = gracefulFs.readlinkSync(dest);
    } catch (err) {
      // dest exists and is a regular file or directory,
      // Windows may throw UNKNOWN error. If dest already exists,
      // fs throws error anyway, so no need to guard against it here.
      if (err.code === 'EINVAL' || err.code === 'UNKNOWN') return gracefulFs.symlinkSync(resolvedSrc, dest)
      throw err
    }
    if (opts.dereference) {
      resolvedDest = path__default['default'].resolve(process.cwd(), resolvedDest);
    }
    if (isSrcSubdir(resolvedSrc, resolvedDest)) {
      throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`)
    }

    // prevent copy if src is a subdir of dest since unlinking
    // dest in this case would result in removing src contents
    // and therefore a broken symlink would be created.
    if (gracefulFs.statSync(dest).isDirectory() && isSrcSubdir(resolvedDest, resolvedSrc)) {
      throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`)
    }
    return copyLink(resolvedSrc, dest)
  }
}

function copyLink (resolvedSrc, dest) {
  gracefulFs.unlinkSync(dest);
  return gracefulFs.symlinkSync(resolvedSrc, dest)
}

// return true if dest is a subdir of src, otherwise false.
function isSrcSubdir (src, dest) {
  const srcArray = path__default['default'].resolve(src).split(path__default['default'].sep);
  const destArray = path__default['default'].resolve(dest).split(path__default['default'].sep);
  return srcArray.reduce((acc, current, i) => acc && destArray[i] === current, true)
}

function checkStats (src, dest) {
  const srcStat = gracefulFs.statSync(src);
  let destStat;
  try {
    destStat = gracefulFs.statSync(dest);
  } catch (err) {
    if (err.code === 'ENOENT') return {srcStat, destStat: notExist}
    throw err
  }
  return {srcStat, destStat}
}

function checkPaths (src, dest) {
  const {srcStat, destStat} = checkStats(src, dest);
  if (destStat.ino && destStat.ino === srcStat.ino) {
    throw new Error('Source and destination must not be the same.')
  }
  if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
    throw new Error(`Cannot copy '${src}' to a subdirectory of itself, '${dest}'.`)
  }
  return destStat
}

var copySync_1 = copySync;

var copySync$1 = {
  copySync: copySync_1
};

const u$1 = universalify.fromPromise;


function pathExists (path) {
  return fs_1$1.access(path).then(() => true).catch(() => false)
}

var pathExists_1 = {
  pathExists: u$1(pathExists),
  pathExistsSync: fs_1$1.existsSync
};

const mkdirp = mkdirs_1$1.mkdirs;
const pathExists$1 = pathExists_1.pathExists;
const utimes$1 = utimes.utimesMillis;

const notExist$1 = Symbol('notExist');

function copy (src, dest, opts, cb) {
  if (typeof opts === 'function' && !cb) {
    cb = opts;
    opts = {};
  } else if (typeof opts === 'function') {
    opts = {filter: opts};
  }

  cb = cb || function () {};
  opts = opts || {};

  opts.clobber = 'clobber' in opts ? !!opts.clobber : true; // default to true for now
  opts.overwrite = 'overwrite' in opts ? !!opts.overwrite : opts.clobber; // overwrite falls back to clobber

  // Warn about using preserveTimestamps on 32-bit node
  if (opts.preserveTimestamps && process.arch === 'ia32') {
    console.warn(`fs-extra: Using the preserveTimestamps option in 32-bit node is not recommended;\n
    see https://github.com/jprichardson/node-fs-extra/issues/269`);
  }

  checkPaths$1(src, dest, (err, destStat) => {
    if (err) return cb(err)
    if (opts.filter) return handleFilter(checkParentDir, destStat, src, dest, opts, cb)
    return checkParentDir(destStat, src, dest, opts, cb)
  });
}

function checkParentDir (destStat, src, dest, opts, cb) {
  const destParent = path__default['default'].dirname(dest);
  pathExists$1(destParent, (err, dirExists) => {
    if (err) return cb(err)
    if (dirExists) return startCopy$1(destStat, src, dest, opts, cb)
    mkdirp(destParent, err => {
      if (err) return cb(err)
      return startCopy$1(destStat, src, dest, opts, cb)
    });
  });
}

function handleFilter (onInclude, destStat, src, dest, opts, cb) {
  Promise.resolve(opts.filter(src, dest)).then(include => {
    if (include) {
      if (destStat) return onInclude(destStat, src, dest, opts, cb)
      return onInclude(src, dest, opts, cb)
    }
    return cb()
  }, error => cb(error));
}

function startCopy$1 (destStat, src, dest, opts, cb) {
  if (opts.filter) return handleFilter(getStats$1, destStat, src, dest, opts, cb)
  return getStats$1(destStat, src, dest, opts, cb)
}

function getStats$1 (destStat, src, dest, opts, cb) {
  const stat = opts.dereference ? gracefulFs.stat : gracefulFs.lstat;
  stat(src, (err, srcStat) => {
    if (err) return cb(err)

    if (srcStat.isDirectory()) return onDir$1(srcStat, destStat, src, dest, opts, cb)
    else if (srcStat.isFile() ||
             srcStat.isCharacterDevice() ||
             srcStat.isBlockDevice()) return onFile$1(srcStat, destStat, src, dest, opts, cb)
    else if (srcStat.isSymbolicLink()) return onLink$1(destStat, src, dest, opts, cb)
  });
}

function onFile$1 (srcStat, destStat, src, dest, opts, cb) {
  if (destStat === notExist$1) return copyFile$1(srcStat, src, dest, opts, cb)
  return mayCopyFile$1(srcStat, src, dest, opts, cb)
}

function mayCopyFile$1 (srcStat, src, dest, opts, cb) {
  if (opts.overwrite) {
    gracefulFs.unlink(dest, err => {
      if (err) return cb(err)
      return copyFile$1(srcStat, src, dest, opts, cb)
    });
  } else if (opts.errorOnExist) {
    return cb(new Error(`'${dest}' already exists`))
  } else return cb()
}

function copyFile$1 (srcStat, src, dest, opts, cb) {
  if (typeof gracefulFs.copyFile === 'function') {
    return gracefulFs.copyFile(src, dest, err => {
      if (err) return cb(err)
      return setDestModeAndTimestamps(srcStat, dest, opts, cb)
    })
  }
  return copyFileFallback$1(srcStat, src, dest, opts, cb)
}

function copyFileFallback$1 (srcStat, src, dest, opts, cb) {
  const rs = gracefulFs.createReadStream(src);
  rs.on('error', err => cb(err)).once('open', () => {
    const ws = gracefulFs.createWriteStream(dest, { mode: srcStat.mode });
    ws.on('error', err => cb(err))
      .on('open', () => rs.pipe(ws))
      .once('close', () => setDestModeAndTimestamps(srcStat, dest, opts, cb));
  });
}

function setDestModeAndTimestamps (srcStat, dest, opts, cb) {
  gracefulFs.chmod(dest, srcStat.mode, err => {
    if (err) return cb(err)
    if (opts.preserveTimestamps) {
      return utimes$1(dest, srcStat.atime, srcStat.mtime, cb)
    }
    return cb()
  });
}

function onDir$1 (srcStat, destStat, src, dest, opts, cb) {
  if (destStat === notExist$1) return mkDirAndCopy$1(srcStat, src, dest, opts, cb)
  if (destStat && !destStat.isDirectory()) {
    return cb(new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`))
  }
  return copyDir$1(src, dest, opts, cb)
}

function mkDirAndCopy$1 (srcStat, src, dest, opts, cb) {
  gracefulFs.mkdir(dest, err => {
    if (err) return cb(err)
    copyDir$1(src, dest, opts, err => {
      if (err) return cb(err)
      return gracefulFs.chmod(dest, srcStat.mode, cb)
    });
  });
}

function copyDir$1 (src, dest, opts, cb) {
  gracefulFs.readdir(src, (err, items) => {
    if (err) return cb(err)
    return copyDirItems(items, src, dest, opts, cb)
  });
}

function copyDirItems (items, src, dest, opts, cb) {
  const item = items.pop();
  if (!item) return cb()
  return copyDirItem$1(items, item, src, dest, opts, cb)
}

function copyDirItem$1 (items, item, src, dest, opts, cb) {
  const srcItem = path__default['default'].join(src, item);
  const destItem = path__default['default'].join(dest, item);
  checkPaths$1(srcItem, destItem, (err, destStat) => {
    if (err) return cb(err)
    startCopy$1(destStat, srcItem, destItem, opts, err => {
      if (err) return cb(err)
      return copyDirItems(items, src, dest, opts, cb)
    });
  });
}

function onLink$1 (destStat, src, dest, opts, cb) {
  gracefulFs.readlink(src, (err, resolvedSrc) => {
    if (err) return cb(err)

    if (opts.dereference) {
      resolvedSrc = path__default['default'].resolve(process.cwd(), resolvedSrc);
    }

    if (destStat === notExist$1) {
      return gracefulFs.symlink(resolvedSrc, dest, cb)
    } else {
      gracefulFs.readlink(dest, (err, resolvedDest) => {
        if (err) {
          // dest exists and is a regular file or directory,
          // Windows may throw UNKNOWN error. If dest already exists,
          // fs throws error anyway, so no need to guard against it here.
          if (err.code === 'EINVAL' || err.code === 'UNKNOWN') return gracefulFs.symlink(resolvedSrc, dest, cb)
          return cb(err)
        }
        if (opts.dereference) {
          resolvedDest = path__default['default'].resolve(process.cwd(), resolvedDest);
        }
        if (isSrcSubdir$1(resolvedSrc, resolvedDest)) {
          return cb(new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`))
        }

        // do not copy if src is a subdir of dest since unlinking
        // dest in this case would result in removing src contents
        // and therefore a broken symlink would be created.
        if (destStat.isDirectory() && isSrcSubdir$1(resolvedDest, resolvedSrc)) {
          return cb(new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`))
        }
        return copyLink$1(resolvedSrc, dest, cb)
      });
    }
  });
}

function copyLink$1 (resolvedSrc, dest, cb) {
  gracefulFs.unlink(dest, err => {
    if (err) return cb(err)
    return gracefulFs.symlink(resolvedSrc, dest, cb)
  });
}

// return true if dest is a subdir of src, otherwise false.
function isSrcSubdir$1 (src, dest) {
  const srcArray = path__default['default'].resolve(src).split(path__default['default'].sep);
  const destArray = path__default['default'].resolve(dest).split(path__default['default'].sep);
  return srcArray.reduce((acc, current, i) => acc && destArray[i] === current, true)
}

function checkStats$1 (src, dest, cb) {
  gracefulFs.stat(src, (err, srcStat) => {
    if (err) return cb(err)
    gracefulFs.stat(dest, (err, destStat) => {
      if (err) {
        if (err.code === 'ENOENT') return cb(null, {srcStat, destStat: notExist$1})
        return cb(err)
      }
      return cb(null, {srcStat, destStat})
    });
  });
}

function checkPaths$1 (src, dest, cb) {
  checkStats$1(src, dest, (err, stats) => {
    if (err) return cb(err)
    const {srcStat, destStat} = stats;
    if (destStat.ino && destStat.ino === srcStat.ino) {
      return cb(new Error('Source and destination must not be the same.'))
    }
    if (srcStat.isDirectory() && isSrcSubdir$1(src, dest)) {
      return cb(new Error(`Cannot copy '${src}' to a subdirectory of itself, '${dest}'.`))
    }
    return cb(null, destStat)
  });
}

var copy_1 = copy;

const u$2 = universalify.fromCallback;
var copy$1 = {
  copy: u$2(copy_1)
};

const isWindows = (process.platform === 'win32');

function defaults (options) {
  const methods = [
    'unlink',
    'chmod',
    'stat',
    'lstat',
    'rmdir',
    'readdir'
  ];
  methods.forEach(m => {
    options[m] = options[m] || gracefulFs[m];
    m = m + 'Sync';
    options[m] = options[m] || gracefulFs[m];
  });

  options.maxBusyTries = options.maxBusyTries || 3;
}

function rimraf (p, options, cb) {
  let busyTries = 0;

  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  assert__default['default'](p, 'rimraf: missing path');
  assert__default['default'].strictEqual(typeof p, 'string', 'rimraf: path should be a string');
  assert__default['default'].strictEqual(typeof cb, 'function', 'rimraf: callback function required');
  assert__default['default'](options, 'rimraf: invalid options argument provided');
  assert__default['default'].strictEqual(typeof options, 'object', 'rimraf: options should be object');

  defaults(options);

  rimraf_(p, options, function CB (er) {
    if (er) {
      if ((er.code === 'EBUSY' || er.code === 'ENOTEMPTY' || er.code === 'EPERM') &&
          busyTries < options.maxBusyTries) {
        busyTries++;
        const time = busyTries * 100;
        // try again, with the same exact callback as this one.
        return setTimeout(() => rimraf_(p, options, CB), time)
      }

      // already gone
      if (er.code === 'ENOENT') er = null;
    }

    cb(er);
  });
}

// Two possible strategies.
// 1. Assume it's a file.  unlink it, then do the dir stuff on EPERM or EISDIR
// 2. Assume it's a directory.  readdir, then do the file stuff on ENOTDIR
//
// Both result in an extra syscall when you guess wrong.  However, there
// are likely far more normal files in the world than directories.  This
// is based on the assumption that a the average number of files per
// directory is >= 1.
//
// If anyone ever complains about this, then I guess the strategy could
// be made configurable somehow.  But until then, YAGNI.
function rimraf_ (p, options, cb) {
  assert__default['default'](p);
  assert__default['default'](options);
  assert__default['default'](typeof cb === 'function');

  // sunos lets the root user unlink directories, which is... weird.
  // so we have to lstat here and make sure it's not a dir.
  options.lstat(p, (er, st) => {
    if (er && er.code === 'ENOENT') {
      return cb(null)
    }

    // Windows can EPERM on stat.  Life is suffering.
    if (er && er.code === 'EPERM' && isWindows) {
      return fixWinEPERM(p, options, er, cb)
    }

    if (st && st.isDirectory()) {
      return rmdir(p, options, er, cb)
    }

    options.unlink(p, er => {
      if (er) {
        if (er.code === 'ENOENT') {
          return cb(null)
        }
        if (er.code === 'EPERM') {
          return (isWindows)
            ? fixWinEPERM(p, options, er, cb)
            : rmdir(p, options, er, cb)
        }
        if (er.code === 'EISDIR') {
          return rmdir(p, options, er, cb)
        }
      }
      return cb(er)
    });
  });
}

function fixWinEPERM (p, options, er, cb) {
  assert__default['default'](p);
  assert__default['default'](options);
  assert__default['default'](typeof cb === 'function');
  if (er) {
    assert__default['default'](er instanceof Error);
  }

  options.chmod(p, 0o666, er2 => {
    if (er2) {
      cb(er2.code === 'ENOENT' ? null : er);
    } else {
      options.stat(p, (er3, stats) => {
        if (er3) {
          cb(er3.code === 'ENOENT' ? null : er);
        } else if (stats.isDirectory()) {
          rmdir(p, options, er, cb);
        } else {
          options.unlink(p, cb);
        }
      });
    }
  });
}

function fixWinEPERMSync (p, options, er) {
  let stats;

  assert__default['default'](p);
  assert__default['default'](options);
  if (er) {
    assert__default['default'](er instanceof Error);
  }

  try {
    options.chmodSync(p, 0o666);
  } catch (er2) {
    if (er2.code === 'ENOENT') {
      return
    } else {
      throw er
    }
  }

  try {
    stats = options.statSync(p);
  } catch (er3) {
    if (er3.code === 'ENOENT') {
      return
    } else {
      throw er
    }
  }

  if (stats.isDirectory()) {
    rmdirSync(p, options, er);
  } else {
    options.unlinkSync(p);
  }
}

function rmdir (p, options, originalEr, cb) {
  assert__default['default'](p);
  assert__default['default'](options);
  if (originalEr) {
    assert__default['default'](originalEr instanceof Error);
  }
  assert__default['default'](typeof cb === 'function');

  // try to rmdir first, and only readdir on ENOTEMPTY or EEXIST (SunOS)
  // if we guessed wrong, and it's not a directory, then
  // raise the original error.
  options.rmdir(p, er => {
    if (er && (er.code === 'ENOTEMPTY' || er.code === 'EEXIST' || er.code === 'EPERM')) {
      rmkids(p, options, cb);
    } else if (er && er.code === 'ENOTDIR') {
      cb(originalEr);
    } else {
      cb(er);
    }
  });
}

function rmkids (p, options, cb) {
  assert__default['default'](p);
  assert__default['default'](options);
  assert__default['default'](typeof cb === 'function');

  options.readdir(p, (er, files) => {
    if (er) return cb(er)

    let n = files.length;
    let errState;

    if (n === 0) return options.rmdir(p, cb)

    files.forEach(f => {
      rimraf(path__default['default'].join(p, f), options, er => {
        if (errState) {
          return
        }
        if (er) return cb(errState = er)
        if (--n === 0) {
          options.rmdir(p, cb);
        }
      });
    });
  });
}

// this looks simpler, and is strictly *faster*, but will
// tie up the JavaScript thread and fail on excessively
// deep directory trees.
function rimrafSync (p, options) {
  let st;

  options = options || {};
  defaults(options);

  assert__default['default'](p, 'rimraf: missing path');
  assert__default['default'].strictEqual(typeof p, 'string', 'rimraf: path should be a string');
  assert__default['default'](options, 'rimraf: missing options');
  assert__default['default'].strictEqual(typeof options, 'object', 'rimraf: options should be object');

  try {
    st = options.lstatSync(p);
  } catch (er) {
    if (er.code === 'ENOENT') {
      return
    }

    // Windows can EPERM on stat.  Life is suffering.
    if (er.code === 'EPERM' && isWindows) {
      fixWinEPERMSync(p, options, er);
    }
  }

  try {
    // sunos lets the root user unlink directories, which is... weird.
    if (st && st.isDirectory()) {
      rmdirSync(p, options, null);
    } else {
      options.unlinkSync(p);
    }
  } catch (er) {
    if (er.code === 'ENOENT') {
      return
    } else if (er.code === 'EPERM') {
      return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er)
    } else if (er.code !== 'EISDIR') {
      throw er
    }
    rmdirSync(p, options, er);
  }
}

function rmdirSync (p, options, originalEr) {
  assert__default['default'](p);
  assert__default['default'](options);
  if (originalEr) {
    assert__default['default'](originalEr instanceof Error);
  }

  try {
    options.rmdirSync(p);
  } catch (er) {
    if (er.code === 'ENOTDIR') {
      throw originalEr
    } else if (er.code === 'ENOTEMPTY' || er.code === 'EEXIST' || er.code === 'EPERM') {
      rmkidsSync(p, options);
    } else if (er.code !== 'ENOENT') {
      throw er
    }
  }
}

function rmkidsSync (p, options) {
  assert__default['default'](p);
  assert__default['default'](options);
  options.readdirSync(p).forEach(f => rimrafSync(path__default['default'].join(p, f), options));

  if (isWindows) {
    // We only end up here once we got ENOTEMPTY at least once, and
    // at this point, we are guaranteed to have removed all the kids.
    // So, we know that it won't be ENOENT or ENOTDIR or anything else.
    // try really hard to delete stuff on windows, because it has a
    // PROFOUNDLY annoying habit of not closing handles promptly when
    // files are deleted, resulting in spurious ENOTEMPTY errors.
    const startTime = Date.now();
    do {
      try {
        const ret = options.rmdirSync(p, options);
        return ret
      } catch (er) { }
    } while (Date.now() - startTime < 500) // give up after 500ms
  } else {
    const ret = options.rmdirSync(p, options);
    return ret
  }
}

var rimraf_1 = rimraf;
rimraf.sync = rimrafSync;

const u$3 = universalify.fromCallback;


var remove = {
  remove: u$3(rimraf_1),
  removeSync: rimraf_1.sync
};

const u$4 = universalify.fromCallback;





const emptyDir = u$4(function emptyDir (dir, callback) {
  callback = callback || function () {};
  fs__default['default'].readdir(dir, (err, items) => {
    if (err) return mkdirs_1$1.mkdirs(dir, callback)

    items = items.map(item => path__default['default'].join(dir, item));

    deleteItem();

    function deleteItem () {
      const item = items.pop();
      if (!item) return callback()
      remove.remove(item, err => {
        if (err) return callback(err)
        deleteItem();
      });
    }
  });
});

function emptyDirSync (dir) {
  let items;
  try {
    items = fs__default['default'].readdirSync(dir);
  } catch (err) {
    return mkdirs_1$1.mkdirsSync(dir)
  }

  items.forEach(item => {
    item = path__default['default'].join(dir, item);
    remove.removeSync(item);
  });
}

var empty = {
  emptyDirSync,
  emptydirSync: emptyDirSync,
  emptyDir,
  emptydir: emptyDir
};

const u$5 = universalify.fromCallback;



const pathExists$2 = pathExists_1.pathExists;

function createFile (file, callback) {
  function makeFile () {
    gracefulFs.writeFile(file, '', err => {
      if (err) return callback(err)
      callback();
    });
  }

  gracefulFs.stat(file, (err, stats) => { // eslint-disable-line handle-callback-err
    if (!err && stats.isFile()) return callback()
    const dir = path__default['default'].dirname(file);
    pathExists$2(dir, (err, dirExists) => {
      if (err) return callback(err)
      if (dirExists) return makeFile()
      mkdirs_1$1.mkdirs(dir, err => {
        if (err) return callback(err)
        makeFile();
      });
    });
  });
}

function createFileSync (file) {
  let stats;
  try {
    stats = gracefulFs.statSync(file);
  } catch (e) {}
  if (stats && stats.isFile()) return

  const dir = path__default['default'].dirname(file);
  if (!gracefulFs.existsSync(dir)) {
    mkdirs_1$1.mkdirsSync(dir);
  }

  gracefulFs.writeFileSync(file, '');
}

var file = {
  createFile: u$5(createFile),
  createFileSync
};

const u$6 = universalify.fromCallback;



const pathExists$3 = pathExists_1.pathExists;

function createLink (srcpath, dstpath, callback) {
  function makeLink (srcpath, dstpath) {
    gracefulFs.link(srcpath, dstpath, err => {
      if (err) return callback(err)
      callback(null);
    });
  }

  pathExists$3(dstpath, (err, destinationExists) => {
    if (err) return callback(err)
    if (destinationExists) return callback(null)
    gracefulFs.lstat(srcpath, (err) => {
      if (err) {
        err.message = err.message.replace('lstat', 'ensureLink');
        return callback(err)
      }

      const dir = path__default['default'].dirname(dstpath);
      pathExists$3(dir, (err, dirExists) => {
        if (err) return callback(err)
        if (dirExists) return makeLink(srcpath, dstpath)
        mkdirs_1$1.mkdirs(dir, err => {
          if (err) return callback(err)
          makeLink(srcpath, dstpath);
        });
      });
    });
  });
}

function createLinkSync (srcpath, dstpath) {
  const destinationExists = gracefulFs.existsSync(dstpath);
  if (destinationExists) return undefined

  try {
    gracefulFs.lstatSync(srcpath);
  } catch (err) {
    err.message = err.message.replace('lstat', 'ensureLink');
    throw err
  }

  const dir = path__default['default'].dirname(dstpath);
  const dirExists = gracefulFs.existsSync(dir);
  if (dirExists) return gracefulFs.linkSync(srcpath, dstpath)
  mkdirs_1$1.mkdirsSync(dir);

  return gracefulFs.linkSync(srcpath, dstpath)
}

var link = {
  createLink: u$6(createLink),
  createLinkSync
};

const pathExists$4 = pathExists_1.pathExists;

/**
 * Function that returns two types of paths, one relative to symlink, and one
 * relative to the current working directory. Checks if path is absolute or
 * relative. If the path is relative, this function checks if the path is
 * relative to symlink or relative to current working directory. This is an
 * initiative to find a smarter `srcpath` to supply when building symlinks.
 * This allows you to determine which path to use out of one of three possible
 * types of source paths. The first is an absolute path. This is detected by
 * `path.isAbsolute()`. When an absolute path is provided, it is checked to
 * see if it exists. If it does it's used, if not an error is returned
 * (callback)/ thrown (sync). The other two options for `srcpath` are a
 * relative url. By default Node's `fs.symlink` works by creating a symlink
 * using `dstpath` and expects the `srcpath` to be relative to the newly
 * created symlink. If you provide a `srcpath` that does not exist on the file
 * system it results in a broken symlink. To minimize this, the function
 * checks to see if the 'relative to symlink' source file exists, and if it
 * does it will use it. If it does not, it checks if there's a file that
 * exists that is relative to the current working directory, if does its used.
 * This preserves the expectations of the original fs.symlink spec and adds
 * the ability to pass in `relative to current working direcotry` paths.
 */

function symlinkPaths (srcpath, dstpath, callback) {
  if (path__default['default'].isAbsolute(srcpath)) {
    return gracefulFs.lstat(srcpath, (err) => {
      if (err) {
        err.message = err.message.replace('lstat', 'ensureSymlink');
        return callback(err)
      }
      return callback(null, {
        'toCwd': srcpath,
        'toDst': srcpath
      })
    })
  } else {
    const dstdir = path__default['default'].dirname(dstpath);
    const relativeToDst = path__default['default'].join(dstdir, srcpath);
    return pathExists$4(relativeToDst, (err, exists) => {
      if (err) return callback(err)
      if (exists) {
        return callback(null, {
          'toCwd': relativeToDst,
          'toDst': srcpath
        })
      } else {
        return gracefulFs.lstat(srcpath, (err) => {
          if (err) {
            err.message = err.message.replace('lstat', 'ensureSymlink');
            return callback(err)
          }
          return callback(null, {
            'toCwd': srcpath,
            'toDst': path__default['default'].relative(dstdir, srcpath)
          })
        })
      }
    })
  }
}

function symlinkPathsSync (srcpath, dstpath) {
  let exists;
  if (path__default['default'].isAbsolute(srcpath)) {
    exists = gracefulFs.existsSync(srcpath);
    if (!exists) throw new Error('absolute srcpath does not exist')
    return {
      'toCwd': srcpath,
      'toDst': srcpath
    }
  } else {
    const dstdir = path__default['default'].dirname(dstpath);
    const relativeToDst = path__default['default'].join(dstdir, srcpath);
    exists = gracefulFs.existsSync(relativeToDst);
    if (exists) {
      return {
        'toCwd': relativeToDst,
        'toDst': srcpath
      }
    } else {
      exists = gracefulFs.existsSync(srcpath);
      if (!exists) throw new Error('relative srcpath does not exist')
      return {
        'toCwd': srcpath,
        'toDst': path__default['default'].relative(dstdir, srcpath)
      }
    }
  }
}

var symlinkPaths_1 = {
  symlinkPaths,
  symlinkPathsSync
};

function symlinkType (srcpath, type, callback) {
  callback = (typeof type === 'function') ? type : callback;
  type = (typeof type === 'function') ? false : type;
  if (type) return callback(null, type)
  gracefulFs.lstat(srcpath, (err, stats) => {
    if (err) return callback(null, 'file')
    type = (stats && stats.isDirectory()) ? 'dir' : 'file';
    callback(null, type);
  });
}

function symlinkTypeSync (srcpath, type) {
  let stats;

  if (type) return type
  try {
    stats = gracefulFs.lstatSync(srcpath);
  } catch (e) {
    return 'file'
  }
  return (stats && stats.isDirectory()) ? 'dir' : 'file'
}

var symlinkType_1 = {
  symlinkType,
  symlinkTypeSync
};

const u$7 = universalify.fromCallback;



const mkdirs$2 = mkdirs_1$1.mkdirs;
const mkdirsSync$1 = mkdirs_1$1.mkdirsSync;


const symlinkPaths$1 = symlinkPaths_1.symlinkPaths;
const symlinkPathsSync$1 = symlinkPaths_1.symlinkPathsSync;


const symlinkType$1 = symlinkType_1.symlinkType;
const symlinkTypeSync$1 = symlinkType_1.symlinkTypeSync;

const pathExists$5 = pathExists_1.pathExists;

function createSymlink (srcpath, dstpath, type, callback) {
  callback = (typeof type === 'function') ? type : callback;
  type = (typeof type === 'function') ? false : type;

  pathExists$5(dstpath, (err, destinationExists) => {
    if (err) return callback(err)
    if (destinationExists) return callback(null)
    symlinkPaths$1(srcpath, dstpath, (err, relative) => {
      if (err) return callback(err)
      srcpath = relative.toDst;
      symlinkType$1(relative.toCwd, type, (err, type) => {
        if (err) return callback(err)
        const dir = path__default['default'].dirname(dstpath);
        pathExists$5(dir, (err, dirExists) => {
          if (err) return callback(err)
          if (dirExists) return gracefulFs.symlink(srcpath, dstpath, type, callback)
          mkdirs$2(dir, err => {
            if (err) return callback(err)
            gracefulFs.symlink(srcpath, dstpath, type, callback);
          });
        });
      });
    });
  });
}

function createSymlinkSync (srcpath, dstpath, type) {
  const destinationExists = gracefulFs.existsSync(dstpath);
  if (destinationExists) return undefined

  const relative = symlinkPathsSync$1(srcpath, dstpath);
  srcpath = relative.toDst;
  type = symlinkTypeSync$1(relative.toCwd, type);
  const dir = path__default['default'].dirname(dstpath);
  const exists = gracefulFs.existsSync(dir);
  if (exists) return gracefulFs.symlinkSync(srcpath, dstpath, type)
  mkdirsSync$1(dir);
  return gracefulFs.symlinkSync(srcpath, dstpath, type)
}

var symlink = {
  createSymlink: u$7(createSymlink),
  createSymlinkSync
};

var ensure = {
  // file
  createFile: file.createFile,
  createFileSync: file.createFileSync,
  ensureFile: file.createFile,
  ensureFileSync: file.createFileSync,
  // link
  createLink: link.createLink,
  createLinkSync: link.createLinkSync,
  ensureLink: link.createLink,
  ensureLinkSync: link.createLinkSync,
  // symlink
  createSymlink: symlink.createSymlink,
  createSymlinkSync: symlink.createSymlinkSync,
  ensureSymlink: symlink.createSymlink,
  ensureSymlinkSync: symlink.createSymlinkSync
};

var _fs;
try {
  _fs = gracefulFs;
} catch (_) {
  _fs = fs__default['default'];
}

function readFile (file, options, callback) {
  if (callback == null) {
    callback = options;
    options = {};
  }

  if (typeof options === 'string') {
    options = {encoding: options};
  }

  options = options || {};
  var fs = options.fs || _fs;

  var shouldThrow = true;
  if ('throws' in options) {
    shouldThrow = options.throws;
  }

  fs.readFile(file, options, function (err, data) {
    if (err) return callback(err)

    data = stripBom(data);

    var obj;
    try {
      obj = JSON.parse(data, options ? options.reviver : null);
    } catch (err2) {
      if (shouldThrow) {
        err2.message = file + ': ' + err2.message;
        return callback(err2)
      } else {
        return callback(null, null)
      }
    }

    callback(null, obj);
  });
}

function readFileSync (file, options) {
  options = options || {};
  if (typeof options === 'string') {
    options = {encoding: options};
  }

  var fs = options.fs || _fs;

  var shouldThrow = true;
  if ('throws' in options) {
    shouldThrow = options.throws;
  }

  try {
    var content = fs.readFileSync(file, options);
    content = stripBom(content);
    return JSON.parse(content, options.reviver)
  } catch (err) {
    if (shouldThrow) {
      err.message = file + ': ' + err.message;
      throw err
    } else {
      return null
    }
  }
}

function stringify (obj, options) {
  var spaces;
  var EOL = '\n';
  if (typeof options === 'object' && options !== null) {
    if (options.spaces) {
      spaces = options.spaces;
    }
    if (options.EOL) {
      EOL = options.EOL;
    }
  }

  var str = JSON.stringify(obj, options ? options.replacer : null, spaces);

  return str.replace(/\n/g, EOL) + EOL
}

function writeFile (file, obj, options, callback) {
  if (callback == null) {
    callback = options;
    options = {};
  }
  options = options || {};
  var fs = options.fs || _fs;

  var str = '';
  try {
    str = stringify(obj, options);
  } catch (err) {
    // Need to return whether a callback was passed or not
    if (callback) callback(err, null);
    return
  }

  fs.writeFile(file, str, options, callback);
}

function writeFileSync (file, obj, options) {
  options = options || {};
  var fs = options.fs || _fs;

  var str = stringify(obj, options);
  // not sure if fs.writeFileSync returns anything, but just in case
  return fs.writeFileSync(file, str, options)
}

function stripBom (content) {
  // we do this because JSON.parse would convert it to a utf8 string if encoding wasn't specified
  if (Buffer.isBuffer(content)) content = content.toString('utf8');
  content = content.replace(/^\uFEFF/, '');
  return content
}

var jsonfile = {
  readFile: readFile,
  readFileSync: readFileSync,
  writeFile: writeFile,
  writeFileSync: writeFileSync
};

var jsonfile_1 = jsonfile;

const u$8 = universalify.fromCallback;


var jsonfile$1 = {
  // jsonfile exports
  readJson: u$8(jsonfile_1.readFile),
  readJsonSync: jsonfile_1.readFileSync,
  writeJson: u$8(jsonfile_1.writeFile),
  writeJsonSync: jsonfile_1.writeFileSync
};

const pathExists$6 = pathExists_1.pathExists;


function outputJson (file, data, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  const dir = path__default['default'].dirname(file);

  pathExists$6(dir, (err, itDoes) => {
    if (err) return callback(err)
    if (itDoes) return jsonfile$1.writeJson(file, data, options, callback)

    mkdirs_1$1.mkdirs(dir, err => {
      if (err) return callback(err)
      jsonfile$1.writeJson(file, data, options, callback);
    });
  });
}

var outputJson_1 = outputJson;

function outputJsonSync (file, data, options) {
  const dir = path__default['default'].dirname(file);

  if (!gracefulFs.existsSync(dir)) {
    mkdirs_1$1.mkdirsSync(dir);
  }

  jsonfile$1.writeJsonSync(file, data, options);
}

var outputJsonSync_1 = outputJsonSync;

const u$9 = universalify.fromCallback;


jsonfile$1.outputJson = u$9(outputJson_1);
jsonfile$1.outputJsonSync = outputJsonSync_1;
// aliases
jsonfile$1.outputJSON = jsonfile$1.outputJson;
jsonfile$1.outputJSONSync = jsonfile$1.outputJsonSync;
jsonfile$1.writeJSON = jsonfile$1.writeJson;
jsonfile$1.writeJSONSync = jsonfile$1.writeJsonSync;
jsonfile$1.readJSON = jsonfile$1.readJson;
jsonfile$1.readJSONSync = jsonfile$1.readJsonSync;

var json = jsonfile$1;

const copySync$2 = copySync$1.copySync;
const removeSync = remove.removeSync;
const mkdirpSync$1 = mkdirs_1$1.mkdirsSync;


function moveSync (src, dest, options) {
  options = options || {};
  const overwrite = options.overwrite || options.clobber || false;

  src = path__default['default'].resolve(src);
  dest = path__default['default'].resolve(dest);

  if (src === dest) return gracefulFs.accessSync(src)

  if (isSrcSubdir$2(src, dest)) throw new Error(`Cannot move '${src}' into itself '${dest}'.`)

  mkdirpSync$1(path__default['default'].dirname(dest));
  tryRenameSync();

  function tryRenameSync () {
    if (overwrite) {
      try {
        return gracefulFs.renameSync(src, dest)
      } catch (err) {
        if (err.code === 'ENOTEMPTY' || err.code === 'EEXIST' || err.code === 'EPERM') {
          removeSync(dest);
          options.overwrite = false; // just overwriteed it, no need to do it again
          return moveSync(src, dest, options)
        }

        if (err.code !== 'EXDEV') throw err
        return moveSyncAcrossDevice(src, dest, overwrite)
      }
    } else {
      try {
        gracefulFs.linkSync(src, dest);
        return gracefulFs.unlinkSync(src)
      } catch (err) {
        if (err.code === 'EXDEV' || err.code === 'EISDIR' || err.code === 'EPERM' || err.code === 'ENOTSUP') {
          return moveSyncAcrossDevice(src, dest, overwrite)
        }
        throw err
      }
    }
  }
}

function moveSyncAcrossDevice (src, dest, overwrite) {
  const stat = gracefulFs.statSync(src);

  if (stat.isDirectory()) {
    return moveDirSyncAcrossDevice(src, dest, overwrite)
  } else {
    return moveFileSyncAcrossDevice(src, dest, overwrite)
  }
}

function moveFileSyncAcrossDevice (src, dest, overwrite) {
  const BUF_LENGTH = 64 * 1024;
  const _buff = buffer(BUF_LENGTH);

  const flags = overwrite ? 'w' : 'wx';

  const fdr = gracefulFs.openSync(src, 'r');
  const stat = gracefulFs.fstatSync(fdr);
  const fdw = gracefulFs.openSync(dest, flags, stat.mode);
  let pos = 0;

  while (pos < stat.size) {
    const bytesRead = gracefulFs.readSync(fdr, _buff, 0, BUF_LENGTH, pos);
    gracefulFs.writeSync(fdw, _buff, 0, bytesRead);
    pos += bytesRead;
  }

  gracefulFs.closeSync(fdr);
  gracefulFs.closeSync(fdw);
  return gracefulFs.unlinkSync(src)
}

function moveDirSyncAcrossDevice (src, dest, overwrite) {
  const options = {
    overwrite: false
  };

  if (overwrite) {
    removeSync(dest);
    tryCopySync();
  } else {
    tryCopySync();
  }

  function tryCopySync () {
    copySync$2(src, dest, options);
    return removeSync(src)
  }
}

// return true if dest is a subdir of src, otherwise false.
// extract dest base dir and check if that is the same as src basename
function isSrcSubdir$2 (src, dest) {
  try {
    return gracefulFs.statSync(src).isDirectory() &&
           src !== dest &&
           dest.indexOf(src) > -1 &&
           dest.split(path__default['default'].dirname(src) + path__default['default'].sep)[1].split(path__default['default'].sep)[0] === path__default['default'].basename(src)
  } catch (e) {
    return false
  }
}

var moveSync_1 = {
  moveSync
};

const u$a = universalify.fromCallback;


const copy$2 = copy$1.copy;
const remove$1 = remove.remove;
const mkdirp$1 = mkdirs_1$1.mkdirp;
const pathExists$7 = pathExists_1.pathExists;

function move (src, dest, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  const overwrite = opts.overwrite || opts.clobber || false;

  src = path__default['default'].resolve(src);
  dest = path__default['default'].resolve(dest);

  if (src === dest) return gracefulFs.access(src, cb)

  gracefulFs.stat(src, (err, st) => {
    if (err) return cb(err)

    if (st.isDirectory() && isSrcSubdir$3(src, dest)) {
      return cb(new Error(`Cannot move '${src}' to a subdirectory of itself, '${dest}'.`))
    }
    mkdirp$1(path__default['default'].dirname(dest), err => {
      if (err) return cb(err)
      return doRename(src, dest, overwrite, cb)
    });
  });
}

function doRename (src, dest, overwrite, cb) {
  if (overwrite) {
    return remove$1(dest, err => {
      if (err) return cb(err)
      return rename(src, dest, overwrite, cb)
    })
  }
  pathExists$7(dest, (err, destExists) => {
    if (err) return cb(err)
    if (destExists) return cb(new Error('dest already exists.'))
    return rename(src, dest, overwrite, cb)
  });
}

function rename (src, dest, overwrite, cb) {
  gracefulFs.rename(src, dest, err => {
    if (!err) return cb()
    if (err.code !== 'EXDEV') return cb(err)
    return moveAcrossDevice(src, dest, overwrite, cb)
  });
}

function moveAcrossDevice (src, dest, overwrite, cb) {
  const opts = {
    overwrite,
    errorOnExist: true
  };

  copy$2(src, dest, opts, err => {
    if (err) return cb(err)
    return remove$1(src, cb)
  });
}

function isSrcSubdir$3 (src, dest) {
  const srcArray = src.split(path__default['default'].sep);
  const destArray = dest.split(path__default['default'].sep);

  return srcArray.reduce((acc, current, i) => {
    return acc && destArray[i] === current
  }, true)
}

var move_1 = {
  move: u$a(move)
};

const u$b = universalify.fromCallback;



const pathExists$8 = pathExists_1.pathExists;

function outputFile (file, data, encoding, callback) {
  if (typeof encoding === 'function') {
    callback = encoding;
    encoding = 'utf8';
  }

  const dir = path__default['default'].dirname(file);
  pathExists$8(dir, (err, itDoes) => {
    if (err) return callback(err)
    if (itDoes) return gracefulFs.writeFile(file, data, encoding, callback)

    mkdirs_1$1.mkdirs(dir, err => {
      if (err) return callback(err)

      gracefulFs.writeFile(file, data, encoding, callback);
    });
  });
}

function outputFileSync (file, ...args) {
  const dir = path__default['default'].dirname(file);
  if (gracefulFs.existsSync(dir)) {
    return gracefulFs.writeFileSync(file, ...args)
  }
  mkdirs_1$1.mkdirsSync(dir);
  gracefulFs.writeFileSync(file, ...args);
}

var output = {
  outputFile: u$b(outputFile),
  outputFileSync
};

var lib = createCommonjsModule(function (module) {

module.exports = Object.assign(
  {},
  // Export promiseified graceful-fs:
  fs_1$1,
  // Export extra methods:
  copySync$1,
  copy$1,
  empty,
  ensure,
  json,
  mkdirs_1$1,
  moveSync_1,
  move_1,
  output,
  pathExists_1,
  remove
);

// Export fs.promises as a getter property so that we don't trigger
// ExperimentalWarning before fs.promises is actually accessed.

if (Object.getOwnPropertyDescriptor(fs__default['default'], 'promises')) {
  Object.defineProperty(module.exports, 'promises', {
    get () { return fs__default['default'].promises }
  });
}
});

/**
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
const glob = promisify__default['default'](globPromise__default['default']);
const NAME = 'SizePlugin';
/**
 * `new SizePlugin(options)`
 * @param {Object} options
 * @param {string} [options.pattern] minimatch pattern of files to track
 * @param {string} [options.exclude] minimatch pattern of files NOT to track
 * @param {string} [options.filename] file name to save filesizes to disk
 * @param {boolean} [options.publish] option to publish filesizes to size-plugin-store
 * @param {boolean} [options.writeFile] option to save filesizes to disk
 * @param {function} [options.stripHash] custom function to remove/normalize hashed filenames for comparison
 * @param {(item:Item)=>string?} [options.decorateItem] custom function to decorate items
 * @param {(data:Data)=>string?} [options.decorateAfter] custom function to decorate all output
 * @public
 */

class SizePlugin {
  constructor(options) {
    this.options = options || {};
    this.pattern = this.options.pattern || '**/*.{mjs,js,css,html}';
    this.exclude = this.options.exclude;
    this.options.filename = this.options.filename || 'size-plugin.json';
    this.options.writeFile = this.options.writeFile !== false;
    this.filename = path__default['default'].join(process.cwd(), this.options.filename);
  }

  reverseTemplate(filename, template) {
    // @todo - find a way to actually obtain values here.
    if (typeof template === 'function') {
      template = template({
        chunk: {
          name: 'main'
        }
      });
    }

    const hashLength = this.output.hashDigestLength;
    const replace = [];
    let count = 0;

    function replacer() {
      let out = '';

      for (let i = 1; i < arguments.length - 2; i++) {
        // eslint-disable-next-line prefer-spread,prefer-rest-params
        let value = arguments[i];
        if (replace[i - 1]) value = value.replace(/./g, '*');
        out += value;
      }

      return out;
    }

    const reg = template.replace(/(^|.+?)(?:\[([a-z]+)(?::(\d))?\]|$)/g, (s, before, type, size) => {
      let out = '';

      if (before) {
        out += `(${escapeRegExp__default['default'](before)})`;
        replace[count++] = false;
      }

      if (type === 'hash' || type === 'contenthash' || type === 'chunkhash') {
        const len = Math.round(size) || hashLength;
        out += `([0-9a-zA-Z]{${len}})`;
        replace[count++] = true;
      } else if (type) {
        out += '(.*?)';
        replace[count++] = false;
      }

      return out;
    });
    const matcher = new RegExp(`^${reg}$`);
    return matcher.test(filename) && filename.replace(matcher, replacer);
  }

  stripHash(filename) {
    return this.options.stripHash && this.options.stripHash(filename) || this.reverseTemplate(filename, this.output.filename) || this.reverseTemplate(filename, this.output.chunkFilename) || filename;
  }

  async readFromDisk(filename) {
    try {
      const oldStats = await lib.readJSON(filename);
      return oldStats.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      return [];
    }
  }

  async writeToDisk(filename, stats) {
    if (this.mode === 'production' && stats.files.some(file => file.diff !== 0)) {
      const data = await this.readFromDisk(filename);
      data.unshift(stats);

      if (this.options.writeFile) {
        await lib.ensureFile(filename);
        await lib.writeJSON(filename, data);
      }

      this.options.publish && (await publishSizes(data, this.options.filename));
    }
  }

  async save(files) {
    const stats = {
      timestamp: Date.now(),
      files: files.map(file => ({
        filename: file.name,
        previous: file.sizeBefore,
        size: file.size,
        diff: file.size - file.sizeBefore
      }))
    };
    this.options.publish && (await publishDiff(stats, this.options.filename));
    this.options.save && (await this.options.save(stats));
    await this.writeToDisk(this.filename, stats);
  }

  async load(outputPath) {
    const data = await this.readFromDisk(this.filename);

    if (data.length) {
      const [{
        files
      }] = data;
      return toFileMap(files);
    }

    return this.getSizes(outputPath);
  }

  async apply(compiler) {
    const outputPath = compiler.options.output.path;
    this.output = compiler.options.output;
    this.sizes = this.load(outputPath);
    this.mode = compiler.options.mode;

    const afterEmit = (compilation, callback) => {
      this.outputSizes(compilation.assets).then(output => {
        if (output) {
          process.nextTick(() => {
            console.log('\n' + output);
          });
        }
      }).catch(console.error).then(callback);
    }; // for webpack version > 4


    if (compiler.hooks && compiler.hooks.emit) {
      compiler.hooks.emit.tapAsync(NAME, afterEmit);
    } else {
      // for webpack version < 3
      compiler.plugin('after-emit', afterEmit);
    }
  }

  async outputSizes(assets) {
    // map of filenames to their previous size
    // Fix #7 - fast-async doesn't allow non-promise values.
    const sizesBefore = await Promise.resolve(this.sizes);
    const isMatched = minimatch__default['default'].filter(this.pattern);
    const isExcluded = this.exclude ? minimatch__default['default'].filter(this.exclude) : () => false;
    const assetNames = Object.keys(assets).filter(file => isMatched(file) && !isExcluded(file));
    const sizes = await Promise.all(assetNames.map(name => gzipSize__default['default'](assets[name].source()))); // map of de-hashed filenames to their final size

    this.sizes = toMap(assetNames.map(filename => this.stripHash(filename)), sizes); // get a list of unique filenames

    const files = [...Object.keys(sizesBefore), ...Object.keys(this.sizes)].filter(dedupe);
    const width = Math.max(...files.map(file => file.length));
    let output = '';
    const items = [];

    for (const name of files) {
      const size = this.sizes[name] || 0;
      const sizeBefore = sizesBefore[name] || 0;
      const delta = size - sizeBefore;
      const msg = new Array(width - name.length + 2).join(' ') + name + ' ⏤  ';
      const color = size > 100 * 1024 ? 'red' : size > 40 * 1024 ? 'yellow' : size > 20 * 1024 ? 'cyan' : 'green';
      let sizeText = chalk__default['default'][color](prettyBytes__default['default'](size));
      let deltaText = '';

      if (delta && Math.abs(delta) > 1) {
        deltaText = (delta > 0 ? '+' : '') + prettyBytes__default['default'](delta);

        if (delta > 1024) {
          sizeText = chalk__default['default'].bold(sizeText);
          deltaText = chalk__default['default'].red(deltaText);
        } else if (delta < -10) {
          deltaText = chalk__default['default'].green(deltaText);
        }

        sizeText += ` (${deltaText})`;
      }

      let text = msg + sizeText + '\n';
      const item = {
        name,
        sizeBefore,
        size,
        sizeText,
        delta,
        deltaText,
        msg,
        color
      };
      items.push(item);

      if (this.options.decorateItem) {
        text = this.options.decorateItem(text, item) || text;
      }

      output += text;
    }

    if (this.options.decorateAfter) {
      const opts = {
        sizes: items,
        raw: {
          sizesBefore,
          sizes: this.sizes
        },
        output
      };
      const text = this.options.decorateAfter(opts);

      if (text) {
        output += '\n' + text.replace(/^\n/g, '');
      }
    }

    await this.save(items);
    return output;
  }

  async getSizes(cwd) {
    const files = await glob(this.pattern, {
      cwd,
      ignore: this.exclude
    });
    const sizes = await Promise.all(files.map(file => gzipSize__default['default'].file(path__default['default'].join(cwd, file)).catch(() => null)));
    return toMap(files.map(filename => this.stripHash(filename)), sizes);
  }

}
/**
 * @name Item
 * @typedef Item
 * @property {string} name Filename of the item
 * @property {number} sizeBefore Previous size, in kilobytes
 * @property {number} size Current size, in kilobytes
 * @property {string} sizeText Formatted current size
 * @property {number} delta Difference from previous size, in kilobytes
 * @property {string} deltaText Formatted size delta
 * @property {string} msg Full item's default message
 * @property {string} color The item's default CLI color
 * @public
 */

/**
 * @name Data
 * @typedef Data
 * @property {Item[]} sizes List of file size items
 * @property {string} output Current buffered output
 * @public
 */

module.exports = SizePlugin;
