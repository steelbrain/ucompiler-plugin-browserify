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

var _stream = require('stream');

var _convertSourceMap = require('convert-source-map');

var _convertSourceMap2 = _interopRequireDefault(_convertSourceMap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

const BrowserifyOptions = ['external', 'transforms', 'require', 'exclude', 'ignore', 'plugins'];

const compiler = exports.compiler = false;
const minifier = exports.minifier = false;

function process(contents, _ref) {
  let rootDirectory = _ref.rootDirectory;
  let filePath = _ref.filePath;
  let config = _ref.config;
  let state = _ref.state;

  const stream = new _stream.Readable();
  stream._read = function () {
    stream.push(contents);
    stream.push(null);
  };

  const fileDirectory = _path2.default.dirname(filePath);
  const options = Object.assign(config.browserify || {}, {
    basedir: fileDirectory,
    debug: true,
    filename: _path2.default.basename(filePath),
    paths: [fileDirectory, rootDirectory],
    fullPaths: true
  });

  const browserified = new _browserify2.default(options);

  return new Promise(function (resolve, reject) {
    BrowserifyOptions.forEach(function (name) {
      if (typeof options[name] !== 'undefined') {
        options[name].forEach(function (options) {
          browserified[name].apply(browserified, _toConsumableArray(options));
        });
      }
    });
    browserified.add(stream);
    browserified.bundle(function (error, buffer) {
      if (error) {
        reject(error);
      } else {
        const output = buffer.toString();
        let sourceMap = output.split(/\r\n|\n/g);
        sourceMap.pop();
        sourceMap = sourceMap.pop();

        const sourceMapParsed = JSON.parse(_convertSourceMap2.default.fromComment(sourceMap).toJSON());
        // First item is browserify
        sourceMapParsed.sources.shift();
        sourceMapParsed.sources[1] = _path2.default.basename(filePath);
        resolve({
          contents: output.slice(0, -1 * (sourceMap.length + 2)),
          sourceMap: {
            version: sourceMapParsed.version,
            sources: sourceMapParsed.sources,
            sourcesContent: sourceMapParsed.sourcesContent,
            names: sourceMapParsed.names,
            mappings: sourceMapParsed.mappings
          }
        });
      }
    });
    browserified.pipeline.on('file', function (file) {
      state.imports.push(file);
    });
  });
}