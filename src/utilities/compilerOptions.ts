import { CompilerOptions } from '../types'
import { isUndefined } from 'lodash'
import { readFileAsync } from './readFileAsync'
import { store } from '../store'
import { tsconfig } from '../selectors'
import { checkTsconfig } from './checkTsconfig'

export const compilerOptions = async (): Promise<CompilerOptions> => {
  await checkTsconfig()

  const state = store.getState()

  const json: { compilerOptions?: CompilerOptions } = JSON.parse(
    await readFileAsync(tsconfig(state), 'utf-8')
  )

  return isUndefined(json.compilerOptions) ? {} : json.compilerOptions
}
