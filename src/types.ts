import { AnyAction } from 'redux'
import { IConfig as OclifConfig } from '@oclif/config'
import { Package } from 'normalize-package-data'
import { Node as NodeOptions } from 'webpack'
import { Options as LodashOptions } from 'lodash-webpack-plugin'
import { MinifyOptions } from 'terser-webpack-plugin'

export interface TypescriptError {
  code: number
  content: string
  severity: 'error' | 'warning'
  file: string
  line: number
  character: number
  context: string
}

export interface TypescriptErrorRecord {
  modules: BuildModule[]
  error: TypescriptError
  hash: string
}

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

export type BuildModule = 'cjs' | 'umd' | 'esm'
export type BuildModules = BuildModule[]

export interface FileSource {
  file: string
  source: string
}

export interface BuildOptions {
  errors: { [key: string]: TypescriptErrorRecord }
  files: { [key: string]: string }
  compilerOptions: CompilerOptions
  entries: string[]
  modules: BuildModules
  outputPath: string
  minimize: boolean
  clean: boolean
}

export type Mode = 'build' | 'test' | 'watch'

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
    minify: MinifyOptions
    lodash: {
      id: string[]
      options: LodashOptions
    }
    compilerOptions: CompilerOptions
  }
}

// export type Observe<S> = <P>(
//   selector: Selector<S, P>,
//   cb: (state: P, oldState: P, store: Store<S>) => void
// ) => Unsubscribe

export interface PackageJson extends Package {
  browserlist: string[]
}

export { MinifyOptions } from 'terser-webpack-plugin'
export { Node as NodeOptions } from 'webpack'
export { Options as LodashOptions } from 'lodash-webpack-plugin'
