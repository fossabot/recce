import { assign } from 'lodash'

import { ActionCreator, BuildOptions, Mode, PackageJson, Prefix } from './types'
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

export const SET_CONTEXT = actionCreatorFactory<string>('SET_CONTEXT')

export const SET_MODE = actionCreatorFactory<Mode>('SET_MODE')

export const SET_BUILD_OPTIONS = actionCreatorFactory<BuildOptions>('SET_BUILD_OPTIONS')

export const SET_PREFIX = actionCreatorFactory<Prefix>('SET_PREFIX')
