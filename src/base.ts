import findNpmPerfix = require('find-npm-prefix')
import { Command, flags } from '@oclif/command'
import { LoggerLevel, LoggerMethod, logger } from '@escapace/logger'
import { State } from './types'
import { Store } from 'redux'
import { bind, filter, get, isUndefined } from 'lodash'
import { dirname, join, resolve } from 'path'
import { packageJson } from './utilities/packageJson'
import { isFile } from './utilities/isFile'
import { isDirectory } from './utilities/isDirectory'
import { store } from './store'

import {
  SET_CONTEXT,
  SET_OCLIF_CONFIG,
  SET_PACKAGE_JSON,
  SET_PREFIX,
  SET_TSCONFIG
} from './actions'

export default abstract class extends Command {
  public static flags = {
    help: flags.help({ char: 'h' }),
    project: flags.string({
      char: 'p',
      description: "path to 'tsconfig.json', or to a folder with it",
      required: false
    }),
    verbose: flags.boolean({
      hidden: true,
      description: 'show more details',
      allowNo: false
    }),
    quiet: flags.boolean({
      char: 'q',
      allowNo: false,
      description: "don't output anything"
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
      logger.level = 'silent'
    } else if (flags.verbose || process.env.TEST_OUTPUT === '1') {
      logger.level = 'verbose'
    }

    store.dispatch(SET_OCLIF_CONFIG(this.config))

    const state = store.getState()

    const project: string = isUndefined(flags.project) ? process.cwd() : flags.project

    const tests = filter(
      await Promise.all([
        isFile(project),
        isDirectory(project).then(prod => {
          prod.input = join(prod.input, 'tsconfig.json')

          return prod
        })
      ]),
      test => test.test
    )

    if (tests.length === 0) {
      throw new Error(`The specified path does not exist: '${flags.project}'.`)
    }

    const tsconfig = resolve(tests[0].input)

    const { content, path } = await packageJson(dirname(tsconfig))

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

    // process.chdir(dirname(path))

    store.dispatch(SET_CONTEXT(dirname(path)))
    store.dispatch(SET_PACKAGE_JSON(content))
    store.dispatch(SET_TSCONFIG(tsconfig))
  }
}
