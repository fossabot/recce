import gzipSize = require('gzip-size')
import path from 'path'
import prettyBytes = require('pretty-bytes')
import { BuildModule, BuildModules, BuildResult } from '../types'
import { SET_BUILD_OPTIONS } from '../actions'
import { checkEntries, clean, compilerOptions, readFileAsync } from '../utilities'
import { context, modules } from '../selectors'
import { dispatchFilesFromErrors, reportErrors } from './errors'
import { gulpBuild } from './gulp'
import { logger } from '@escapace/logger'
import { store } from '../store'
import { webpackBuild } from './webpack'

import {
  compact,
  concat,
  filter,
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

export const build = async () => {
  await checkEntries()
  await clean()

  const state = store.getState()

  const results: BuildResult[] = []

  results.push(await gulpBuild())

  const wbp = (module: 'cjs' | 'umd') =>
    // tslint:disable-next-line promise-must-complete
    new Promise<BuildResult>(resolve => webpackBuild(module, resolve)).then(res =>
      results.push(res)
    )
  await Promise.all(map(without(modules(state), 'esm'), wbp))

  const fail = filter(results, result => result.hasErrors)

  if (!isEmpty(fail)) {
    await dispatchFilesFromErrors()
    reportErrors()

    // TODO: non-ts types of errors
    // fail.forEach(console.log)
    throw new Error('Recce could not finish the build')
  } else {
    const report: string[] = []

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

      report.push(`${toUpper(result.module)}: ${prettyBytes(size)} (${prettyBytes(gSize)} gzipped)`)
    }

    logger.log(report.join('\n'))
  }
}

export const parseFlags = async (flags: {
  entry: string[]
  clean: boolean
  minimize: boolean
  module: string[] | string
  output: string | undefined
}) => {
  // tslint:disable-next-line no-unnecessary-callback-wrapper
  const entries: string[] = map(isUndefined(flags.entry) ? [] : uniq(compact(flags.entry)), str =>
    path.resolve(str)
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

  store.dispatch(
    SET_BUILD_OPTIONS({
      files: {},
      errors: {},
      clean: _clean,
      compilerOptions: await compilerOptions(),
      entries,
      minimize,
      outputPath,
      modules: _modules
    })
  )
}
