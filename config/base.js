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
      // Existing addons: [
      // ]
      addons: []
    })

    this.config = {}

    if (this.options.moduleConfigs != null) {
      for (let key in this.options.moduleConfigs) {
        if (!this.options.moduleConfigs.hasOwnProperty(key)) continue
        this.config[key] = this.options.moduleConfigs[key]
      }
    }

    this.config.module = {
      rules: [{
        include: /\.json$/,
        use: ['json-loader']
      }, {
        include: /\.yaml$/,
        use: ['json-loader', 'yaml-loader']
      }]
    }

    // Append additional rules to the beginning of default rules array
    if (this.options.rules != null && _.isArray(this.options.rules)) {
      this.config.module.rules = this.options.rules.concat(this.config.module.rules)
    }

    this.config.resolveLoader = {
      modules: [path.join(__dirname, '/../node_modules'), path.join(__dirname, '/../..')]
    }

    this.config.resolve = {
      extensions: [ '.json', '.js', '.jsx', '.yaml', '.coffee' ],
      modules: ['node_modules', path.join(__dirname, '/../..')]
    }

    if (this.options.resolve && this.options.resolve.alias != null) {
      this.config.resolve.alias = this.options.resolve.alias
    }

    this.config.plugins = this.options.plugins || []

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

  _getCoreEntries () {
    return [
      // Required to properly support compiled generators and async/await in the browser
      'babel-polyfill'
    ]
  }

  _getEntries (apps, baseEntry = []) {
    baseEntry = this._getCoreEntries().concat(this._getHeaderEntry(), baseEntry)
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
