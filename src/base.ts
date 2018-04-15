import { Command, flags } from '@oclif/command'
import { Store } from 'redux'
import { State } from './types'
import { store } from './store'
import { SET_LOG_LEVEL, SET_OCLIF_CONFIG } from './actions'
import { LoggerLevel, LoggerMethod, logger } from '@escapace/logger'

import { bind, get } from 'lodash'

export default abstract class extends Command {
  public static flags = {
    help: flags.help({ char: 'h' }),
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
    } else if (flags.verbose) {
      store.dispatch(SET_LOG_LEVEL('verbose'))
    }

    this.store.dispatch(SET_OCLIF_CONFIG(this.config))
  }
}
