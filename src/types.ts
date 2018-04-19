import { AnyAction } from 'redux'
import { IConfig as OclifConfig } from '@oclif/config'
import { Package } from 'normalize-package-data'
import { Node as NodeOptions } from 'webpack'
import { Options as LodashOptions } from 'lodash-webpack-plugin'
import { MinifyOptions } from 'uglifyjs-webpack-plugin'

export interface CompilerOptions {
  // tslint:disable-next-line no-any
  [key: string]: any
}

export interface Action<P> extends AnyAction {
  type: string
  payload: P
}

export interface ActionCreator<P> {
  type: string
  (payload: P): Action<P>
}

export { AnyAction } from 'redux'

export type BuildTarget = 'cjs' | 'umd' | 'esm'
export type BuildTargets = BuildTarget[]

export interface BuildOptions {
  compilerOptions: CompilerOptions
  entries: string[]
  targets: BuildTargets
  outputPath: string
  minimize: boolean
  clean: boolean
}

export type Mode = 'build' | 'test'

export interface Prefix {
  root: string
  context: string
}

export interface State {
  prefix: Prefix
  mode: Mode
  context: string
  pjson: PackageJson
  oclifConfig: OclifConfig
  build: BuildOptions
  defaults: {
    node: NodeOptions
    uglify: MinifyOptions
    lodash: {
      id: string[]
      options: LodashOptions
    }
    typescript: {
      compilerOptions: CompilerOptions
    }
  }
}

// export type Observe<S> = <P>(
//   selector: Selector<S, P>,
//   cb: (state: P, oldState: P, store: Store<S>) => void
// ) => Unsubscribe

export interface PackageJson extends Package {
  browserlist: string[]
}

export { MinifyOptions } from 'uglifyjs-webpack-plugin'
export { Node as NodeOptions } from 'webpack'
export { Options as LodashOptions } from 'lodash-webpack-plugin'
