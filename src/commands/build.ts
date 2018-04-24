/* tslint:disable no-unsafe-any */

import Command from '../base'
import { flags } from '@oclif/command'
import { compact, filter, isEmpty, isUndefined, some, uniq } from 'lodash'
import { SET_BUILD_OPTIONS, SET_MODE } from '../actions'
import { compilerOptions } from '../utilities/compilerOptions'

import { BuildTargets } from '../types'

export default class Build extends Command {
  public static description = 'TypeScript library build tool'

  public static examples = [
    '$ recce build -c [directory] -t esm -e src/hello.ts',
    '$ recce build -c [directory] -t cjs -e src/hello.ts -e src/world.ts',
    '$ recce build -t cjs -t umd -t esm -e src/hello.ts -e src/world.ts',
    '$ recce build --no-clean -no-minimize -t umd -e src/hello.ts'
  ]

  public static flags = {
    ...Command.flags,
    entry: flags.string({
      char: 'e',
      description: 'project entry point',
      multiple: true,
      required: false
    }),
    target: flags.string({
      char: 't',
      description: 'types of module systems',
      multiple: true,
      options: ['cjs', 'umd', 'esm'],
      required: false
    }),
    output: flags.string({
      char: 'o',
      description: 'output directory path',
      default: 'lib',
      required: false
    }),
    minimize: flags.boolean({
      description: '[default: true] minimize javascript',
      allowNo: true
    }),
    clean: flags.boolean({
      description: '[default: true] clean output directory',
      allowNo: true
    })
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
