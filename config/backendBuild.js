const _ = require('lodash')
const webpack = require('webpack')
const BackendConfig = require('./backend')

module.exports = class BackendBuildConfig extends BackendConfig {

  constructor (...args) {
    super(...args)
    _.defaultsDeep(this.options, {
      backend: {
        cache: false,
        uglify: true
      }
    })

    this.config.cache = this.options.backend.cache
    this.config.debug = false
    this.config.devtool = 'source-map'

    if (this.options.backend.uglify) {
      this.config.plugins.push(new webpack.optimize.UglifyJsPlugin({
        sourceMap: true,
        compress: {
          warnings: false
        }
      }))
      // Switch loaders to minimized mode
      this.config.plugins.push(new webpack.LoaderOptionsPlugin({
        minimize: true
      }))
    }
  }

}
