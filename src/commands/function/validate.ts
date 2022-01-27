import {Command, Flags} from '@oclif/core'
import * as path from 'path'
import * as chalk from 'chalk'
import {ProjectFunctionConfig} from '../../interfaces'
import {validateName} from '../../utility/validator'
import {getFunctions} from '../../utility/functionsHelper'
import {getProjectPaths} from '../../utility/commandsHelper'

export default class Validate extends Command {
  static description = 'Validates functions in the project'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-dir': Flags.string({description: 'Project root directory', required: false, default: process.cwd()}),
    'project-name': Flags.string({description: 'Sub project directory', required: false, default: ''}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Validate)

    const {absoluteFunctionsPath, absoluteBasePath} = getProjectPaths(flags['project-dir'], flags['project-name'])

    if (
      !getFunctions(absoluteFunctionsPath)
      .reduce((acc, item) => validateName(item.functionName) && acc, true)
    ) {
      this.error(chalk.red('Functions validation failed.'))
    }

    console.log('\u001B[32m', 'DONE.', '\u001B[0m')
  }
}
