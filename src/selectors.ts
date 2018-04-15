import { createSelector } from 'reselect'
import { BuildTargets, PackageJson, State } from './types'
import { Node } from 'webpack'

import { join, parse, relative, resolve } from 'path'

export const level = (state: State) => state.level
export const targets = (state: State): BuildTargets => state.build.targets
export const entry = (state: State): string => state.build.entry
export const context = (state: State): string => state.context
export const packageJson = (state: State): PackageJson => state.pjson

export const _outputPath = (state: State): string => state.build.outputPath
export const nodeOptions = (state: State): Node => state.defaults.node
export const contextModules = (state: State): string => state.prefix.context
export const rootModules = (state: State): string => state.prefix.root

// Derivatives

export const packageName = createSelector(packageJson, pj => pj.name)
export const entryName = createSelector(entry, n => parse(n).name)
export const outputPath = createSelector(context, _outputPath, resolve)
export const outputFilename = createSelector(context, _outputPath, resolve)
export const tsconfig = createSelector(context, c => join(c, 'tsconfig.json'))

export const relativeEntry = createSelector(entry, context, (e, c) => relative(c, resolve(c, e)))

// export const browserlist = createSelector(
//   packageJson,
//   pj => pj.browserlist || ['> 1%', 'last 2 versions']
// )
