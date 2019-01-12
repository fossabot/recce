/* tslint:disable no-unsafe-any */

import Command from '../base'
import { SET_MODE } from '../actions'
import { pick } from 'lodash'
import { apiExtractFlags } from '../constants'

export default class ApiExtract extends Command {
  public static description = 'Extract API from declaration files'

  public static examples = ['$ recce api-extract -p [directory] -e lib/hello.d.ts']

  public static flags = {
    ...Command.flags,
    ...pick(apiExtractFlags, ['entry', 'output'])
  }

  public static args = []

  public async run() {
    // tslint:disable-next-line no-shadowed-variable
    const { flags } = this.parse(ApiExtract)

    this.store.dispatch(SET_MODE('api-extract'))

    const { run } = await import('../effects/api-extract')

    return run(flags)
  }
}
