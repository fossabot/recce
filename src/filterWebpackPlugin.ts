import { Compiler } from 'webpack'

import mm = require('micromatch')
import { defaults, keys, omit, pick } from 'lodash'

export interface FilterWebpackPluginOptions {
  select: boolean
  patterns: string[]
}

export class FilterWebpackPlugin {
  public options: FilterWebpackPluginOptions

  constructor(options: Partial<FilterWebpackPluginOptions>) {
    this.options = defaults({}, options, { select: false, patterns: [] })
  }

  public apply(compiler: Compiler) {
    const filter = this.options.select === true ? pick : omit

    compiler.hooks.emit.tapAsync('FilterWebpackPlugin', (compilation, callback) => {
      if (this.options.patterns.length > 0) {
        const files = keys(compilation.assets)
        const matchedFiles = mm(files, this.options.patterns)

        compilation.assets = filter(compilation.assets, matchedFiles)
      }

      callback()
    })
  }
}
