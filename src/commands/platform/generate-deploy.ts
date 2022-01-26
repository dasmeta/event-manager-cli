import {Command, Flags} from '@oclif/core'
import * as chalk from 'chalk'

export default class GenerateDeploy extends Command {
  static description = 'Create platform'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    format: Flags.string({description: 'Platform data format', required: false}),
  }

  static args = [{name: 'name', description: 'Platform name', required: true}]

  async run(): Promise<void> {
    const {args, flags} = await this.parse(GenerateDeploy)

    this.log(`Create ${args.name} platform with options: ${flags.format}!`)
    this.error(chalk.red('command is not implemented'))
  }
}
