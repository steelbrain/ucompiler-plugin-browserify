'use strict';
'use babel';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.minifier = exports.compiler = undefined;
exports.process = process;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _browserify = require('browserify');

var _browserify2 = _interopRequireDefault(_browserify);

var _streams = require('streams');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PrivateOptions = ['external', 'transforms', 'require', 'exclude', 'ignore', 'plugins'];

const compiler = exports.compiler = false;
const minifier = exports.minifier = false;

function process(contents, _ref, _ref2) {
  let root = _ref.root;
  let relativePath = _ref.relativePath;
  let absolutePath = _ref.absolutePath;
  let fileName = _ref.fileName;
  let state = _ref2.state;
  let config = _ref2.config;

  const fileDir = _path2.default.dirname(absolutePath);
  const stream = new _streams.Readable();
  stream._read = function () {
    stream.push(contents);
    stream.push(null);
  };

  const options = Object.assign({
    fullPaths: true
  }, config.browserify, {
    basedir: fileDir,
    debug: true,
    filename: fileName,
    paths: [fileDir, root]
  });
  const optionsPrivate = {};

  PrivateOptions.forEach(function (name) {
    if (typeof options[name] !== 'undefined') {
      optionsPrivate[name] = options[name];
      delete options[name];
    } else {
      optionsPrivate[name] = [];
    }
  });

  const browserified = new _browserify2.default(options);

  PrivateOptions.forEach(function (name) {
    const options = optionsPrivate[name];
    browserified[name](...options);
  });

  return new Promise(function (resolve, reject) {
    browserified.bundle(function (error, buffer) {
      if (error) {
        reject(error);
      } else resolve(buffer.toString());
    });
    browserified.pipeline.on('file', function (file) {
      state.imports.push(file);
    });
  });
}