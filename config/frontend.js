const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const autoprefixer = require('autoprefixer')
const postcssFilenamePrefix = require('postcss-filename-prefix')
const webpack = require('webpack')
const BaseConfig = require('./base')
const url = require('url')

module.exports = class FrontendConfig extends BaseConfig {

  constructor (...args) {
    super(...args)
    _.defaultsDeep(this.options, {
      stylus: {},
      frontend: {
        loaders: [],
        preLoaders: [],
        postLoaders: []
      }
    })

    // If DEVSERVER_URL is specified, get port from it
    if (process.env.DEVSERVER_URL) {
      this.options.webpackPort = url.parse(process.env.DEVSERVER_URL).port ||
          process.env.DEVSERVER_PORT || 80
    }

    this.options.webpackPort = this.options.webpackPort ||
        process.env.DEVSERVER_PORT || 3010
    this.options.webpackUrl = this.options.webpackUrl ||
        process.env.DEVSERVER_URL || `http://localhost:${this.options.webpackPort}`

    if (!this.options.apps) this.options.apps = ['app']

    this.apps = this._sanitizeApps(this.options.apps)
    this.beforeStylusEntries = this._getBeforeStylusEntries()

    this.config.target = 'web'

    this.config.entry = this._getEntries(this.apps, this.options.frontend.baseEntry)

    this.config.module.loaders = this.config.module.loaders.concat([
      {
        test: /\.svg$/,
        loaders: ['babel?presets[]=es2015&presets[]=stage-0&presets[]=react', 'react-svg?jsx=1'],
        exclude: /(node_modules)/
      }
    ])

    // Append additional loaders to the beginning of default loaders array
    ;['loaders', 'preLoaders', 'postLoaders'].forEach((loaderType) => {
      this.config.module[loaderType] = this.options.frontend[loaderType].concat(
        this.config.module[loaderType])
    })

    if (this.options.frontend.resolve && this.options.frontend.resolve.alias != null) {
      this.config.resolve.alias = this.options.frontend.resolve.alias
    }

    this.config.output = {
      path: path.join(this.options.dirname, '/build/client'),
      pathInfo: true,
      publicPath: `http://localhost:${this.options.webpackPort}/build/client/`,
      filename: '[name].js'
    }

    this.config.plugins = this.config.plugins.concat([
      // Don't bundle server-specific modules on client
      new webpack.NormalModuleReplacementPlugin(
          /\.(server|server\.coffee|server\.js)$/, require.resolve('node-noop'))
    ])
  }

  _getHeaderEntry () {
    let res = []
    return res
  }

  _getBeforeStylusEntries () {
    let res = {}
    for (let appName in this.apps) {
      if (!this.apps.hasOwnProperty(appName)) continue
      let entry = this.apps[appName]

      entry = _.isArray(entry) ? entry[0] : entry
      let beforeStyl = path.join(entry, 'styles/before.styl')
      if (fs.existsSync(beforeStyl)) {
        res[entry] = beforeStyl
      }
    }
    return res
  }

  _getPostCss (plugins = []) {
    let DEFAULT_POSTCSS_PLUGINS = [
      autoprefixer({ browsers: ['last 2 version', '> 1%', 'ie 10', 'android 4'] })
    ]
    if (this.options.moduleMode) {
      DEFAULT_POSTCSS_PLUGINS.push(postcssFilenamePrefix())
    }
    if (!_.isArray(plugins)) plugins = [plugins]
    return () => DEFAULT_POSTCSS_PLUGINS.concat(plugins)
  }

  _getStylusParams () {
    let DEFAULT_STYLUS = {
      'include css': true
    }
    return _.merge({}, this.options.stylus, DEFAULT_STYLUS)
  }

  _getActualStylusLoader (params = {}) {
    params = _.merge({}, this._getStylusParams(), params)
    let strStylusParams = JSON.stringify(params)
    return `raw!postcss!stylus?${strStylusParams}`
  }

  // load styles/before.styl if it's present in point entry
  _getBeforeStylusLoaders () {
    let res = []
    for (let entry in this.beforeStylusEntries) {
      if (!this.beforeStylusEntries.hasOwnProperty(entry)) continue
      let beforeStyl = this.beforeStylusEntries[entry]

      res.push({
        test: (absPath) => {
          return /\.styl$/.test(absPath) && absPath.indexOf(entry) !== -1
        },
        loader: this._getActualStylusLoader({ import: [beforeStyl] })
      })
    }
    return res
  }

  _getStylusLoader () {
    let beforeStylusEntries = this.beforeStylusEntries
    return {
      test: (absPath) => {
        if (!/\.styl$/.test(absPath)) return false
        // Don't process this if was processed previously by any entry-specific loader
        for (let entry in beforeStylusEntries) {
          if (!beforeStylusEntries.hasOwnProperty(entry)) continue
          if (absPath.indexOf(entry) !== -1) return false
        }
        return true
      },
      loader: this._getActualStylusLoader()
    }
  }

}
