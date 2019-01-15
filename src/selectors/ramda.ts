import { combinedDependencies } from './general'
import { createSelector } from 'reselect'
import { includes, keys } from 'lodash'

export const condRamda = createSelector(
  combinedDependencies,
  (a): boolean => includes(keys(a), 'ramda')
)
