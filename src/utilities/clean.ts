import { condClean, outputPath } from '../selectors'
import { store } from '../store'
import { rimraf } from './rimraf'

export const clean = async () => {
  const state = store.getState()

  if (condClean(state)) {
    await rimraf(outputPath(state))
  }
}
