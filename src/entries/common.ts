import { SET_CONTEXT, SET_PACKAGE_JSON, SET_PREFIX } from '../actions'

import { dirname, join } from 'path'

import { getPackageJson } from '../utilities'

import { store } from '../store'
import findNpmPerfix = require('find-npm-prefix')

export const common = async () => {
  const state = store.getState()
  const { content, path } = await getPackageJson()

  if (state.oclifConfig.root === dirname(path)) {
    throw new Error('Change the working directory')
  }

  const prefixContext = await findNpmPerfix(dirname(path))
  const prefixRoot = await findNpmPerfix(state.oclifConfig.root)

  store.dispatch(
    SET_PREFIX({
      context: join(prefixContext, 'node_modules'),
      root: join(prefixRoot, 'node_modules')
    })
  )

  store.dispatch(SET_CONTEXT(dirname(path)))
  store.dispatch(SET_PACKAGE_JSON(content))
}
