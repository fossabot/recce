import { assign } from 'lodash'

import {
  ActionCreator,
  FileSource,
  Mode,
  Options,
  PackageJson,
  Prefix,
  Stats,
  TypescriptErrorRecord
} from '../types'
import { IConfig as OclifConfig } from '@oclif/config'

const actionCreatorFactory = <P>(type: string): ActionCreator<P> =>
  assign(
    (payload: P) => ({
      type,
      payload
    }),
    { type }
  )

export const SET_OCLIF_CONFIG = actionCreatorFactory<OclifConfig>('SET_OCLIF_CONFIG')

export const SET_PACKAGE_JSON = actionCreatorFactory<PackageJson>('SET_PACKAGE_JSON')
export const SET_TSCONFIG = actionCreatorFactory<string>('SET_TSCONFIG')

export const SET_CONTEXT = actionCreatorFactory<string>('SET_CONTEXT')

export const SET_MODE = actionCreatorFactory<Mode>('SET_MODE')

export const SET_BUILD_OPTIONS = actionCreatorFactory<Partial<Options>>('SET_BUILD_OPTIONS')

export const SET_PREFIX = actionCreatorFactory<Prefix>('SET_PREFIX')

export const SET_ROOTDIR = actionCreatorFactory<string>('SET_ROOTDIR')

export const ADD_TYPESCRIPT_ERROR = actionCreatorFactory<TypescriptErrorRecord>(
  'ADD_TYPESCRIPT_ERROR'
)

export const ADD_FILE_SOURCE = actionCreatorFactory<FileSource>('FILE_SOURCE')

export const RESET_FILE_SOURCES = actionCreatorFactory<void>('RESET_FILE_SOURCES')
export const RESET_TYPESCRIPT_ERRORS = actionCreatorFactory<void>('RESET_TYPESCRIPT_ERRORS')

export const ADD_STATS = actionCreatorFactory<Stats>('ADD_STATS')

export const RESET = actionCreatorFactory<undefined>('RESET')
