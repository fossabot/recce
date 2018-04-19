// import produce from 'immer'
import Listr = require('listr')
import TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
import UglifyJsPlugin = require('uglifyjs-webpack-plugin')
import babel = require('gulp-babel')
import gulp = require('gulp')
import lodashPlugin = require('lodash-webpack-plugin')
import merge = require('merge2')
import nodeExternals = require('webpack-node-externals')
import resolveFrom = require('resolve-from')
import sourcemaps = require('gulp-sourcemaps')
import typescript = require('gulp-typescript')
import webpack = require('webpack')
import { BuildTarget, State } from './types'
import { ListrTask } from 'listr'
import { logger } from '@escapace/logger'
import { store } from './store'
import { clean } from './utilities/clean'
import { checkEntries } from './utilities/checkEntries'
import { EOL } from 'os'
import chalk from 'chalk'

import { normalize, relative } from 'path'

import {
  compilerOptions,
  condClean,
  condLodash,
  condMinimize,
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
  filter,
  forEach,
  includes,
  isEmpty,
  isNull,
  join,
  map,
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

export interface ErrorInfo {
  code: number
  content: string
  severity: 'error' | 'warning'
  file: string
  line: number
  character: number
  context: string
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

const typescriptOptions = () => {
  const state = store.getState()

  return {
    errorFormatter,
    compiler: resolveFrom(contextModules(state), 'typescript'),
    configFile: tsconfig(state),
    silent: true,
    transpileOnly: false,
    compilerOptions: compilerOptions(state)
  }
}

const errorFormatter = (error: ErrorInfo) => {
  const file = error.file === '' ? '' : chalk.cyan(relative(error.context, error.file))
  const code = chalk.gray(`TS${error.code}`)

  if (error.file === '') {
    return `${chalk.red(error.severity)} ${code}: ${error.content}`
  } else {
    const loc = `:${chalk.yellow(String(error.line))}:${chalk.yellow(String(error.character))}`

    return `${file}${loc} - ${chalk.red(error.severity)} ${code}: ${error.content}`
  }
}

const gulpTask = async (): Promise<BuildResult> => {
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
            let rendered: string = error.message

            // if (error.tsFile) {
            const severity = compiler.DiagnosticCategory[error.diagnostic.category].toLowerCase()

            const file = error.diagnostic.file

            const position =
              file === undefined
                ? undefined
                : // tslint:disable-next-line no-non-null-assertion no-unnecessary-type-assertion
                  file.getLineAndCharacterOfPosition(error.diagnostic.start!)

            const content = compiler.flattenDiagnosticMessageText(error.diagnostic.messageText, EOL)

            rendered = errorFormatter({
              severity,
              code: error.diagnostic.code,
              content,
              file: file === undefined ? '' : normalize(file.fileName),
              // tslint:disable-next-line restrict-plus-operands
              line: position === undefined ? 0 : position.line + 1,
              // tslint:disable-next-line restrict-plus-operands
              character: position === undefined ? 0 : position.character + 1,
              context: context(state)
            })

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
          options: typescriptOptions()
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
      condLodash(state) ? new lodashPlugin(lodashOptions(state)) : undefined,
      condMinimize(state)
        ? new UglifyJsPlugin({
            uglifyOptions: uglifyOptions(state),
            sourceMap: true,
            cache: true,
            parallel: true
          })
        : undefined
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

const webpackTask = async (props: { target: 'cjs' | 'umd' }): Promise<BuildResult> => {
  const configuration = webpackConfiguration(props)

  const result: BuildResult = {
    target: props.target,
    assets: [],
    errors: [],
    hasErrors: false
  }

  return new Promise<BuildResult>(resolve => {
    // tslint:disable-next-line no-any
    webpack(configuration, (err: null | Error & { details?: string }, stats: any) => {
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

        resolve(result)
      } else {
        result.assets = map(info.assets, asset => asset.name)
        resolve(result)
      }
    })
  })
}

const buildTitle = (props: { target: BuildTarget }): string => {
  const { target } = props

  switch (target) {
    case 'cjs': {
      return 'CommonJS modules'
    }
    case 'umd': {
      return 'UMD (Universal Module Definition) modules'
    }
    case 'esm': {
      return 'ECMAScript 6 modules'
    }
  }
}
const buildTask = async (props: { target: BuildTarget }): Promise<BuildResult> => {
  const { target } = props

  switch (target) {
    case 'esm': {
      return gulpTask()
    }
    default: {
      return webpackTask({
        target
      }).catch(err => ({
        hasErrors: true,
        target,
        assets: [],
        errors: compact([err.message, err.details])
      }))
    }
  }
}

export const build = async () => {
  const results: BuildResult[] = []

  return new Listr(
    [
      {
        title: 'Check configuration',
        task: checkEntries
      },
      {
        title: 'Clean output directory',
        task: clean,
        skip: () => {
          const state = store.getState()

          return !condClean(state)
        }
      },
      {
        title: 'Build modules',
        task: () => {
          const state = store.getState()

          return new Listr(
            [
              ...map<BuildTarget, ListrTask>(targets(state), target => {
                return {
                  title: `Build ${buildTitle({ target })}`,
                  // tslint:disable-next-line promise-function-async
                  task: () =>
                    buildTask({ target }).then(result => {
                      results.push(result)

                      if (result.hasErrors) {
                        throw new Error()
                      }
                    })
                }
              })
            ],
            {
              concurrent: true,
              exitOnError: false
            }
          )
        }
      }
    ],
    {
      renderer: logger.level === 'silent' ? 'silent' : 'default'
    }
  )
    .run()
    .catch(error => {
      if (error.message !== 'Something went wrong') {
        throw error
      }
    })
    .then(() => {
      logger.log('')
      const fail = filter(results, result => result.hasErrors)

      forEach(fail, result =>
        logger.error(
          'Failed to build',
          buildTitle({ target: result.target }),
          '\n',
          join(result.errors, '\n'),
          '\n'
        )
      )

      process.exit(isEmpty(fail) ? 0 : 1)
    })
}
