import {Command, Flags} from '@oclif/core'
import * as path from 'path'
import {getFunctions, updateProcessEnv} from '../../../utility/functionsHelper'
import {getProjectPaths} from '../../../utility/commandsHelper'

export default class Topic extends Command {
  static description = 'Run topic in local environment'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-dir': Flags.string({description: 'Project root directory', required: false, default: process.cwd()}),
    'project-name': Flags.string({description: 'Sub project directory', required: false, default: ''}),
    'test-data-file': Flags.string({description: 'Test data file', required: true}),
    topic: Flags.string({char: 't', description: 'Topic to run', required: true}),
    'env-file': Flags.string({description: 'Environment variables file with JSON format'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Topic)

    const {absoluteFunctionsPath} = getProjectPaths(flags['project-dir'], flags['project-name'])

    updateProcessEnv(flags['env-file'])

    const testData = require(flags['test-data-file'])

    const calls = getFunctions(absoluteFunctionsPath).map(item => {
      if (!item.topic || item.topic !== flags.topic) {
        return null
      }

      const handler = require(path.join(item.absolutePath, 'handler'))
      let handlerIndex: Function = handler
      if (!(handler instanceof Function)) {
        handlerIndex = handler.handler
      }

      return handlerIndex(testData[item.topic])
    })
    .filter(item => Boolean(item))

    await Promise.all(calls)
  }
}
