import path from 'path'
import { BuildModule, BuildModules } from '../types'
import { SET_BUILD_OPTIONS } from '../actions'
import { context, modules } from '../selectors'
import { clean, compilerOptions, realpathAsync } from '../utilities'
import { gulpBuild } from './gulp'
import { store } from '../store'
import { webpackBuild } from './webpack'
import { writeStats } from './stats'
import { report } from './report'

import {
  compact,
  concat,
  filter,
  isEmpty,
  isString,
  isUndefined,
  map,
  some,
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

export const build = async (flags: {
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

  let buildModules: BuildModules

  if (isString(flags.module)) {
    buildModules = [flags.module as BuildModule]
  } else {
    const hasEntry = !isEmpty(entries)
    const defaultModules: BuildModules = hasEntry ? ['esm', 'cjs', 'umd'] : ['esm']

    buildModules = uniq(
      filter(
        isUndefined(flags.module)
          ? defaultModules
          : (concat(flags.module, ['esm']) as BuildModules),
        t => t === 'cjs' || t === 'esm' || t === 'umd'
      )
    )

    if (!hasEntry && some(buildModules, t => t !== 'esm')) {
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
      modules: buildModules,
      stats: flags.stats
    })
  )

  await clean()
  await gulpBuild()
  await Promise.all(map(without(modules(store.getState()), 'esm'), webpackBuild))
  await writeStats()
  await report()
}
