'use babel'

import Path from 'path'
import Browserify from 'browserify'
import {Readable} from 'stream'
import convert from 'convert-source-map'

const BrowserifyOptions = ['external', 'transforms', 'require', 'exclude', 'ignore', 'plugins']

export const compiler = false
export const minifier = false

export function process(contents, {rootDirectory, filePath, config, state}) {
  const stream = new Readable()
  stream._read = function() {
    stream.push(contents)
    stream.push(null)
  }

  const fileDirectory = Path.dirname(filePath)
  const options = Object.assign(config.browserify || {}, {
    basedir: fileDirectory,
    debug: true,
    filename: Path.basename(filePath),
    paths: [fileDirectory, rootDirectory],
    fullPaths: true
  })

  const browserified = new Browserify(options)

  return new Promise(function(resolve, reject) {
    BrowserifyOptions.forEach(function(name) {
      if (typeof options[name] !== 'undefined') {
        options[name].forEach(function(options) {
          browserified[name](...options)
        })
      }
    })
    browserified.add(stream)
    browserified.bundle(function(error, buffer) {
      if (error) {
        reject(error)
      } else {
        const output = buffer.toString()
        let sourceMap = output.split(/\r\n|\n/g)
        sourceMap.pop()
        sourceMap = sourceMap.pop()

        const sourceMapParsed = JSON.parse(convert.fromComment(sourceMap).toJSON())
        // First item is browserify
        sourceMapParsed.sources.shift()
        sourceMapParsed.sources[1] = Path.basename(filePath)
        resolve({
          contents: output.slice(0, -1 * (sourceMap.length + 2)),
          sourceMap: {
            version: sourceMapParsed.version,
            sources: sourceMapParsed.sources,
            sourcesContent: sourceMapParsed.sourcesContent,
            names: sourceMapParsed.names,
            mappings: sourceMapParsed.mappings
          }
        })
      }
    })
    browserified.pipeline.on('file', function(file){
      state.imports.push(file)
    })
  })
}
