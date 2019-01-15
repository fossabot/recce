/* tslint:disable no-unsafe-any */

import Command from '../base'
import { SET_MODE } from '../actions'
import { pick } from 'lodash'
import { flags } from '@oclif/command'
import { commandFlags } from '../constants'

export default class Build extends Command {
  public static description = 'build TypeScript library'

  public static examples = [
    '$ recce build -p [directory] -m esm -e src/hello.ts',
    '$ recce build -p [directory] -m cjs -e src/hello.ts -e src/world.ts',
    '$ recce build -m cjs -m umd -m esm -e src/hello.ts -e src/world.ts',
    '$ recce build --no-clean --no-minimize -m umd -e src/hello.ts'
  ]

  public static flags = {
    ...Command.flags,
    module: flags.string({
      char: 'm',
      description: 'module code generation (esm is always enabled)',
      multiple: true,
      options: ['cjs', 'umd'],
      required: false
    }),
    ...pick(commandFlags, ['entry', 'output', 'minimize', 'clean', 'stats'])
  }

  public static args = []

  public async run() {
    // tslint:disable-next-line no-shadowed-variable
    const { flags } = this.parse(Build)

    this.store.dispatch(SET_MODE('build'))

    const { build, parseFlags } = await import('../effects/build')

    await parseFlags(flags)

    return build()
  }
}
