import TerserPlugin = require('terser-webpack-plugin')
import lodashPlugin = require('lodash-webpack-plugin')
import nodeExternals = require('webpack-node-externals')
import resolveFrom = require('resolve-from')
import { DoneHookWebpackPlugin, FilterWebpackPlugin } from '../plugins'
import { createSelector } from 'reselect'
import { join, parse, relative, resolve } from 'path'
import { camelCase, compact, fromPairs, map } from 'lodash'

import { MinifyOptions, State } from '../types'

import webpack = require('webpack')

import {
  condMinimize,
  condWatch,
  context,
  contextModules,
  entries,
  nodeOptions,
  outputPath,
  outputPathEsm,
  packageName,
  rootDir,
  rootModules
} from './general'

import { condLodash, lodashOptions } from './lodash'

import { babelOptions } from './babel'

const minifyOptions = (state: State): MinifyOptions => state.defaults.minify

const outputPathCjs = createSelector(
  outputPath,
  o => join(o, 'cjs')
)
const outputPathUmd = createSelector(
  outputPath,
  o => join(o, 'umd')
)

const webpackEntries = createSelector(
  entries,
  rootDir,
  outputPathEsm,
  context,
  (ents, root, ope, ctxx): { [key: string]: string } =>
    fromPairs(
      map(ents, ent => [
        parse(ent).name,
        `./${relative(
          ctxx,
          resolve(
            ope,
            relative(root as string, resolve(root as string, ent)).replace(/\.ts$/, '.js')
          )
        )}`
      ])
    )
)

const webpackRules = (module: 'cjs' | 'umd') => (state: State): webpack.RuleSetRule[] => [
  {
    test: /\.js$/,
    use: resolveFrom(rootModules(state), 'source-map-loader'),
    enforce: 'pre'
  },
  {
    test: /\.js$/,
    exclude: /tslib/,
    use: [
      {
        loader: resolveFrom(rootModules(state), 'babel-loader'),
        options: babelOptions(module)(state)
      }
    ]
  }
]

export const webpackConfiguration = (module: 'cjs' | 'umd') => (
  state: State
): webpack.Configuration => ({
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
    rules: webpackRules(module)(state)
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
})
