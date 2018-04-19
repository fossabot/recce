import produce from 'immer'
import { MinifyOptions } from 'uglifyjs-webpack-plugin'
import { Selector, createSelector, createStructuredSelector } from 'reselect'
import { Store, createStore } from 'redux'
import { context, level } from './selectors'
import { isEqual, isString } from 'lodash'

import {
  Action,
  ActionCreator,
  AnyAction,
  CompilerOptions,
  LodashOptions,
  NodeOptions,
  State
} from './types'

import {
  SET_BUILD_OPTIONS,
  SET_CONTEXT,
  SET_LOG_LEVEL,
  SET_MODE,
  SET_OCLIF_CONFIG,
  SET_PACKAGE_JSON,
  SET_PREFIX
} from './actions'

const DEFAULTS_TYPESCRIPT_COMPILER_OPTIONS: CompilerOptions = {
  downlevelIteration: true,
  importHelpers: true,
  target: 'es6',
  module: 'esnext',
  moduleResolution: 'node',
  sourceMap: true
}

const DEFAULTS_WEBPACK_NODE: NodeOptions = {
  console: false,
  global: false,
  process: false,
  __filename: false,
  __dirname: false,
  Buffer: false,
  setImmediate: false
}

const DEFAULT_LODASH_OPTIONS: LodashOptions = {
  cloning: true,
  caching: true,
  collections: true,
  unicode: true,
  memoizing: true,
  coercions: true,
  flattening: true,
  paths: true
}

const DEFAULT_UGLIFY_OPTIONS: MinifyOptions = {
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

const INITIAL_STATE: Partial<State> = {
  level: 'info',
  defaults: {
    lodash: {
      id: ['lodash-es', 'lodash', 'lodash-fp'],
      options: DEFAULT_LODASH_OPTIONS
    },
    uglify: DEFAULT_UGLIFY_OPTIONS,
    node: DEFAULTS_WEBPACK_NODE,
    typescript: {
      compilerOptions: DEFAULTS_TYPESCRIPT_COMPILER_OPTIONS
    }
  }
}

export function isType<P>(action: AnyAction, actionCreator: ActionCreator<P>): action is Action<P> {
  return action.type === actionCreator.type
}

export const store: Store<State> = createStore<State>(
  (state, action: AnyAction) => {
    if (isType(action, SET_OCLIF_CONFIG)) {
      return produce(state, (draft: State) => {
        draft.oclifConfig = action.payload
      })
    } else if (isType(action, SET_CONTEXT)) {
      return produce(state, (draft: State) => {
        draft.context = action.payload
      })
    } else if (isType(action, SET_PACKAGE_JSON)) {
      return produce(state, (draft: State) => {
        draft.pjson = action.payload
      })
    } else if (isType(action, SET_MODE)) {
      return produce(state, (draft: State) => {
        draft.mode = action.payload
      })
    } else if (isType(action, SET_BUILD_OPTIONS)) {
      return produce(state, (draft: State) => {
        draft.build = action.payload
      })
    } else if (isType(action, SET_LOG_LEVEL)) {
      return produce(state, (draft: State) => {
        draft.level = action.payload
      })
    } else if (isType(action, SET_PREFIX)) {
      return produce(state, (draft: State) => {
        draft.prefix = action.payload
      })
    }

    return state
  },
  INITIAL_STATE as State
)
