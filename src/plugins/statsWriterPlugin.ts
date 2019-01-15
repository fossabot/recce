import { Compiler } from 'webpack'
import { store } from '../store'
import { ADD_STATS } from '../actions'

export class StatsWriterPlugin {
  public apply(compiler: Compiler) {
    compiler.hooks.emit.tapPromise('stats-writer-plugin', async compilation => {
      store.dispatch(
        ADD_STATS({
          module: compilation.compiler.name as 'cjs' | 'umd',
          stats: compilation.getStats().toJson()
        })
      )
    })
  }
}
