import { createSelector } from 'reselect'
import { join, parse, relative, resolve } from 'path'
import { assign, filter, fromPairs, map, some } from 'lodash'
import {
  BuildTargets,
  CompilerOptions,
  LodashOptions,
  MinifyOptions,
  NodeOptions,
  PackageJson,
  State
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
export const level = (state: State) => state.level
export const lodashOptions = (state: State): LodashOptions => state.defaults.lodash.options
export const nodeOptions = (state: State): NodeOptions => state.defaults.node
export const packageJson = (state: State): PackageJson => state.pjson
export const rootModules = (state: State): string => state.prefix.root
export const targets = (state: State): BuildTargets => state.build.targets
export const uglifyOptions = (state: State): MinifyOptions => state.defaults.uglify
export const declaration = (state: State): boolean => !!state.build.compilerOptions.declaration

// Derivatives

export const dependencies = createSelector(packageJson, pj => pj.dependencies)
export const devDependencies = createSelector(packageJson, pj => pj.dependencies)
export const entries = createSelector(_entries, context, (ents, ctx) =>
  map(ents, ent => resolve(ctx, ent))
)
export const combinedDependencies = createSelector(devDependencies, dependencies, assign)

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

export const lodashId = createSelector(combinedDependencies, _lodashId, (dep, lmn): string[] =>
  filter(lmn, l => dep[l])
)

// export const entryName = createSelector(entries, n => parse(n).name)
// export const relativeEntry = createSelector(entries, context, (e, c) => relative(c, resolve(c, e)))

// export const browserlist = createSelector(
//   packageJson,
//   pj => pj.browserlist || ['> 1%', 'last 2 versions']
// )
