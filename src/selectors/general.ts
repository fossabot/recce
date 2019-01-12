import { createSelector } from 'reselect'
import { join, resolve } from 'path'
import { assign, map } from 'lodash'

import {
  BuildModules,
  CompilerOptions,
  NodeOptions,
  PackageJson,
  State,
  TypescriptErrorRecord
} from '../types'

export const tsconfig = (state: State) => state.tsconfig
export const rootDir = (state: State) => state.build.rootDir
export const condClean = (state: State): boolean => state.build.clean
export const condMinimize = (state: State): boolean => state.build.minimize

export const context = (state: State): string => state.context
export const contextModules = (state: State): string => state.prefix.context
export const compilerOptions = (state: State): CompilerOptions => state.build.compilerOptions

export const nodeOptions = (state: State): NodeOptions => state.defaults.node
export const packageJson = (state: State): PackageJson => state.pjson
export const rootModules = (state: State): string => state.prefix.root
export const modules = (state: State): BuildModules => state.build.modules

export const declaration = (state: State): boolean => !!state.build.compilerOptions.declaration
export const errors = (state: State): { [key: string]: TypescriptErrorRecord } => state.build.errors
export const files = (state: State) => state.build.files
export const mode = (state: State) => state.mode

const _entries = (state: State): string[] => state.build.entries

export const entries = createSelector(
  _entries,
  context,
  (ents, ctx) => map(ents, ent => resolve(ctx, ent))
)

const _outputPath = (state: State): string => state.build.outputPath

export const outputPath = createSelector(
  context,
  _outputPath,
  resolve
)

export const outputPathEsm = createSelector(
  outputPath,
  o => join(o, 'esm')
)

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
