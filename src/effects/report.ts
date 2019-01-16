import gzipSize = require('gzip-size')
import prettyBytes = require('pretty-bytes')
import { buildResults, buildResultsWithErrors } from '../selectors'
import { readFileAsync } from '../utilities'
import { dispatchFilesFromErrors, reportErrors } from './errors'
import { logger } from '@escapace/logger'
import { store } from '../store'

import { flatten, forEach, isEmpty, map, toUpper, uniq } from 'lodash'

export const report = async () => {
  const results = buildResults(store.getState())
  const fail = buildResultsWithErrors(store.getState())

  const str: string[] = []

  if (!isEmpty(fail)) {
    await dispatchFilesFromErrors()
    reportErrors()

    forEach(uniq(flatten(map(fail, f => f.errors))), s => logger.error(s))

    throw new Error('Recce could not finish the build')
  }

  for (const result of results) {
    let size = 0
    let buf = Buffer.alloc(0)

    for (const p of result.assets) {
      const asset = await readFileAsync(p)
      const tmpBuf = Buffer.concat([asset, buf])
      buf = tmpBuf
      size += asset.length
    }

    const gSize = await gzipSize(buf)

    str.push(`${toUpper(result.module)}: ${prettyBytes(size)} (${prettyBytes(gSize)} gzipped)`)
  }

  logger.log(str.join('\n'))
}
