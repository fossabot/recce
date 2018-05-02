/* tslint:disable no-unsafe-any */

import Command from '../base'
import { SET_MODE } from '../actions'
import { pick } from 'lodash'
import { flags } from '@oclif/command'
import { commandFlags } from '../constants'

export default class Build extends Command {
  public static description = 'watch for changes in files and perform the build again'

  public static examples = [
    '$ recce watch -c [directory] -m umd -e src/hello.ts',
    '$ recce watch -c [directory] -m cjs -e src/hello.ts -e src/world.ts'
  ]

  public static flags = {
    ...Command.flags,
    module: flags.string({
      char: 'm',
      description: 'module code generation',
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

    this.store.dispatch(SET_MODE('watch'))

    const { watch, parseFlags } = await import('../build')

    await parseFlags(flags)

    await watch()
  }
}
