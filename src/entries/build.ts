import { store } from '../store'
import { common } from './common'

import { State } from '../types'

// import { logger } from '@escapace/logger'
// import produce from 'immer'
import webpack = require('webpack')
import nodeExternals = require('webpack-node-externals')
import TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
import resolveFrom = require('resolve-from')
import Listr = require('listr')

import { ListrTask } from 'listr'

import {
  context,
  contextModules,
  entryName,
  nodeOptions,
  outputPath,
  packageName,
  relativeEntry,
  rootModules,
  targets,
  tsconfig
} from '../selectors'

import { camelCase, isUndefined, mapValues, values } from 'lodash'

export interface WebpackProps {
  target: 'cjs' | 'umd'
  filename: string
  state: State
}

const webpackRules = (props: WebpackProps): webpack.Rule[] => {
  const { target, state } = props

  const babelOptions = () => {
    return {
      cacheDirectory: false,
      babelrc: false,
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
                    // TODO: more specific version
                    node: 'current'
                  }
                : undefined
          }
        ]
      ]
    }
  }

  const tsOptions = () => {
    return {
      compiler: resolveFrom(contextModules(state), 'typescript'),
      configFile: tsconfig(state),
      silent: true,
      // transpileOnly: true,
      compilerOptions: {
        downlevelIteration: true,
        importHelpers: true,
        target: 'es6',
        module: 'es2015',
        moduleResolution: 'node',
        sourceMap: true
      }
    }
  }

  return [
    {
      test: /\.ts(x?)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'babel-loader',
          options: babelOptions()
        },
        {
          loader: 'ts-loader',
          options: tsOptions()
        }
      ]
    }
    // {
    //   test: /\.js$/,
    //   exclude: /node_modules/,
    //   use: [
    //     {
    //       loader: 'babel-loader',
    //       options: babelOptions()
    //     }
    //   ]
    // }
  ]
}

const webpackConfiguration = (props: WebpackProps): webpack.Configuration => {
  const { target, filename, state } = props

  return {
    cache: false,
    context: context(state),
    target: target === 'cjs' ? 'node' : 'web',
    externals: target === 'cjs' ? [nodeExternals()] : undefined,
    mode: 'production',
    entry: `./${relativeEntry(state)}`,
    devtool: 'source-map',
    output: {
      libraryTarget: target === 'cjs' ? 'commonjs2' : 'umd',
      library: target === 'cjs' ? undefined : camelCase(packageName(state)),
      path: outputPath(state),
      filename
    },
    module: {
      rules: webpackRules(props)
    },
    optimization: {
      minimize: false
    },
    // plugins: compact([
    //   // state.libraryTarget !== 'commonjs' && new UglifyJsPlugin(),
    //   // new webpack.BannerPlugin(banner)
    // ]),
    resolve: {
      symlinks: true,
      plugins: [
        new TsconfigPathsPlugin({
          silent: true,
          // TODO: selector
          configFile: tsconfig(state)
        })
      ],
      extensions: ['.ts', '.js', '.tsx', '.json'],
      modules: [contextModules(state)]
    },
    resolveLoader: {
      modules: [rootModules(state)]
    },
    node: target === 'cjs' ? nodeOptions(state) : undefined
  }
}

const webpackTask = async (props: WebpackProps): Promise<void> => {
  const configuration = webpackConfiguration(props)

  /* tslint:disable no-any promise-must-complete */
  let resolve: (value?: void | PromiseLike<void>) => void
  let reject: (reason?: any) => void

  const ready = new Promise<void>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  /* tslint:enable no-any promise-must-complete */

  webpack(configuration, (err, stats) => {
    if (!isUndefined(err) || stats.hasErrors() === true) {
      reject()
    }

    resolve()
  })

  return ready
}

export const build = async () => {
  await common()

  const state = store.getState()

  const tasks: {
    cjs: ListrTask
    umd: ListrTask
    esm: ListrTask
  } = mapValues(targets(state), (value, name) => {
    return {
      title: `${name} build`,
      enabled: () => value,
      task: async () =>
        webpackTask({
          target: 'umd',
          state,
          filename: `${entryName(state)}.umd.js`
        })
    }
  })

  return new Listr(values(tasks), { concurrent: true }).run()
}
