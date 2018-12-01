import rr = require('rimraf')

export const rimraf = async (path: string) =>
  new Promise((resolve, reject) => {
    rr(path, err => {
      // tslint:disable-next-line strict-boolean-expressions
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
