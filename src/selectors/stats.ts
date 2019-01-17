import { createSelector } from 'reselect'
import { buildResults, outputPathCjs, outputPathUmd } from './general'
import { State } from '../types'
import { find } from 'lodash'
import path = require('path')

export const statsFilename = (state: State) => state.options.stats
export const condStats = createSelector(
  statsFilename,
  a => a !== undefined
)

export const outputPathStats = (m: 'cjs' | 'umd') => {
  const handler = (c: string, d: string | undefined) =>
    d === undefined ? undefined : path.join(c, d)
  const selector = m === 'cjs' ? outputPathCjs : outputPathUmd

  return createSelector(
    selector,
    statsFilename,
    handler
  )
}

export const compilationStats = (m: 'cjs' | 'umd') => (state: State) => {
  const found = find(buildResults(state), ab => ab.module === m)

  return found === undefined ? undefined : found.stats
}
