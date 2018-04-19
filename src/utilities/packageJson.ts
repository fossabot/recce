import pkgUp = require('pkg-up')
import { PackageJson } from '../types'
import { isNull } from 'lodash'
import { normalizePackageJson } from './normalizePackageJson'
import { readFileAsync } from './readFileAsync'

export const packageJson = async (
  cwd: string
): Promise<{
  path: string
  content: PackageJson
}> => {
  const path = await pkgUp(cwd)

  if (!isNull(path)) {
    return {
      path: path,
      content: normalizePackageJson(JSON.parse(await readFileAsync(path, 'utf8')))
    }
  }

  throw new Error("No such file 'package.json'.")
}
