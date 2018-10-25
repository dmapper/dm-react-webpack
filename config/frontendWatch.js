let _ = require('lodash')
let path = require('path')
let webpack = require('webpack')
let FrontendConfig = require('./frontend')

module.exports = class FrontendWatchConfig extends FrontendConfig {

  constructor (...args) {
    super(...args)

    this.config.cache = true
    this.config.debug = true
    if (this.options.unsafeCache !== false) {
      this.config.resolve.unsafeCache = this.options.unsafeCache
    }
    this.config.devtool = this.options.frontend.devtool != null
        ? this.options.frontend.devtool
        : this.options.devtool

    this.config.postcss = this._getPostCss()

    this.config.module.loaders = this.config.module.loaders.concat([{
      test: /\.css$/,
      loader: 'style!raw!postcss'
    }])

    this.config.module.loaders = this.config.module.loaders.concat(
        this._getBeforeStylusLoaders())

    this.config.module.loaders.push(this._getStylusLoader())

    let jsxLoaders = ['babel?cacheDirectory&presets[]=es2015&presets[]=stage-0&presets[]=react&presets[]=react-hmre&plugins[]=add-module-exports&plugins[]=transform-decorators-legacy']

    if (this.options.frontend.classPrefix) jsxLoaders.push('react-prefix')

    this.config.module.postLoaders.push({
      test: /\.jsx?$/,
      loaders: jsxLoaders,
      exclude: /node_modules/
    })

    if (this.options.frontend.forceCompileModules) {
      const array = this.options.frontend.forceCompileModules
      this.config.module.postLoaders.push({
        test: /\.jsx?$/,
        loaders: jsxLoaders,
        include: new RegExp(`node_modules/(?:${array.join('|')})`)
      })
    }

    this._initDevConfig()
  }

  _getActualStylusLoader (...args) {
    return 'style!' + super._getActualStylusLoader(...args)
  }

  // Configure webpack-dev-server and hot reloading
  _initDevConfig () {
    for (let name in this.config.entry) {
      if (!this.config.entry.hasOwnProperty(name)) continue
      let entry = this.config.entry[name]

      this.config.entry[name] = [
        `webpack-dev-server/client?${this.options.webpackUrl}`,
        'webpack/hot/dev-server',
        path.join(__dirname, '../wdsVisual')
      ].concat(entry || [])
    }

    this.config.plugins = this.config.plugins.concat([
      new webpack.HotModuleReplacementPlugin({ quiet: true })
    ])

    this.config.devServer = {
      publicPath: '/build/client/',
      hot: true,
      inline: true,
      lazy: false,
      stats: { colors: true },
      noInfo: true,
      headers: { 'Access-Control-Allow-Origin': '*' },
      host: '0.0.0.0',
      port: this.options.webpackPort,
      compress: true
    }
  }

}

