import { Extractor, IExtractorConfig, IExtractorOptions } from '@microsoft/api-extractor'
import { context, contextModules, packageName } from '../selectors'
import { resolve } from 'path'
import { assign, isUndefined, noop } from 'lodash'
import { store } from '../store'
import { logger } from '@escapace/logger'
import { isEmpty, isFile, readFileAsync, rimraf, writeFileAsync } from '../utilities'

export const run = async ({ entry, output }: { entry: string; output?: string }) => {
  const state = store.getState()

  const outputPath = isUndefined(output) ? resolve(context(state), 'api.json') : resolve(output)

  if ((await isFile(outputPath)).test) {
    throw new Error(`The file '${outputPath}' already exists`)
  }

  const success = await new Promise<boolean>(done => {
    // This interface represents the API Extractor config file contents
    const config: IExtractorConfig = {
      apiReviewFile: {
        enabled: false
      },
      apiJsonFile: {
        enabled: true,
        outputFolder: './dist'
      },
      compiler: {
        configType: 'tsconfig',
        rootFolder: context(state)
      },
      project: {
        entryPointSourceFile: resolve(context(state), entry)
      }
    }

    assign(config, {
      validationRules: {
        missingReleaseTags: 'allow'
      }
    })

    const options: IExtractorOptions = {
      customLogger: {
        logInfo: noop,
        logWarning: noop,
        logVerbose: noop,
        logError: logger.error
      },
      localBuild: true,
      typescriptCompilerFolder: resolve(contextModules(state), 'typescript')
    }

    const extractor: Extractor = new Extractor(config, options)

    if (extractor.processProject()) {
      done(true)
    } else {
      done(false)
    }
  })

  const cleanup = () =>
    Promise.resolve()
      .then(() => rimraf(resolve(context(state), 'dist', 'tsdoc-metadata.json')))
      .then(() => rimraf(resolve(context(state), 'dist', `${packageName(state)}.api.json`)))
      .then(() => isEmpty(resolve(context(state), 'dist')))
      .then(t => (t ? rimraf(resolve(context(state), 'dist')) : true))

  if (success) {
    const data = await readFileAsync(
      resolve(context(state), 'dist', `${packageName(state)}.api.json`)
    ).then(
      // tslint:disable-next-line no-console
      d => d.toString()
    )

    await cleanup()

    await writeFileAsync(outputPath, data)
  } else {
    await cleanup()
  }
}
