/* tslint:disable no-unsafe-any */

import Command from '../base'
import { SET_BUILD_OPTIONS, SET_MODE } from '../actions'
import { compact, isUndefined, pick, uniq } from 'lodash'
import { compilerOptions } from '../utilities/compilerOptions'
import { flags } from '@oclif/command'
import { commandFlags } from '../constants'

export default class Build extends Command {
  public static description = 'TypeScript library build tool'

  public static examples = [
    '$ recce watch -c [directory] -t umd -e src/hello.ts',
    '$ recce watch -c [directory] -t cjs -e src/hello.ts -e src/world.ts'
  ]

  public static flags = {
    ...Command.flags,
    target: flags.string({
      char: 't',
      description: 'types of module systems',
      multiple: false,
      options: ['cjs', 'umd'],
      required: true
    }),
    ...pick(commandFlags, ['entry', 'output', 'minimize', 'clean'])
  }

  public static args = []

  public async run() {
    // tslint:disable-next-line no-shadowed-variable
    const { flags } = this.parse(Build)

    const entries: string[] = isUndefined(flags.entry) ? [] : uniq(compact(flags.entry))
    const targets = [flags.target as 'cjs' | 'umd']
    const outputPath = isUndefined(flags.output) ? 'lib' : flags.output
    const clean = isUndefined(flags.clean) ? true : flags.clean
    const minimize = isUndefined(flags.minimize) ? true : flags.minimize

    this.store.dispatch(SET_MODE('watch'))

    this.store.dispatch(
      SET_BUILD_OPTIONS({
        files: {},
        errors: {},
        clean,
        compilerOptions: await compilerOptions(),
        entries,
        minimize,
        outputPath,
        targets
      })
    )

    const { watch } = await import('../build')

    await watch()
  }
}
