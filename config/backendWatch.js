const _ = require('lodash')
const webpack = require('webpack')
const BackendConfig = require('./backend')

module.exports = class BackendWatchConfig extends BackendConfig {

  constructor (...args) {
    super(...args)

    this.config.cache = true
    if (this.options.unsafeCache !== false) {
      this.config.resolve.unsafeCache = this.options.unsafeCache
    }
    this.config.devtool = this.options.backend.devtool != null
        ? this.options.backend.devtool
        : this.options.devtool
    this.config.plugins.push(new webpack.LoaderOptionsPlugin({
      debug: true
    }))
  }

}
