/* tslint:disable no-unsafe-any */

import Command from '../base'
import { BuildTargets } from '../types'
import { SET_BUILD_OPTIONS, SET_MODE } from '../actions'
import { compact, filter, isEmpty, isUndefined, pick, some, uniq } from 'lodash'
import { compilerOptions } from '../utilities/compilerOptions'
import { flags } from '@oclif/command'
import { commandFlags } from '../constants'

export default class Build extends Command {
  public static description = 'TypeScript library build tool'

  public static examples = [
    '$ recce build -c [directory] -t esm -e src/hello.ts',
    '$ recce build -c [directory] -t cjs -e src/hello.ts -e src/world.ts',
    '$ recce build -t cjs -t umd -t esm -e src/hello.ts -e src/world.ts',
    '$ recce build --no-clean --no-minimize -t umd -e src/hello.ts'
  ]

  public static flags = {
    ...Command.flags,
    target: flags.string({
      char: 't',
      description: 'types of module systems',
      multiple: true,
      options: ['cjs', 'umd', 'esm'],
      required: false
    }),
    ...pick(commandFlags, ['entry', 'output', 'minimize', 'clean'])
  }

  public static args = []

  public async run() {
    // tslint:disable-next-line no-shadowed-variable
    const { flags } = this.parse(Build)

    const entries: string[] = isUndefined(flags.entry) ? [] : uniq(compact(flags.entry))
    const hasEntry = !isEmpty(entries)
    const defaultTargets: BuildTargets = hasEntry ? ['esm', 'cjs', 'umd'] : ['esm']

    const targets: BuildTargets = uniq(
      filter(
        isUndefined(flags.target) ? defaultTargets : (flags.target as BuildTargets),
        t => t === 'cjs' || t === 'esm' || t === 'umd'
      )
    )

    const outputPath = isUndefined(flags.output) ? 'lib' : flags.output
    const clean = isUndefined(flags.clean) ? true : flags.clean
    const minimize = isUndefined(flags.minimize) ? true : flags.minimize

    if (!hasEntry && some(targets, t => t !== 'esm')) {
      throw new Error('Specify at least one entry for CommonJS and UMD builds')
    }

    this.store.dispatch(SET_MODE('build'))

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

    const { build } = await import('../build')

    return build()
  }
}
