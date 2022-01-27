import {Command, Flags} from '@oclif/core'
import * as path from 'path'
import * as chalk from 'chalk'
import * as fse from 'fs-extra'
import * as semver from 'semver'
import {jsonWriteOptions} from '../../config'
import {cloneDeep} from 'lodash'
import {ProjectFunctionConfig} from '../../interfaces'
import {getFunctions} from '../../utility/functionsHelper'
import {getProjectPaths} from '../../utility/commandsHelper'

export default class SyncDependencies extends Command {
  static description = 'Syncs all detected functions dependencies to match to project one.'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-dir': Flags.string({description: 'Project root directory', required: false, default: process.cwd()}),
    'project-name': Flags.string({description: 'Sub project directory', required: false, default: ''}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(SyncDependencies)

    const {absoluteFunctionsPath, dependencies} = getProjectPaths(flags['project-dir'], flags['project-name'])

    for (const item of getFunctions(absoluteFunctionsPath)) {
      if (!item.topic) {
        continue
      }

      const packagePath = path.join(item.absolutePath, 'package.json')
      const packageData = require(packagePath)

      const old = cloneDeep(packageData.dependencies)
      const newDependencies = Object.keys(old).reduce((newDep:any, key:string) => {
        if (!dependencies[key] || semver.gt(old[key].slice(1), dependencies[key].slice(1))) {
          return newDep
        }

        newDep[key] = dependencies[key]
        return newDep
      }, {})

      packageData.dependencies = {...old, ...newDependencies}
      fse.writeJSONSync(packagePath, packageData, jsonWriteOptions)
    }
  }
}
