let _ = require('lodash')
let path = require('path')
let webpack = require('webpack')
let FrontendConfig = require('./frontend')

module.exports = class FrontendWatchConfig extends FrontendConfig {

  constructor (...args) {
    super(...args)

    this.config.cache = true
    if (this.options.unsafeCache !== false) {
      this.config.resolve.unsafeCache = this.options.unsafeCache
    }
    this.config.devtool = this.options.frontend.devtool != null
        ? this.options.frontend.devtool
        : this.options.devtool

    this.config.module.rules = this.config.module.rules.concat([{
      test: /\.css$/,
      use: [
        'style-loader',
        'raw-loader',
        {
          loader: 'postcss-loader',
          options: {
            ident: 'postcss',
            sourceMap: true,
            plugins: this._getPostCssPlugins()
          }
        }
      ]
    }])

    this.config.module.rules = this.config.module.rules.concat(
        this._getBeforeStylusRule())

    this.config.module.rules.push(this._getStylusRule())

    let jsxRules = [
      {
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
          presets: ['es2015', 'stage-0', 'react', 'react-hmre'],
          plugins: ['add-module-exports', 'transform-decorators-legacy']
        }
      }
    ]

    if (this.options.frontend.classPrefix) jsxRules.push('react-prefix-loader')

    this.config.module.rules.push({
      test: /\.jsx?$/,
      use: jsxRules,
      enforce: 'post',
      exclude: /node_modules/
    })

    this._initDevConfig()
  }

  _getActualStylusRule (...args) {
    return ['style-loader'].concat(super._getActualStylusRule(...args))
  }

  // Configure webpack-dev-server and hot reloading
  _initDevConfig () {
    for (let name in this.config.entry) {
      if (!this.config.entry.hasOwnProperty(name)) continue
      let entry = this.config.entry[name]

      this.config.entry[name] = [
        // `webpack-dev-server/client?${this.options.webpackUrl}`,
        // 'webpack/hot/dev-server',
        path.join(__dirname, '../wdsVisual')
      ].concat(entry || [])
    }

    this.config.plugins = this.config.plugins.concat([
      new webpack.HotModuleReplacementPlugin({ quiet: true })
    ])

    this.config.plugins.push(new webpack.LoaderOptionsPlugin({
      debug: true
    }))

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

