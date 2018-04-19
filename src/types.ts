import { AnyAction, Store, Unsubscribe } from 'redux'
import { IConfig as OclifConfig } from '@oclif/config'
import { Selector } from 'reselect'
import { LoggerLevel } from '@escapace/logger'
import { Package } from 'normalize-package-data'
import { Node as NodeOptions } from 'webpack'
import { Options as LodashOptions } from 'lodash-webpack-plugin'
import { MinifyOptions } from 'uglifyjs-webpack-plugin'

// tslint:disable-next-line no-any
export interface CompilerOptions {
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
  level: LoggerLevel
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

export interface Message {
  // tslint:disable-next-line no-any
  args: any[]
  level: LoggerLevel
}

export type Observe<S> = <P>(
  selector: Selector<S, P>,
  cb: (state: P, oldState: P, store: Store<S>) => void
) => Unsubscribe

export interface PackageJson extends Package {
  browserlist: string[]
}

export { LoggerLevel } from '@escapace/logger'
export { MinifyOptions } from 'uglifyjs-webpack-plugin'
export { Node as NodeOptions } from 'webpack'
export { Options as LodashOptions } from 'lodash-webpack-plugin'