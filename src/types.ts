import { AnyAction, Store, Unsubscribe } from 'redux'
// import { Package } from 'normalize-package-data'
import { IConfig as OclifConfig } from '@oclif/config'
import { Selector } from 'reselect'
import { LoggerLevel } from '@escapace/logger'
import { Package } from 'normalize-package-data'
import { Node } from 'webpack'

export interface Action<P> extends AnyAction {
  type: string
  payload: P
}

export interface ActionCreator<P> {
  type: string
  (payload: P): Action<P>
}

export { AnyAction } from 'redux'

export interface BuildTargets {
  cjs: boolean
  esm: boolean
  umd: boolean
}

export interface BuildOptions {
  entry: string
  targets: BuildTargets
  types: boolean
  outputPath: string
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
    node: Node
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
