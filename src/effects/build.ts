import gzipSize = require('gzip-size')
import path from 'path'
import prettyBytes = require('pretty-bytes')
import { BuildModule, BuildModules, BuildResult } from '../types'
import { SET_BUILD_OPTIONS } from '../actions'
import { clean, compilerOptions, readFileAsync, realpathAsync, writeFileAsync } from '../utilities'
import { context, modules, outputPathStats, stats } from '../selectors'
import { dispatchFilesFromErrors, reportErrors } from './errors'
import { gulpBuild } from './gulp'
import { logger } from '@escapace/logger'
import { store } from '../store'
import { webpackBuild } from './webpack'

import {
  compact,
  concat,
  filter,
  flatten,
  forEach,
  isEmpty,
  isString,
  isUndefined,
  map,
  some,
  toUpper,
  uniq,
  without
} from 'lodash'

// const buildTitle = (props: { target: BuildTarget }): string => {
//   const { target } = props
//
//   switch (target) {
//     case 'cjs': {
//       return 'CommonJS modules'
//     }
//     case 'umd': {
//       return 'UMD (Universal Module Definition) modules'
//     }
//     case 'esm': {
//       return 'ECMAScript 6 modules'
//     }
//   }
// }

export const report = async (results: BuildResult[]) => {
  const str: string[] = []

  await Promise.all(
    map(without(modules(store.getState()), 'esm'), (mod: 'cjs' | 'umd') => {
      const data = stats(mod)(store.getState())
      const outputPath = outputPathStats(mod)(store.getState())

      if (data !== undefined && outputPath !== undefined) {
        return writeFileAsync(outputPath, JSON.stringify(data, null, '  '))
      }
    })
  )

  for (const result of results) {
    let size = 0
    let buf = Buffer.alloc(0)

    for (const p of result.assets) {
      const asset = await readFileAsync(p)
      const tmpBuf = Buffer.concat([asset, buf])
      buf = tmpBuf
      size += asset.length
    }

    const gSize = await gzipSize(buf)

    str.push(`${toUpper(result.module)}: ${prettyBytes(size)} (${prettyBytes(gSize)} gzipped)`)
  }

  logger.log(str.join('\n'))
}

export const build = async () => {
  await clean()

  const results: BuildResult[] = []

  results.push(await gulpBuild())

  const wbp = (module: 'cjs' | 'umd') =>
    // tslint:disable-next-line promise-must-complete
    new Promise<BuildResult>(resolve => webpackBuild(module, resolve)).then(res =>
      results.push(res)
    )

  await Promise.all(map(without(modules(store.getState()), 'esm'), wbp))

  const fail = filter(results, result => result.hasErrors)

  if (!isEmpty(fail)) {
    await dispatchFilesFromErrors()
    reportErrors()

    forEach(uniq(flatten(map(fail, f => f.errors))), str => logger.error(str))

    throw new Error('Recce could not finish the build')
  }

  return report(results)
}

export const parseFlags = async (flags: {
  entry: string[]
  clean: boolean
  minimize: boolean
  module: string[] | string
  output: string | undefined
  stats: string | undefined
}) => {
  const entries: string[] = await Promise.all(
    // tslint:disable-next-line no-unnecessary-callback-wrapper
    map(isUndefined(flags.entry) ? [] : uniq(compact(flags.entry)), file => realpathAsync(file))
  )

  let _modules: BuildModules

  if (isString(flags.module)) {
    _modules = [flags.module as BuildModule]
  } else {
    const hasEntry = !isEmpty(entries)
    const defaultModules: BuildModules = hasEntry ? ['esm', 'cjs', 'umd'] : ['esm']

    _modules = uniq(
      filter(
        isUndefined(flags.module)
          ? defaultModules
          : (concat(flags.module, ['esm']) as BuildModules),
        t => t === 'cjs' || t === 'esm' || t === 'umd'
      )
    )

    if (!hasEntry && some(_modules, t => t !== 'esm')) {
      throw new Error('Specify at least one entry for CommonJS and UMD builds')
    }
  }

  const outputPath = isUndefined(flags.output)
    ? path.resolve(context(store.getState()), 'lib')
    : path.resolve(flags.output)

  const _clean = isUndefined(flags.clean) ? true : flags.clean
  const minimize = isUndefined(flags.minimize) ? true : flags.minimize

  if (!isUndefined(flags.stats)) {
    if (path.basename(flags.stats) !== flags.stats) {
      throw new Error("The 'stats' options must be a filename, not a path")
    }
  }

  store.dispatch(
    SET_BUILD_OPTIONS({
      clean: _clean,
      compilerOptions: await compilerOptions(),
      entries,
      minimize,
      outputPath,
      modules: _modules,
      stats: flags.stats
    })
  )
}
