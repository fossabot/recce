/* tslint:disable no-shadowed-variable strict-boolean-expressions */
import { readFile, readdir, stat } from 'fs'

export const isEmpty = (searchPath: string): Promise<boolean> =>
  new Promise<boolean>(resolve => {
    stat(searchPath, (err, stat) => {
      if (err) {
        return resolve(true)
      }

      if (stat.isDirectory()) {
        readdir(searchPath, (err, items) => {
          if (err) {
            return resolve(true)
          }
          resolve(!items || !items.length)
        })
      } else {
        readFile(searchPath, (err, data) => {
          if (err) {
            return resolve(true)
          }

          resolve(!data || !data.length)
        })
      }
    })
  })
