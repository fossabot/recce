/* tslint:disable no-unsafe-any */

import Command from '../base'
import { flags } from '@oclif/command'
import { includes } from 'lodash'
import { SET_BUILD_OPTIONS, SET_MODE } from '../actions'

export default class Build extends Command {
  public static description = 'describe the command here'

  public static examples = [
    `$ recce hello
hello world from ./src/hello.ts!
`
  ]

  public static flags = {
    ...Command.flags,
    target: flags.string({
      char: 't',
      description: 'build target',
      multiple: true,
      options: ['cjs', 'umd', 'esm'],
      required: true
    }),
    'output-path': flags.string({
      char: 'o',
      description: 'the output path for compilation assets',
      default: 'lib',
      required: false
    }),
    types: flags.boolean({
      description: 'generate corresponding .d.ts files',
      allowNo: true
    })
  }

  public static args = [
    {
      name: 'entry',
      description: 'library entrypoint',
      default: 'src/index.ts'
    }
  ]

  public async run() {
    // tslint:disable-next-line no-shadowed-variable
    const { args, flags } = this.parse(Build)

    this.store.dispatch(SET_MODE('build'))

    this.store.dispatch(
      SET_BUILD_OPTIONS({
        entry: args.entry as string,
        targets: {
          cjs: includes(flags.target, 'cjs'),
          esm: includes(flags.target, 'esm'),
          umd: includes(flags.target, 'umd')
        },
        types: flags.types,
        outputPath: flags['output-path'] as string
      })
    )

    const { build } = await import('../entries/build')

    return build()
  }
}
