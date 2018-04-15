import produce from 'immer'
import { Action, ActionCreator, AnyAction, Observe, State } from './types'
import { Store, createStore } from 'redux'
import { context, level } from './selectors'
import { logger } from '@escapace/logger'
import {
  SET_BUILD_OPTIONS,
  SET_CONTEXT,
  SET_LOG_LEVEL,
  SET_MODE,
  SET_OCLIF_CONFIG,
  SET_PACKAGE_JSON,
  SET_PREFIX
} from './actions'

import { Node } from 'webpack'

import { isEqual, isString } from 'lodash'

import { Selector, createSelector, createStructuredSelector } from 'reselect'

const DEFAULTS_WEBPACK_NODE: Node = {
  console: false,
  global: false,
  process: false,
  __filename: false,
  __dirname: false,
  Buffer: false,
  setImmediate: false
}

const INITIAL_STATE: Partial<State> = {
  level: 'info',
  defaults: {
    node: DEFAULTS_WEBPACK_NODE
  }
}

export function isType<P>(action: AnyAction, actionCreator: ActionCreator<P>): action is Action<P> {
  return action.type === actionCreator.type
}

export const store = createStore<State>(
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

export const observeStore = <S>(_store: Store<S>): Observe<S> => (selector, cb) => {
  let currentValue = selector(_store.getState())

  const watch = () => {
    const newValue = selector(_store.getState())
    if (!isEqual(currentValue, newValue)) {
      const oldValue = currentValue
      currentValue = newValue
      cb(newValue, oldValue, _store)
    }
  }

  return _store.subscribe(watch)
}

export const observe = observeStore<State>(store)

observe(level, value => {
  logger.level = value
})

observe(context, value => {
  if (isString(value)) {
    process.chdir(value)
  }
})
