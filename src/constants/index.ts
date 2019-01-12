import { CompilerOptions, LodashOptions, MinifyOptions, NodeOptions, State } from '../types'
import { flags } from '@oclif/command'

import { DeepPartial } from 'redux'

export const commandFlags = {
  entry: flags.string({
    char: 'e',
    description: 'project entry point',
    multiple: true,
    required: false
  }),
  output: flags.string({
    char: 'o',
    description: '[default: lib] output directory path',
    required: false
  }),
  minimize: flags.boolean({
    description: '[default: true] minimize javascript',
    allowNo: true
  }),
  clean: flags.boolean({
    description: '[default: true] clean output directory',
    allowNo: true
  })
}

export const apiExtractFlags = {
  entry: flags.string({
    char: 'e',
    description: 'd.ts entry point',
    multiple: false,
    required: true
  }),
  output: flags.string({
    char: 'o',
    description: '[default: api.json] output json file path',
    required: false
  })
}

const TS_COMPILER_OPTIONS: CompilerOptions = {
  downlevelIteration: true,
  importHelpers: true,
  target: 'es6',
  module: 'esnext',
  moduleResolution: 'node',
  sourceMap: true
}

const WEBPACK_NODE: NodeOptions = {
  console: false,
  global: false,
  process: false,
  __filename: false,
  __dirname: false,
  Buffer: false,
  setImmediate: false
}

const LODASH_OPTIONS: LodashOptions = {
  cloning: true,
  caching: true,
  collections: true,
  unicode: true,
  memoizing: true,
  coercions: true,
  flattening: true,
  paths: true
}

const MINIFY_OPTIONS: MinifyOptions = {
  ecma: undefined,
  warnings: false,
  parse: {},
  compress: {
    arrows: true,
    collapse_vars: true,
    comparisons: true,
    computed_props: true,
    hoist_funs: true,
    hoist_props: true,
    hoist_vars: true,
    inline: true,
    loops: true,
    negate_iife: true,
    properties: true,
    reduce_funcs: true,
    reduce_vars: true,
    switches: true,
    toplevel: true,
    typeofs: true,

    // a few flags with noticable gains/speed ratio
    // numbers based on out of the box vendor bundle
    booleans: true, // 0.7kb
    if_return: true, // 0.4kb
    sequences: true, // 0.7kb
    unused: true, // 2.3kb

    // required features to drop conditional branches
    conditionals: true,
    dead_code: true,
    evaluate: true
  },
  mangle: true,
  module: false,
  output: null,
  toplevel: false,
  nameCache: null,
  ie8: false,
  keep_classnames: undefined,
  keep_fnames: false,
  safari10: true
}

export const INITIAL_STATE: DeepPartial<State> = {
  defaults: {
    lodash: {
      id: ['lodash-es', 'lodash', 'lodash-fp'],
      options: LODASH_OPTIONS
    },
    minify: MINIFY_OPTIONS,
    node: WEBPACK_NODE,
    compilerOptions: TS_COMPILER_OPTIONS
  }
}
