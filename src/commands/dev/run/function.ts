import {Command, Flags} from '@oclif/core'
import * as chalk from 'chalk'
import * as path from 'path'
import {getFunction, updateProcessEnv} from '../../../utility/functionsHelper'
import {getProjectPaths} from '../../../utility/commandsHelper'

export default class Topic extends Command {
  static description = 'Run function in local environment'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-dir': Flags.string({description: 'Project root directory', required: true}),
    'project-name': Flags.string({description: 'Sub project directory', required: true}),
    'function-namespace': Flags.string({description: 'Function namespace', required: true}),
    'function-name': Flags.string({description: 'Function name', required: true}),
    'test-data-file': Flags.string({description: 'Test data file', required: true}),
    'env-file': Flags.string({description: 'Environment variables file with JSON format'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Topic)

    const {absoluteFunctionsPath} = getProjectPaths(flags['project-dir'], flags['project-name'])

    updateProcessEnv(flags['env-file'])

    const testData = require(flags['test-data-file'])

    const functionItem = getFunction(absoluteFunctionsPath, flags['function-namespace'], flags['function-name'])
    if (!functionItem.topic) {
      this.error(chalk.red('Function config does not have "topic" attribute.'))
    }

    const handler = require(path.join(functionItem.absolutePath, 'handler'))
    let handlerIndex: Function = handler
    if (!(handler instanceof Function)) {
      handlerIndex = handler.handler
    }

    await handlerIndex(testData[functionItem.topic])
  }
}
