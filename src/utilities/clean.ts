import rimraf = require('rimraf')
import { outputPath } from '../selectors'
import { store } from '../store'

export const clean = async () =>
  new Promise((resolve, reject) => {
    const state = store.getState()

    rimraf(outputPath(state), err => {
      // tslint:disable-next-line strict-boolean-expressions
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
