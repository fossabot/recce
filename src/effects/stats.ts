import { writeFileAsync } from '../utilities'
import { compilationStats, modules, outputPathStats } from '../selectors'
import { store } from '../store'

import { map, without } from 'lodash'

export const writeStats = async () => {
  return Promise.all(
    map(without(modules(store.getState()), 'esm'), (mod: 'cjs' | 'umd') => {
      const data = compilationStats(mod)(store.getState())
      const outputPath = outputPathStats(mod)(store.getState())

      if (data !== undefined && outputPath !== undefined) {
        return writeFileAsync(outputPath, JSON.stringify(data, null, '  '))
      }
    })
  )
}
