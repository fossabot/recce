// import produce from 'immer'
import typescript = require('gulp-typescript')
import { BuildTarget, State } from './types'
import babel = require('gulp-babel')
import gulp = require('gulp')
import lodashPlugin = require('lodash-webpack-plugin')
import merge = require('merge2')
import nodeExternals = require('webpack-node-externals')
import resolveFrom = require('resolve-from')
import sourcemaps = require('gulp-sourcemaps')
import UglifyJsPlugin = require('uglifyjs-webpack-plugin')
import webpack = require('webpack')
import TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
import { logger } from '@escapace/logger'
import { store } from './store'
import { clean } from './utilities/clean'
import { checkEntries } from './utilities/checkEntries'
import { FilterWebpackPlugin } from './filterWebpackPlugin'
import { DoneHookWebpackPlugin } from './doneHookWebpackPlugin'

import { dispatchError, dispatchFilesFromErrors, normalizeGulpError, reportErrors } from './errors'

import {
  compilerOptions,
  condBuild,
  condLodash,
  condMinimize,
  condWatch,
  context,
  contextModules,
  declaration,
  lodashId,
  lodashOptions,
  nodeOptions,
  nodeTarget,
  outputPathCjs,
  outputPathEsm,
  outputPathTypes,
  outputPathUmd,
  packageName,
  rootModules,
  targets,
  tsconfig,
  uglifyOptions,
  webpackEntries
} from './selectors'

import {
  camelCase,
  compact,
  concat,
  defaults,
  filter,
  first,
  includes,
  isEmpty,
  isNull,
  isUndefined,
  map,
  noop,
  omit
} from 'lodash'

export interface BuildResult {
  target: BuildTarget
  assets: string[]
  errors: string[]
  hasErrors: boolean
}

export interface BuildProps {
  target: BuildTarget
}

const babelOptions = (props: BuildProps) => {
  const { target } = props

  const state = store.getState()

  return {
    cacheDirectory: false,
    babelrc: false,
    plugins: compact([
      resolveFrom(rootModules(state), '@babel/plugin-syntax-dynamic-import'),
      condLodash(state)
        ? [
            resolveFrom(rootModules(state), 'babel-plugin-lodash'),
            {
              id: lodashId(state),
              cwd: context(state)
            }
          ]
        : undefined
    ]),
    presets: [
      [
        resolveFrom(rootModules(state), '@babel/preset-env'),
        {
          configPath: context(state),
          exclude: ['transform-async-to-generator', 'transform-regenerator'],
          modules: false,
          loose: true,
          ignoreBrowserslistConfig: target === 'cjs',
          targets:
            target === 'cjs'
              ? {
                  node: nodeTarget(state)
                }
              : undefined
        }
      ]
    ]
  }
}

const gulpBabelOptions = () => omit(babelOptions({ target: 'esm' }), ['cacheDirectory'])
const webpackBabelOptions = babelOptions

const typescriptOptions = (props: { target: BuildTarget }) => {
  const state = store.getState()

  return {
    errorFormatter: dispatchError({ target: props.target }),
    compiler: resolveFrom(contextModules(state), 'typescript'),
    configFile: tsconfig(state),
    silent: true,
    transpileOnly: false,
    compilerOptions: compilerOptions(state)
  }
}

const gulpBuild = async (): Promise<BuildResult> => {
  const state = store.getState()
  const compiler = await import(resolveFrom(contextModules(state), 'typescript'))

  return new Promise<BuildResult>(resolve => {
    const result: BuildResult = {
      target: 'esm',
      assets: [],
      errors: [],
      hasErrors: false
    }

    const project = typescript.createProject(tsconfig(state), {
      noEmitOnError: true,
      typescript: compiler,
      sourceMap: undefined,
      inlineSourceMap: undefined,
      inlineSources: undefined,
      sourceRoot: undefined,
      watch: undefined,
      ...compilerOptions(state)
    })

    const stream = project
      .src()
      .pipe(sourcemaps.init())
      .pipe(
        project({
          error(error) {
            const rendered = normalizeGulpError(error, compiler)

            if (!includes(result.errors, rendered)) {
              result.errors.push(rendered)
            }
          },
          finish(results) {
            const showErrorCount = (count: number) => {
              if (count === 0) return

              result.hasErrors = true
            }

            showErrorCount(results.transpileErrors)
            showErrorCount(results.optionsErrors)
            showErrorCount(results.syntaxErrors)
            showErrorCount(results.globalErrors)
            showErrorCount(results.semanticErrors)
            showErrorCount(results.declarationErrors)
            showErrorCount(results.emitErrors)
          }
        })
      )

    merge(
      compact([
        declaration(state) && stream.dts.pipe(gulp.dest(outputPathTypes(state))),
        stream.js
          // tslint:disable-next-line no-any
          .pipe(babel(gulpBabelOptions() as any))
          .pipe(sourcemaps.write('.', { includeContent: true }))
          .pipe(gulp.dest(outputPathEsm(state)))
      ])
    )
      .on('finish', () => {
        resolve(result)
      })
      .on('error', error => {
        if (error && error.message) {
          result.errors.push(error.message)
        }

        result.hasErrors = true

        resolve(result)
      })
  })
}

