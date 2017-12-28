const _ = require('lodash')
const webpack = require('webpack')
const FrontendConfig = require('./frontend')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const AssetsPlugin = require('assets-webpack-plugin')

module.exports = class FrontendBuildConfig extends FrontendConfig {

  constructor (...args) {
    super(...args)
    _.defaultsDeep(this.options, {
      frontend: {
        productionSourceMaps: false,
        cache: false,
        uglify: true
      }
    })

    // Add hash to bundles' filenames for long-term caching in production
    this.config.output.filename = '[name].[hash].js'

    this.config.cache = this.options.frontend.cache
    if (this.options.frontend.productionSourceMaps) {
      this.config.devtool = 'source-map'
    }

    this.config.stats = this.config.stats || {}
    if (this.config.stats.children == null) this.config.stats.children = false

    this.config.module.rules = this.config.module.rules.concat([{
      test: /\.css$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
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
      })
    }])

    this.config.module.rules = this.config.module.rules.concat(
        this._getBeforeStylusRule())

    this.config.module.rules.push(this._getStylusRule())

    let jsxRules = [
      {
        loader: 'babel-loader',
        options: {
          presets: ['es2015', 'stage-0', 'react'],
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

    // Set production environment to get minified library builds (e.g. React)
    this.config.plugins.push(new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }))

    this.config.plugins.push(new ExtractTextPlugin('[name].css', {
      priorityModules: this.options.priorityModules || []
    }))

    if (this.options.frontend.uglify) {
      let uglifyOptions = {
        compress: {
          warnings: false
        }
      }
      if (this.options.frontend.productionSourceMaps) {
        uglifyOptions.sourceMap = true
      }
      this.config.plugins.push(new webpack.optimize.UglifyJsPlugin(uglifyOptions))
      // Switch loaders to minimized mode
      this.config.plugins.push(new webpack.LoaderOptionsPlugin({
        minimize: true
      }))
    }

    // Write hash info metadata into json file
    this.config.plugins.push(new AssetsPlugin({
      filename: 'assets.json',
      fullPath: false,
      path: this.config.output.path
    }))
  }

  _getPostCssPlugins () {
    return super._getPostCssPlugins().concat([require('csswring')()])
  }

  _getActualStylusRule (...args) {
    return ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: super._getActualStylusRule(...args)
    })
  }

}

