// import produce from 'immer'
import { store } from './store'
import webpack = require('webpack')
import babel = require('gulp-babel')
import gulpFilter = require('gulp-filter')
import gulp = require('gulp')
import gulpTap = require('gulp-tap')
import lodashPlugin = require('lodash-webpack-plugin')
import merge = require('merge2')
import nodeExternals = require('webpack-node-externals')
import resolveFrom = require('resolve-from')
import sourcemaps = require('gulp-sourcemaps')
// import DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin')
import TerserPlugin = require('terser-webpack-plugin')
import { BuildModule, BuildModules } from './types'
// import TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
import typescript = require('gulp-typescript')
import { clean } from './utilities/clean'
import { checkEntries } from './utilities/checkEntries'
import { FilterWebpackPlugin } from './filterWebpackPlugin'
import { DoneHookWebpackPlugin } from './doneHookWebpackPlugin'
import { dispatchFilesFromErrors, normalizeGulpError, reportErrors } from './errors'
import { compilerOptions as readCompilerOptions } from './utilities/compilerOptions'
import { SET_BUILD_OPTIONS, SET_ROOTDIR } from './actions'
import { extname, join } from 'path'
import { readFileAsync } from './utilities/readFileAsync'
import gzipSize = require('gzip-size')
import prettyBytes = require('pretty-bytes')
import { logger } from '@escapace/logger'

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
  minifyOptions,
  modules,
  nodeOptions,
  nodeTarget,
  outputPathCjs,
  outputPathEsm,
  outputPathTypes,
  outputPathUmd,
  packageName,
  rootModules,
  tsconfig,
  webpackEntries
} from './selectors'

import {
  camelCase,
  compact,
  concat,
  filter,
  includes,
  isEmpty,
  isNull,
  isString,
  isUndefined,
  map,
  noop,
  omit,
  some,
  toUpper,
  uniq,
  without
} from 'lodash'

export interface BuildResult {
  module: BuildModule
  assets: string[]
  errors: string[]
  hasErrors: boolean
}

const babelOptions = (module: BuildModule) => {
  const state = store.getState()

  return {
    cacheDirectory: false,
    babelrc: false,
    plugins: compact([
      resolveFrom(rootModules(state), '@babel/plugin-syntax-dynamic-import'),
      module === 'esm'
        ? resolveFrom(rootModules(state), 'babel-plugin-annotate-pure-calls')
        : undefined,
      module === 'esm'
        ? condLodash(state)
          ? [
              resolveFrom(rootModules(state), 'babel-plugin-lodash'),
              {
                id: lodashId(state),
                cwd: context(state)
              }
            ]
          : undefined
        : undefined
    ]),
    presets: compact([
      module !== 'esm'
        ? [
            resolveFrom(rootModules(state), '@babel/preset-env'),
            {
              configPath: context(state),
              exclude: ['transform-async-to-generator', 'transform-regenerator'],
              modules: false,
              loose: true,
              ignoreBrowserslistConfig: module === 'cjs',
              targets:
                module === 'cjs'
                  ? {
                      node: nodeTarget(state)
                    }
                  : undefined
            }
          ]
        : undefined
    ])
  }
}

const gulpBabelOptions = () => omit(babelOptions('esm'), ['cacheDirectory'])

