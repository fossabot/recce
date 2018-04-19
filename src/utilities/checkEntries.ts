import { context, entries } from '../selectors'
import { isFile } from './isFile'
import { relative } from 'path'
import { store } from '../store'

import { filter, join, map } from 'lodash'

export const checkEntries = async () => {
  const state = store.getState()

  const broken = filter(await Promise.all(map(entries(state), isFile)), o => !o.test)

  if (broken.length !== 0) {
    throw new Error(
      join(
        map(
          broken,
          test =>
            `Entry module not found: ${relative(context(state), test.input)} in ${context(state)}`
        ),
        '\n'
      )
    )
  }
}
