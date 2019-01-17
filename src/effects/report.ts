import gzipSize = require('gzip-size')
import prettyBytes = require('pretty-bytes')
import { buildResults, buildResultsWithErrors, machineReadable } from '../selectors'
import { readFileAsync } from '../utilities'
import { dispatchFilesFromErrors, reportErrors } from './errors'
import { logger } from '@escapace/logger'
import { store } from '../store'
import { BuildReports } from '../types'

import { flatten, forEach, fromPairs, isEmpty, map, toUpper, uniq } from 'lodash'

export const report = async () => {
  const results = buildResults(store.getState())
  const fail = buildResultsWithErrors(store.getState())

  if (!isEmpty(fail)) {
    await dispatchFilesFromErrors()
    reportErrors()

    forEach(uniq(flatten(map(fail, f => f.errors))), s => logger.error(s))

    throw new Error('Recce could not finish the build')
  }

  const reports = fromPairs(
    await Promise.all(
      map(results, async result => {
        let size = 0
        let buf = Buffer.alloc(0)

        for (const p of result.assets) {
          const asset = await readFileAsync(p)
          const tmpBuf = Buffer.concat([asset, buf])
          buf = tmpBuf
          size += asset.length
        }

        const gSize = await gzipSize(buf)

        return [
          result.module,
          {
            assets: result.assets,
            gzipSize: gSize,
            size
          }
        ]
      })
    )
  ) as BuildReports

  if (machineReadable(store.getState())) {
    // tslint:disable-next-line no-console
    console.log(JSON.stringify(reports, null, '  '))
  } else {
    // tslint:disable-next-line no-shadowed-variable
    forEach(reports, ({ gzipSize, size }, key) =>
      logger.log(`${toUpper(key)}: ${prettyBytes(size)} (${prettyBytes(gzipSize)} gzipped)`)
    )
  }

  // const str: string[] = []

  // str.push(`${toupper(result.module)}: ${prettybytes(size)} (${prettybytes(gsize)} gzipped)`)
  // logger.log(str.join('\n'))
}