const webpackRules = (props: { target: 'cjs' | 'umd' }): webpack.Rule[] => {
  const { target } = props

  const state = store.getState()

  return [
    {
      test: /\.ts(x?)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: resolveFrom(rootModules(state), 'babel-loader'),
          options: webpackBabelOptions({ target })
        },
        {
          loader: resolveFrom(rootModules(state), 'ts-loader'),
          options: typescriptOptions({ target })
        }
      ]
    },
    {
      test: /\.js$/,
      exclude: /tslib/,
      use: [
        {
          loader: 'babel-loader',
          options: webpackBabelOptions({ target })
        }
      ]
    }
  ]
}

const webpackConfiguration = (props: { target: 'cjs' | 'umd' }): webpack.Configuration => {
  const { target } = props
  const state = store.getState()

  return {
    name: target,
    cache: false,
    context: context(state),
    target: target === 'cjs' ? 'node' : 'web',
    externals: target === 'cjs' ? [nodeExternals()] : undefined,
    mode: 'production',
    entry: webpackEntries(state),
    devtool: 'source-map',
    output: {
      libraryTarget: target === 'cjs' ? 'commonjs2' : 'umd',
      library: target === 'cjs' ? undefined : camelCase(packageName(state)),
      path: target === 'cjs' ? outputPathCjs(state) : outputPathUmd(state),
      filename: `[name].js`
    },
    module: {
      rules: webpackRules(props)
    },
    optimization: {
      nodeEnv: false,
      minimize: false
    },
    plugins: compact([
      condWatch(state) ? new DoneHookWebpackPlugin() : undefined,
      // new webpack.NoEmitOnErrorsPlugin(),
      condLodash(state) ? new lodashPlugin(lodashOptions(state)) : undefined,
      condMinimize(state)
        ? new UglifyJsPlugin({
            uglifyOptions: uglifyOptions(state),
            sourceMap: true,
            cache: true,
            parallel: true
          })
        : undefined,
      new FilterWebpackPlugin({
        patterns: ['**/*.d.ts']
      })
      // new webpack.BannerPlugin(banner)
    ]),
    resolve: {
      symlinks: true,
      plugins: [
        new TsconfigPathsPlugin({
          silent: true,
          configFile: tsconfig(state)
        })
      ],
      extensions: ['.ts', '.js', '.tsx', '.json'],
      modules: [contextModules(state)],
      mainFields: target === 'umd' ? ['module', 'browser', 'main'] : ['module', 'main']
    },
    resolveLoader: {
      modules: [rootModules(state)]
    },
    node: target === 'cjs' ? nodeOptions(state) : undefined
  }
}

const webpackBuild = async (props: {
  target: 'cjs' | 'umd'
  cb?: (result: BuildResult) => void
}): Promise<{
  compiler: webpack.Compiler
  close: () => void
  invalidate: () => void
}> => {
  const configuration = webpackConfiguration(props)
  const compiler = webpack(configuration)

  const { target, cb } = defaults(props, { cb: noop })

  const method = (handler: webpack.ICompiler.Handler) => {
    const state = store.getState()

    if (condBuild(state)) {
      return compiler.run(handler) as undefined
    } else if (condWatch(state)) {
      return compiler.watch(
        {
          aggregateTimeout: 300,
          poll: true
        },
        handler
      )
    }
  }

  return new Promise<{
    compiler: webpack.Compiler
    close: () => void
    invalidate: () => void
  }>(resolve => {
    const watching: webpack.Compiler.Watching | undefined = method(
      // tslint:disable-next-line no-any
      (err: null | Error & { details?: string }, stats: any) => {
        const result: BuildResult = {
          target,
          assets: [],
          errors: [],
          hasErrors: false
        }

        const info = stats.toJson({
          assets: true,
          errors: true
        })

        if (!isNull(err) || stats.hasErrors() === true) {
          result.hasErrors = true
          result.assets = map(info.assets, asset => asset.name)

          if (isNull(err)) {
            result.errors = map(stats.compilation.errors, (error, index) => {
              if (error.loaderSource === 'ts-loader') {
                return error.message
              } else {
                return info.errors[index]
              }
            })
          } else {
            result.errors = concat(compact([err.message, err.details]))
          }

          resolve({
            close: isUndefined(watching) ? noop : watching.close,
            compiler: compiler,
            invalidate: isUndefined(watching) ? noop : watching.invalidate
          })

          cb(result)
        } else {
          result.assets = map(info.assets, asset => asset.name)

          resolve({
            close: isUndefined(watching) ? noop : watching.close,
            compiler: compiler,
            invalidate: isUndefined(watching) ? noop : watching.invalidate
          })

          cb(result)
        }
      }
    )
  })
}

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

export const build = async () => {
  await checkEntries()
  await clean()

  const state = store.getState()

  const results: BuildResult[] = await Promise.all(
    map(targets(state), target => {
      switch (target) {
        case 'esm': {
          return gulpBuild()
        }
        default: {
          return new Promise<BuildResult>(resolve =>
            webpackBuild({
              target,
              // tslint:disable-next-line no-unnecessary-callback-wrapper
              cb: result => resolve(result)
            })
          )
        }
      }
    })
  )

  const fail = filter(results, result => result.hasErrors)

  if (!isEmpty(fail)) {
    await dispatchFilesFromErrors()
    reportErrors()

    throw new Error('Recce could not finish the build')
  }
}

export const watch = async () => {
  await checkEntries()
  await clean()

  const state = store.getState()
  const target = first(targets(state)) as 'cjs' | 'umd'

  return webpackBuild({
    target,
    cb: () => {
      logger.info('Should be last')
    }
  })
}
