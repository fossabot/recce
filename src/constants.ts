import { CompilerOptions, LodashOptions, MinifyOptions, NodeOptions, State } from './types'
import { flags } from '@oclif/command'

export const commandFlags = {
  entry: flags.string({
    char: 'e',
    description: 'project entry point',
    multiple: true,
    required: false
  }),
  output: flags.string({
    char: 'o',
    description: 'output directory path',
    default: 'lib',
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

const UGLIFY_OPTIONS: MinifyOptions = {
  safari10: true,
  compress: {
    // turn off flags with small gains to speed up minification
    arrows: false,
    collapse_vars: false, // 0.3kb
    comparisons: false,
    computed_props: false,
    hoist_funs: false,
    hoist_props: false,
    hoist_vars: false,
    inline: false,
    loops: false,
    negate_iife: false,
    properties: false,
    reduce_funcs: false,
    reduce_vars: false,
    switches: false,
    toplevel: false,
    typeofs: false,

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
  mangle: true
}

export const INITIAL_STATE: Partial<State> = {
  defaults: {
    lodash: {
      id: ['lodash-es', 'lodash', 'lodash-fp'],
      options: LODASH_OPTIONS
    },
    uglify: UGLIFY_OPTIONS,
    node: WEBPACK_NODE,
    typescript: {
      compilerOptions: TS_COMPILER_OPTIONS
    }
  }
}
