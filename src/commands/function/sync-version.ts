import {Command, Flags} from '@oclif/core'
import * as fs from 'node:fs'
import * as path from 'path'
import * as fse from 'fs-extra'
import {execSync as exec} from 'node:child_process'
import {getProjectPaths} from '../../utility/commandsHelper'
import {jsonWriteOptions} from '../../config'

export default class SyncVersion extends Command {
  static description = 'Syncs all detected changed functions versions.'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-dir': Flags.string({description: 'Project root directory', required: true}),
    'project-name': Flags.string({description: 'Sub project directory', required: true}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(SyncVersion)

    const {absoluteBasePath, functionsConfig} = getProjectPaths(flags['project-dir'], flags['project-name'])

    exec(`git -C ${absoluteBasePath} diff --name-only --cached`)
    .toString()
    .split('\n')
    .filter((line:any) => line)
    .sort((a:string, b:string) => b.length - a.length)
    .reduce((files:any, line:any) => {
      if (line.indexOf(`${functionsConfig.dir}/`) === 0) {
        files.push(line)
      }

      return files
    }, [])
    .reduce((functions:any, file:any) => {
      const path = file
      .split('/')
      .slice(0, 3)
      .join('/')
      if (!functions.includes(path)) {
        functions.push(path)
      }

      return functions
    }, [])
    .forEach((functionDir:any) => {
      const packagePath = path.join(absoluteBasePath, functionDir, 'package.json')

      if (!fs.existsSync(packagePath)) {
        return
      }

      const diff = exec(`git -C ${absoluteBasePath} diff --cached -U0 ${packagePath}`).toString()
      const isVersionChanged = diff.split('\n').reduce((acc:any, line:any) => acc || line.includes('"version": "'), false)

      if (!isVersionChanged) {
        const content = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
        const versions = content.version.split('.')
        versions[2] = Number.parseInt(versions[2]) + 1
        content.version = versions.join('.')

        fse.writeJSONSync(packagePath, content, jsonWriteOptions)
        exec(`git -C ${absoluteBasePath} add ${packagePath}`)
      }
    })
  }
}
