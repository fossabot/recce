import { createSelector } from 'reselect'
import { buildResults, outputPathCjs, outputPathUmd } from './general'
import { State } from '../types'
import { find } from 'lodash'
import path = require('path')

export const condStats = (state: State) => state.options.stats

export const outputPathStats = (m: 'cjs' | 'umd') =>
  createSelector(
    m === 'cjs' ? outputPathCjs : outputPathUmd,
    (c: string) => path.join(c, 'stats.json')
  )

export const compilationStats = (m: 'cjs' | 'umd') => (state: State) => {
  const found = find(buildResults(state), ab => ab.module === m)

  return found === undefined ? undefined : found.stats
}
