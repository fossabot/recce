import { createSelector } from 'reselect'
import { join, resolve } from 'path'
import { assign, find, map } from 'lodash'

import {
  BuildModules,
  CompilerOptions,
  NodeOptions,
  PackageJson,
  State,
  TypescriptErrorRecord
} from '../types'

export const tsconfig = (state: State) => state.options.tsconfig
export const rootDir = (state: State) => state.options.rootDir
export const condClean = (state: State): boolean => state.options.clean
export const condMinimize = (state: State): boolean => state.options.minimize

export const context = (state: State): string => state.options.context
export const contextModules = (state: State): string => state.options.prefix.context
export const compilerOptions = (state: State): CompilerOptions => state.options.compilerOptions

export const nodeOptions = (state: State): NodeOptions => state.defaults.node
export const packageJson = (state: State): PackageJson => state.options.pjson
export const rootModules = (state: State): string => state.options.prefix.root
export const modules = (state: State): BuildModules => state.options.modules

export const declaration = (state: State): boolean => !!state.options.compilerOptions.declaration
export const errors = (state: State): { [key: string]: TypescriptErrorRecord } =>
  state.runtime.errors
export const files = (state: State) => state.runtime.files
export const mode = (state: State) => state.options.mode

export const stats = (m: 'cjs' | 'umd') => (state: State) => {
  const found = find(state.runtime.stats, ab => ab.module === m)

  return found === undefined ? undefined : found.stats
}

const _entries = (state: State): string[] => state.options.entries

export const entries = createSelector(
  _entries,
  context,
  (ents, ctx) => map(ents, ent => resolve(ctx, ent))
)

const _outputPath = (state: State): string => state.options.outputPath

export const outputPath = createSelector(
  context,
  _outputPath,
  resolve
)

export const outputPathEsm = createSelector(
  outputPath,
  o => join(o, 'esm')
)

export const outputPathCjs = createSelector(
  outputPath,
  o => join(o, 'cjs')
)

export const statsFilename = (state: State) => state.options.stats

export const outputPathUmd = createSelector(
  outputPath,
  o => join(o, 'umd')
)

export const outputPathStats = (m: 'cjs' | 'umd') => {
  const handler = (c: string, d: string | undefined) => (d === undefined ? undefined : join(c, d))
  const selector = m === 'cjs' ? outputPathCjs : outputPathUmd

  return createSelector(
    selector,
    statsFilename,
    handler
  )
}

export const outputPathTypes = createSelector(
  outputPath,
  o => join(o, 'types')
)

export const condWatch = createSelector(
  mode,
  () => false
)
export const condBuild = createSelector(
  mode,
  m => m === 'build'
)

export const dependencies = createSelector(
  packageJson,
  pj => pj.dependencies
)
export const devDependencies = createSelector(
  packageJson,
  pj => pj.dependencies
)
export const combinedDependencies = createSelector(
  devDependencies,
  dependencies,
  (dev, dep) => assign({}, dev, dep)
)

export const packageName = createSelector(
  packageJson,
  pj => pj.name
)
