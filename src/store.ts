import produce from 'immer'
import { Selector, createSelector, createStructuredSelector } from 'reselect'
import { Store, createStore } from 'redux'
import { isUndefined, union } from 'lodash'
import { INITIAL_STATE } from './constants'

import { Action, ActionCreator, AnyAction, State } from './types'

import {
  ADD_FILE_SOURCE,
  ADD_TYPESCRIPT_ERROR,
  RESET_FILE_SOURCES,
  RESET_TYPESCRIPT_ERRORS,
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
      } else if (isType(action, ADD_TYPESCRIPT_ERROR)) {
        return produce(state, (draft: State) => {
          const errors = draft.build.errors

          if (isUndefined(errors[action.payload.hash])) {
            errors[action.payload.hash] = action.payload
          } else {
            errors[action.payload.hash].targets = union(
              errors[action.payload.hash].targets,
              action.payload.targets
            )
          }
        })
      } else if (isType(action, ADD_FILE_SOURCE)) {
        return produce(state, (draft: State) => {
          draft.build.files[action.payload.file] = action.payload.source
        })
      } else if (isType(action, RESET_FILE_SOURCES)) {
        return produce(state, (draft: State) => {
          draft.build.files = {}
        })
      } else if (isType(action, RESET_TYPESCRIPT_ERRORS)) {
        return produce(state, (draft: State) => {
          draft.build.errors = {}
        })
      }
    }

    return state
  },
  INITIAL_STATE as State
)
