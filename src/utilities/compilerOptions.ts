import { CompilerOptions } from '../types'
import { isUndefined } from 'lodash'
import { readFileAsync } from './readFileAsync'
import { store } from '../store'
import { tsconfig } from '../selectors'
import { checkTsconfig } from './checkTsconfig'
import { parse } from 'tsconfig'

export const compilerOptions = async (): Promise<CompilerOptions> => {
  await checkTsconfig()

  const state = store.getState()
  const filename = tsconfig(state)

  const json: { compilerOptions?: CompilerOptions } = parse(
    await readFileAsync(filename, 'utf-8'),
    filename
  )

  return isUndefined(json.compilerOptions) ? {} : json.compilerOptions
}
