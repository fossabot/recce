import path from 'path'
import webpack = require('webpack')
import { BuildResult } from '../types'
import { compact, concat, filter, isNull, isUndefined, map, noop } from 'lodash'
import { condBuild, condWatch, webpackConfiguration } from '../selectors'
import { store } from '../store'

export const webpackBuild = async (
  module: 'cjs' | 'umd',
  cb: (result: BuildResult) => void = noop
): Promise<{
  compiler: webpack.Compiler
  close: () => void
  invalidate: () => void
}> => {
  const configuration = webpackConfiguration(module)(store.getState())

  const compiler = webpack(configuration)

  const method = (handler: webpack.ICompiler.Handler) => {
    const state = store.getState()

    if (condBuild(state)) {
      return compiler.run(handler) as undefined
    } else if (condWatch(state)) {
      return compiler.watch(
        {
          aggregateTimeout: 300,
          poll: true
        },
        handler
      )
    }
  }

  return new Promise<{
    compiler: webpack.Compiler
    close: () => void
    invalidate: () => void
  }>(resolve => {
    const watching: webpack.Compiler.Watching | undefined = method(
      // tslint:disable-next-line no-any
      (err: null | Error & { details?: string }, stats: any) => {
        const result: BuildResult = {
          module,
          assets: [],
          errors: [],
          hasErrors: false
        }

        const info = stats.toJson({
          assets: true,
          errors: true
        })

        if (!isNull(err) || stats.hasErrors() === true) {
          result.hasErrors = true
          result.assets = map(info.assets, asset => asset.name)

          if (isNull(err)) {
            result.errors = map(stats.compilation.errors, value => value.toString())
          } else {
            result.errors = concat(compact([err.message, err.details]))
          }

          resolve({
            close: isUndefined(watching) ? noop : watching.close,
            compiler: compiler,
            invalidate: isUndefined(watching) ? noop : watching.invalidate
          })

          cb(result)
        } else {
          result.assets = filter(
            map(info.assets, asset => path.join(info.outputPath, asset.name)),
            p => !/\.js\.map/.test(p)
          )

          resolve({
            close: isUndefined(watching) ? noop : watching.close,
            compiler: compiler,
            invalidate: isUndefined(watching) ? noop : watching.invalidate
          })

          cb(result)
        }
      }
    )
  })
}
