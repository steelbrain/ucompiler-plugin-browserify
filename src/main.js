'use babel'

import Path from 'path'
import Browserify from 'browserify'
import {Readable} from 'streams'

const BrowserifyOptions = ['external', 'transforms', 'require', 'exclude', 'ignore', 'plugins']

export const compiler = false
export const minifier = false

export function process(contents, {rootDirectory, filePath, config, state}) {
  const stream = new Readable()
  stream._read = function() {
    stream.push(contents)
    stream.push(null)
  }

  const options = Object.assign(config.browserify, {
    basedir: rootDirectory,
    debug: true,
    filename: Path.basename(filePath),
    paths: [rootDirectory],
    fullPaths: true
  })

  const browserified = new Browserify(options)

  return new Promise(function(resolve, reject) {
    browserified.bundle(function(error, buffer) {
      if (error) {
        reject(error)
      } else resolve(buffer.toString())
    })
    BrowserifyOptions.forEach(function(name) {
      if (typeof options[name] !== 'undefined') {
        options[name].forEach(function(options) {
          browserified[name](...options)
        })
      }
    })
    browserified.pipeline.on('file', function(file){
      state.imports.push(file)
    })
  })
}
