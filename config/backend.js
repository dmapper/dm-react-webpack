const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const webpack = require('webpack')
const BaseConfig = require('./base')

module.exports = class BackendConfig extends BaseConfig {

  constructor (...args) {
    super(...args)

    _.defaultsDeep(this.options, {
      backend: {
        loaders: [],
        preLoaders: [],
        postLoaders: []
      }
    })
    if (!this.options.backendApps) this.options.backendApps = ['server']

    this.apps = this._sanitizeApps(this.options.backendApps)

    this.config.target = 'node'

    this.config.entry = this._getEntries(this.apps, this.options.backend.baseEntry)

    // Babel
    this.config.module.loaders = this.config.module.loaders.concat([{
      test: /\.(server\.jsx|js)$/,
      loaders: ['babel?presets[]=es2015&presets[]=stage-0&presets[]=react&plugins[]=add-module-exports&plugins[]=transform-decorators-legacy'],
      exclude: /node_modules/
    }])

    // Append additional loaders to the beginning of default loaders array
    ;['loaders', 'preLoaders', 'postLoaders'].forEach((loaderType) => {
      this.config.module[loaderType] = this.options.backend[loaderType].concat(
        this.config.module[loaderType])
    })

    if (this.options.backend.resolve && this.options.backend.resolve.alias != null) {
      this.config.resolve.alias = this.options.backend.resolve.alias
    }

    this.config.output = {
      path: path.join(this.options.dirname, 'build'),
      filename: '[name].js'
    }

    this.config.node = {
      __dirname: true,
      __filename: true
    }

    this.config.externals = this._getExternalsFn()

    this.config.recordsPath = path.join(this.options.dirname, 'build/_records')

    this.config.plugins = [
      new webpack.NormalModuleReplacementPlugin(/\.(styl|css)$/, require.resolve('node-noop')),
      new webpack.NormalModuleReplacementPlugin(/((?!\.server).{7}|^.{0,6})\.jsx$/, require.resolve('../EmptyComponent')),
      new webpack.BannerPlugin([
        'try {',
        '  require.resolve("source-map-support");',
        '  require("source-map-support").install();',
        '} catch(e) {',
        '  require("dm-react-webpack/node_modules/source-map-support").install();',
        '}'
      ].join(' '), { raw: true, entryOnly: false })
    ]
  }

  // Treat any module in node_modules or required from any module
  // within node_modules as an external dependency.
  // Bundle only modules which start from dm-* and whitelisted modules
  _getExternalsFn () {
    // Whitelist of modules to bundle on server
    let whitelistModules = [
    ].concat(this.options.serverBundle && this.options.serverBundle.include || [])
    // Blacklist of server modules (which shouldn't be bundled)
    let blacklistModules = [
      'dm-sharedb-server',
      'dm-worker'
    ].concat(this.options.serverBundle && this.options.serverBundle.exclude || [])
    let modulesPath = path.join(this.options.dirname, 'node_modules')
    let nodeModules = fs.readdirSync(modulesPath).filter((name) => {
      return blacklistModules.indexOf(name) !== -1 ||
          (name !== '.bin' && !/^dm-/.test(name) && whitelistModules.indexOf(name) === -1)
    })

    return (context, request, cb) => {
      let inModules = false
      for (let i = 0; i < nodeModules.length; i++) {
        let moduleName = nodeModules[ i ]
        let testContext = new RegExp(`node_modules/${moduleName}(?:$|/)`).test(context)
        let testRequest = new RegExp(`^${moduleName}(?:$|/)`).test(request)
        if (testContext || testRequest) {
          inModules = true
          break
        }
      }
      if (inModules) {
        cb(null, `commonjs ${request}`)
      } else {
        cb()
      }
    }
  }

}