const gulpBuild = async (): Promise<BuildResult> => {
  const state = store.getState()
  const compiler = await import(resolveFrom(contextModules(state), 'typescript'))

  return new Promise<BuildResult>(resolve => {
    const result: BuildResult = {
      module: 'esm',
      assets: [],
      errors: [],
      hasErrors: false
    }

    const project = typescript.createProject(tsconfig(state), {
      noEmitOnError: true,
      typescript: compiler,
      sourceRoot: undefined,
      ...compilerOptions(state),
      outDir: context(state),
      watch: false,
      sourceMap: true,
      inlineSourceMap: true,
      inlineSources: true
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
          finish(data) {
            const showErrorCount = (count: number) => {
              if (count === 0) return

              result.hasErrors = true
            }

            store.dispatch(
              SET_ROOTDIR(
                isUndefined(project.options.rootDir) ? context(state) : project.options.rootDir
              )
            )

            showErrorCount(data.transpileErrors)
            showErrorCount(data.optionsErrors)
            showErrorCount(data.syntaxErrors)
            showErrorCount(data.globalErrors)
            showErrorCount(data.semanticErrors)
            showErrorCount(data.declarationErrors)
            showErrorCount(data.emitErrors)
          }
        })
      )
      .on('error', noop)

    const specFilter = gulpFilter(file => !/\.spec\.js$/.test(file.path))
    const specTypesFilter = gulpFilter(file => !/\.spec\.d\.ts$/.test(file.path))
    // const sourcemapFilter = gulpFilter(file => !/\.map$/.test(file.path))

    const ds = declaration(state)
      ? stream.dts.pipe(specTypesFilter).pipe(gulp.dest(outputPathTypes(state)))
      : undefined

    const es = stream.js
      .pipe(specFilter)
      // tslint:disable-next-line no-any
      .pipe(babel(gulpBabelOptions() as any))
      .pipe(sourcemaps.write('.', { includeContent: false }))
      .pipe(gulp.dest(outputPathEsm(state)))
      .pipe(
        gulpTap(file => {
          if (extname(file.path) === '.js') {
            result.assets.push(file.path)
          }
        })
      )

    merge(compact([ds, es]))
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

const webpackRules = (module: 'cjs' | 'umd'): webpack.RuleSetRule[] => {
  const state = store.getState()

  return [
    {
      test: /\.js$/,
      use: [resolveFrom(rootModules(state), 'source-map-loader')],
      enforce: 'pre'
    },
    {
      test: /\.js$/,
      exclude: /tslib/,
      use: [
        {
          loader: 'babel-loader',
          options: babelOptions(module)
        }
      ]
    }
  ]
}

const webpackConfiguration = (module: 'cjs' | 'umd'): webpack.Configuration => {
  const state = store.getState()

  return {
    name: module,
    cache: false,
    context: context(state),
    target: module === 'cjs' ? 'node' : 'web',
    externals:
      module === 'cjs'
        ? [
            nodeExternals({
              whitelist: ['lodash-es']
            })
          ]
        : undefined,
    mode: 'production',
    entry: webpackEntries(state),
    devtool: 'source-map',
    output: {
      libraryTarget: module === 'cjs' ? 'commonjs2' : 'umd',
      library: module === 'cjs' ? undefined : camelCase(packageName(state)),
      path: module === 'cjs' ? outputPathCjs(state) : outputPathUmd(state),
      filename: `[name].js`
    },
    module: {
      rules: webpackRules(module)
    },
    optimization: {
      nodeEnv: false,
      minimize: false
    },
    plugins: compact([
      // new DuplicatePackageCheckerPlugin({
      //   verbose: true,
      //   strict: true,
      //   showHelp: false,
      //   emitError: true
      // }),
      condWatch(state) ? new DoneHookWebpackPlugin() : undefined,
      // new webpack.NoEmitOnErrorsPlugin(),
      condLodash(state) ? new lodashPlugin(lodashOptions(state)) : undefined,
      condMinimize(state)
        ? new TerserPlugin({
            terserOptions: minifyOptions(state),
            sourceMap: true,
            cache: false,
            parallel: true
          })
        : undefined,
      new FilterWebpackPlugin({
        patterns: ['*.d.ts']
      })
      // new webpack.BannerPlugin(banner)
    ]),
    resolve: {
      symlinks: true,
      extensions: ['.ts', '.js', '.tsx', '.json'],
      modules: [contextModules(state)],
      mainFields: module === 'umd' ? ['module', 'browser', 'main'] : ['module', 'main']
    },
    resolveLoader: {
      modules: [rootModules(state)]
    },
    node: module === 'cjs' ? nodeOptions(state) : undefined
  }
}

const webpackBuild = async (
  module: 'cjs' | 'umd',
  cb: (result: BuildResult) => void = noop
): Promise<{
  compiler: webpack.Compiler
  close: () => void
  invalidate: () => void
}> => {
  const configuration = webpackConfiguration(module)
  const compiler = webpack(configuration)

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
          module,
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
            result.errors = map(stats.compilation.errors, (_, index) => {
              // return info.errors[index]
              // return error.message
              return info.errors[index]
              // if (error.loaderSource === 'ts-loader') {
              //   return error.message
              // } else {
              //   return info.errors[index]
              // }
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
          result.assets = filter(
            map(info.assets, asset => join(info.outputPath, asset.name)),
            p => !/\.js\.map/.test(p)
          )

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

  const results: BuildResult[] = []

  results.push(await gulpBuild())

  const wbp = (module: 'cjs' | 'umd') =>
    // tslint:disable-next-line promise-must-complete
    new Promise<BuildResult>(resolve => webpackBuild(module, resolve)).then(res =>
      results.push(res)
    )
  await Promise.all(map(without(modules(state), 'esm'), wbp))

  const fail = filter(results, result => result.hasErrors)

  if (!isEmpty(fail)) {
    await dispatchFilesFromErrors()
    reportErrors()

    // TODO: non-ts types of errors
    // fail.forEach(console.log)
    throw new Error('Recce could not finish the build')
  } else {
    const report: string[] = []

    for (const result of results) {
      let size = 0
      let buf = Buffer.alloc(0)

      for (const p of result.assets) {
        const asset = await readFileAsync(p)
        const tmpBuf = Buffer.concat([asset, buf])
        buf = tmpBuf
        size += asset.length
      }

      const gSize = await gzipSize(buf)

      report.push(`${toUpper(result.module)}: ${prettyBytes(size)} (${prettyBytes(gSize)} gzipped)`)
    }

    logger.log(report.join('\n'))
  }
}

export const parseFlags = async (flags: {
  entry: string[]
  clean: boolean
  minimize: boolean
  module: string[] | string
  output: string | undefined
}) => {
  const entries: string[] = isUndefined(flags.entry) ? [] : uniq(compact(flags.entry))

  let _modules: BuildModules

  if (isString(flags.module)) {
    _modules = [flags.module as BuildModule]
  } else {
    const hasEntry = !isEmpty(entries)
    const defaultModules: BuildModules = hasEntry ? ['esm', 'cjs', 'umd'] : ['esm']

    _modules = uniq(
      filter(
        isUndefined(flags.module) ? defaultModules : (flags.module as BuildModules),
        t => t === 'cjs' || t === 'esm' || t === 'umd'
      )
    )

    if (!hasEntry && some(_modules, t => t !== 'esm')) {
      throw new Error('Specify at least one entry for CommonJS and UMD builds')
    }
  }

  const outputPath = isUndefined(flags.output) ? 'lib' : flags.output
  const _clean = isUndefined(flags.clean) ? true : flags.clean
  const minimize = isUndefined(flags.minimize) ? true : flags.minimize

  store.dispatch(
    SET_BUILD_OPTIONS({
      files: {},
      errors: {},
      clean: _clean,
      compilerOptions: await readCompilerOptions(),
      entries,
      minimize,
      outputPath,
      modules: _modules
    })
  )
}
