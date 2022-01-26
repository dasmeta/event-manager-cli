import {Command, Flags} from '@oclif/core'
import * as fse from 'fs-extra'
import * as path from 'path'

const configFiles = [
  'config.json',
]

export default class Init extends Command {
  static description = 'Initializes configurations.'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    force: Flags.boolean({char: 'f', description: 'restore all default configs'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Init)

    console.log(this.config.configDir)

    for (const configFile of configFiles) {
      await fse.ensureFile(path.join(this.config.configDir, configFile))
    }

    const defaultConfigs = {}
    let userConfig
    const configFilePath = path.join(this.config.configDir, 'config.json')
    try {
      userConfig = await fse.readJSON(configFilePath)
    } catch (error) {
      if (error instanceof SyntaxError) {
        userConfig = defaultConfigs
      }
    } finally {
      if (flags.force) {
        userConfig = defaultConfigs
      }

      await fse.writeJSON(configFilePath, userConfig)
      this.log('<%= config.bin %> configuration initialization completed.')
    }
  }
}
