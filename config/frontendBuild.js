const _ = require('lodash')
const csswring = require('csswring')
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
    this.config.debug = false
    if (this.options.frontend.productionSourceMaps) {
      this.config.devtool = 'source-map'
    }

    this.config.postcss = this._getPostCss([
      csswring() // minification
    ])

    this.config.stats = this.config.stats || {}
    if (this.config.stats.children == null) this.config.stats.children = false

    this.config.module.loaders = this.config.module.loaders.concat([{
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('style-loader', 'raw!postcss')
    }])

    this.config.module.loaders = this.config.module.loaders.concat(
        this._getBeforeStylusLoaders())

    this.config.module.loaders.push(this._getStylusLoader())

    let jsxLoaders = ['babel?presets[]=es2015&presets[]=stage-0&presets[]=react&plugins[]=add-module-exports&plugins[]=transform-decorators-legacy']

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
      if (!this.options.frontend.productionSourceMaps) {
        uglifyOptions.sourceMap = false
      }
      this.config.plugins.push(new webpack.optimize.UglifyJsPlugin(uglifyOptions))
    }

    // Write hash info metadata into json file
    this.config.plugins.push(new AssetsPlugin({
      filename: 'assets.json',
      fullPath: false,
      path: this.config.output.path
    }))
  }

  _getActualStylusLoader (...args) {
    return ExtractTextPlugin.extract('style-loader', super._getActualStylusLoader(...args))
  }

}

