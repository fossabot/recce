import pkgUp = require('pkg-up')
import normalizePackage = require('normalize-package-data')
import { PackageJson } from './types'
import { isNull, noop } from 'lodash'
import { promisify } from 'util'
import { readFile } from 'fs'

export const readFileAsync = promisify(readFile)

export const normalizePackageJson = (data: PackageJson, strict: boolean = true): PackageJson => {
  normalizePackage(data, noop, strict)

  return data
}

export const getPackageJson = async (): Promise<{
  path: string
  content: PackageJson
}> => {
  const path = await pkgUp(process.cwd())

  if (!isNull(path)) {
    return {
      path: path,
      content: normalizePackageJson(JSON.parse(await readFileAsync(path, 'utf8')))
    }
  }

  throw new Error("No such file 'package.json'.")
}
