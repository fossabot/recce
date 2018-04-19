import findNpmPerfix = require('find-npm-prefix')
import { Command, flags } from '@oclif/command'
import { LoggerLevel, LoggerMethod, logger } from '@escapace/logger'
import { State } from './types'
import { Store } from 'redux'
import { bind, get, isUndefined } from 'lodash'
import { dirname, join } from 'path'
import { packageJson } from './utilities/packageJson'
import { store } from './store'

import {
  SET_CONTEXT,
  SET_LOG_LEVEL,
  SET_OCLIF_CONFIG,
  SET_PACKAGE_JSON,
  SET_PREFIX
} from './actions'

export default abstract class extends Command {
  public static flags = {
    help: flags.help({ char: 'h' }),
    context: flags.string({
      char: 'c',
      description: 'the root directory for resolving entry point',
      required: false
    }),
    verbose: flags.boolean({
      char: 'v',
      description: 'show more details',
      allowNo: false
    }),
    quiet: flags.boolean({
      char: 'q',
      allowNo: false,
      description: 'prevent output from being displayed in stdout'
    })
  }

  public store: Store<State> = store

  // tslint:disable-next-line no-any
  public log(message: any, level: 'log' | LoggerLevel = 'log') {
    const method: LoggerMethod = bind(get(logger, level), logger)

    method(message)
  }

  public async init() {
    // tslint:disable-next-line no-any no-shadowed-variable
    const { flags } = this.parse(this.constructor as any)

    if (flags.quiet) {
      store.dispatch(SET_LOG_LEVEL('silent'))
      logger.level = 'silent'
    } else if (flags.verbose) {
      store.dispatch(SET_LOG_LEVEL('verbose'))
      logger.level = 'verbose'
    }

    store.dispatch(SET_OCLIF_CONFIG(this.config))

    const state = store.getState()

    const { content, path } = await packageJson(
      isUndefined(flags.context) ? process.cwd : flags.context
    )

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

    process.chdir(dirname(path))

    store.dispatch(SET_CONTEXT(dirname(path)))
    store.dispatch(SET_PACKAGE_JSON(content))
  }
}
