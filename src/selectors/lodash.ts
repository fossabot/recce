import { createSelector } from 'reselect'
import { filter, some } from 'lodash'
import { LodashOptions, State } from '../types'

import { combinedDependencies } from './general'

export const _lodashId = (state: State): string[] => state.defaults.lodash.id
export const lodashOptions = (state: State): LodashOptions => state.defaults.lodash.options

export const condLodash = createSelector(
  combinedDependencies,
  _lodashId,
  (dep, lmn): boolean => some(lmn, l => dep[l])
)

// TODO: wrong types
export const lodashId = createSelector(
  combinedDependencies,
  _lodashId,
  (dep, lmn) => filter(lmn, l => dep[l])
)
