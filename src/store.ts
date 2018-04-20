import produce from 'immer'
import { Selector, createSelector, createStructuredSelector } from 'reselect'
import { Store, createStore } from 'redux'
import { isEqual, isString } from 'lodash'
import { INITIAL_STATE } from './constants'

import { Action, ActionCreator, AnyAction, State } from './types'

import {
  SET_BUILD_OPTIONS,
  SET_CONTEXT,
  SET_MODE,
  SET_OCLIF_CONFIG,
  SET_PACKAGE_JSON,
  SET_PREFIX
} from './actions'

export function isType<P>(action: AnyAction, actionCreator: ActionCreator<P>): action is Action<P> {
  return action.type === actionCreator.type
}

export const store: Store<State> = createStore(
  (state: State | undefined, action: AnyAction) => {
    if (state !== undefined) {
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
      } else if (isType(action, SET_PREFIX)) {
        return produce(state, (draft: State) => {
          draft.prefix = action.payload
        })
      }
    }

    return state
  },
  INITIAL_STATE as State
)
