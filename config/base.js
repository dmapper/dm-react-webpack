const _ = require('lodash')
const path = require('path')

module.exports = class BaseConfig {

  constructor (options = {}) {
    this.options = options

    _.defaults(this.options, {
      noParse: undefined,
      moduleConfigs: undefined,
      unsafeCache: true,
      dirname: process.cwd(),
      moduleMode: false,
      devtool: 'source-map',
      preLoaders: [],
      postLoaders: []
    })

    this.config = {}

    if (this.options.moduleConfigs != null) {
      for (let key in this.options.moduleConfigs) {
        if (!this.options.moduleConfigs.hasOwnProperty(key)) continue
        this.config[key] = this.options.moduleConfigs[key]
      }
    }

    this.config.module = {
      loaders: [{
        include: /\.json$/,
        loader: 'json'
      }, {
        include: /\.yaml$/,
        loader: 'json!yaml'
      }]
    }

    // Append additional loaders to the beginning of default loaders array
    if (this.options.loaders != null && _.isArray(this.options.loaders)) {
      this.config.module.loaders = this.options.loaders.concat(this.config.module.loaders)
    }

    this.config.resolveLoader = {
      root: path.join(__dirname, '/../node_modules'),
      fallback: path.join(__dirname, '/../..')
    }

    this.config.resolve = {
      extensions: [ '', '.json', '.js', '.jsx', '.yaml', '.coffee' ],
      fallback: path.join(__dirname, '/../..')
    }

    if (this.options.resolve && this.options.resolve.alias != null) {
      this.config.resolve.alias = this.options.resolve.alias
    }

    this.config.plugins = []

    this.config.module.preLoaders = this.options.preLoaders

    this.config.module.postLoaders = this.options.postLoaders

    if (this.options.noParse != null) {
      this.config.module.noParse = this.options.noParse
    }
  }

  _sanitizeApps (apps) {
    let res = {}
    // If apps are passed as array we treat them as folders in project root
    if (_.isArray(apps)) {
      apps.forEach((appName) => {
        res[appName] = path.join(this.options.dirname, appName)
      })
    } else {
      res = apps
    }
    return res
  }

  _getHeaderEntry () { return [] }

  _getEntries (apps, baseEntry = []) {
    baseEntry = this._getHeaderEntry().concat(baseEntry)
    let res = {}
    for (let appName in apps) {
      if (!apps.hasOwnProperty(appName)) continue
      let entry = apps[appName]
      if (!_.isArray(entry)) entry = [entry]
      res[appName] = baseEntry.concat(entry)
    }
    return res
  }

}
