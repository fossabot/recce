import { createSelector } from 'reselect'
import { join, parse, relative, resolve } from 'path'
import { assign, filter, fromPairs, get, isString, map, some } from 'lodash'
import semver = require('semver')

import {
  BuildTargets,
  CompilerOptions,
  LodashOptions,
  MinifyOptions,
  NodeOptions,
  PackageJson,
  State,
  TypescriptErrorRecord
} from './types'

export const _entries = (state: State): string[] => state.build.entries
export const _lodashId = (state: State): string[] => state.defaults.lodash.id
export const _outputPath = (state: State): string => state.build.outputPath
export const condClean = (state: State): boolean => state.build.clean
export const condMinimize = (state: State): boolean => state.build.minimize
export const context = (state: State): string => state.context
export const contextModules = (state: State): string => state.prefix.context
export const compilerOptions = (state: State): CompilerOptions =>
  state.defaults.typescript.compilerOptions
export const lodashOptions = (state: State): LodashOptions => state.defaults.lodash.options
export const nodeOptions = (state: State): NodeOptions => state.defaults.node
export const packageJson = (state: State): PackageJson => state.pjson
export const rootModules = (state: State): string => state.prefix.root
export const targets = (state: State): BuildTargets => state.build.targets
export const uglifyOptions = (state: State): MinifyOptions => state.defaults.uglify
export const declaration = (state: State): boolean => !!state.build.compilerOptions.declaration
export const errors = (state: State): { [key: string]: TypescriptErrorRecord } => state.build.errors
export const files = (state: State) => state.build.files
export const mode = (state: State) => state.mode

// Derivatives

export const condWatch = createSelector(mode, m => m === 'watch')
export const condBuild = createSelector(mode, m => m === 'build')

export const dependencies = createSelector(packageJson, pj => pj.dependencies)
export const devDependencies = createSelector(packageJson, pj => pj.dependencies)
export const entries = createSelector(_entries, context, (ents, ctx) =>
  map(ents, ent => resolve(ctx, ent))
)
export const combinedDependencies = createSelector(devDependencies, dependencies, (dev, dep) =>
  assign({}, dev, dep)
)

export const outputFilename = createSelector(context, _outputPath, resolve)
export const outputPath = createSelector(context, _outputPath, resolve)
export const outputPathCjs = createSelector(outputPath, o => join(o, 'cjs'))
export const outputPathEsm = createSelector(outputPath, o => join(o, 'esm'))
export const outputPathTypes = createSelector(outputPath, o => join(o, 'types'))
export const outputPathUmd = createSelector(outputPath, o => join(o, 'umd'))

export const packageName = createSelector(packageJson, pj => pj.name)
export const tsconfig = createSelector(context, c => join(c, 'tsconfig.json'))

export const webpackEntries = createSelector(entries, context, (ents, ctx): {
  [key: string]: string
} => fromPairs(map(ents, ent => [parse(ent).name, `./${relative(ctx, resolve(ctx, ent))}`])))

export const condLodash = createSelector(combinedDependencies, _lodashId, (dep, lmn): boolean =>
  some(lmn, l => dep[l])
)

// TODO: wrong types
export const lodashId = createSelector(combinedDependencies, _lodashId, (dep, lmn) =>
  filter(lmn, l => dep[l])
)

export const nodeTarget = createSelector(packageJson, (pjson): string => {
  const node: string | undefined = get(pjson, 'engines.node')

  if (isString(node)) {
    if (semver.valid(node) !== null) {
      return node
    }

    const coerced = semver.coerce(node)

    // tslint:disable-next-line strict-type-predicates
    if (semver.validRange(node) !== null && coerced !== null) {
      return coerced.version
    }
  }

  return `${semver.major(process.versions.node)}.0.0`
})

// export const entryName = createSelector(entries, n => parse(n).name)
// export const relativeEntry = createSelector(entries, context, (e, c) => relative(c, resolve(c, e)))

// export const browserlist = createSelector(
//   packageJson,
//   pj => pj.browserlist || ['> 1%', 'last 2 versions']
// )
