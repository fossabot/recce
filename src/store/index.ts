import produce from 'immer'
import { AnyAction, DeepPartial, Store, createStore } from 'redux'
import { isUndefined, union } from 'lodash'
import { INITIAL_STATE } from '../constants'

import { Action, ActionCreator, State } from '../types'

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
  SET_PREFIX,
  SET_ROOTDIR,
  SET_TSCONFIG
} from '../actions'

export function isType<P>(action: AnyAction, actionCreator: ActionCreator<P>): action is Action<P> {
  return action.type === actionCreator.type
}

const reducer = (state: DeepPartial<State> = INITIAL_STATE, action: AnyAction) => {
  return produce<State>(state as State, draft => {
    if (isType(action, SET_OCLIF_CONFIG)) {
      draft.oclifConfig = action.payload
    } else if (isType(action, SET_CONTEXT)) {
      draft.context = action.payload
    } else if (isType(action, SET_PACKAGE_JSON)) {
      draft.pjson = action.payload
    } else if (isType(action, SET_MODE)) {
      draft.mode = action.payload
    } else if (isType(action, SET_BUILD_OPTIONS)) {
      draft.build = action.payload
    } else if (isType(action, SET_PREFIX)) {
      draft.prefix = action.payload
    } else if (isType(action, SET_ROOTDIR)) {
      draft.build.rootDir = action.payload
    } else if (isType(action, ADD_TYPESCRIPT_ERROR)) {
      const errors = draft.build.errors

      if (isUndefined(errors[action.payload.hash])) {
        errors[action.payload.hash] = action.payload
      } else {
        errors[action.payload.hash].modules = union(
          errors[action.payload.hash].modules,
          action.payload.modules
        )
      }
    } else if (isType(action, ADD_FILE_SOURCE)) {
      draft.build.files[action.payload.file] = action.payload.source
    } else if (isType(action, RESET_FILE_SOURCES)) {
      draft.build.files = {}
    } else if (isType(action, SET_TSCONFIG)) {
      draft.tsconfig = action.payload
    } else if (isType(action, RESET_TYPESCRIPT_ERRORS)) {
      draft.build.errors = {}
    }
  })
}

export const store: Store<State> = createStore(reducer)
