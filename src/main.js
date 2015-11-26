'use babel'

import Path from 'path'
import Browserify from 'browserify'
import {Readable} from 'streams'

const PrivateOptions = ['external', 'transforms', 'require', 'exclude', 'ignore', 'plugins']

export const compiler = false
export const minifier = false

export function process(contents, {root, relativePath, absolutePath, fileName}, {state, config}) {
  const fileDir = Path.dirname(absolutePath)
  const stream = new Readable()
  stream._read = function() {
    stream.push(contents)
    stream.push(null)
  }

  const options = Object.assign({
    fullPaths: true
  }, config.browserify, {
    basedir: fileDir,
    debug: true,
    filename: fileName,
    paths: [fileDir, root]
  })
  const optionsPrivate = {}

  PrivateOptions.forEach(function(name) {
    if (typeof options[name] !== 'undefined') {
      optionsPrivate[name] = options[name]
      delete options[name]
    } else {
      optionsPrivate[name] = []
    }
  })

  const browserified = new Browserify(options)

  PrivateOptions.forEach(function(name) {
    const options = optionsPrivate[name]
    browserified[name](...options)
  })

  return new Promise(function(resolve, reject) {
    browserified.bundle(function(error, buffer) {
      if (error) {
        reject(error)
      } else resolve(buffer.toString())
    })
    browserified.pipeline.on('file', function(file){
      state.imports.push(file)
    })
  })
}
