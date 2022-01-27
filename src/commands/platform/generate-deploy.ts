import {Command, Flags} from '@oclif/core'
import * as chalk from 'chalk'
import * as fs from "fs"
import { getFunctions } from "../../utility/functionsHelper"
import { getProjectPaths } from "../../utility/commandsHelper"
import * as path from "path"
import { getFunctionDeploymentScript, getGcfState } from "../../utility/deploymentHelper";

export default class GenerateDeploy extends Command {
  static description = 'Create platform'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-dir': Flags.string({description: 'Project root directory', required: false, default: process.cwd()}),
    'project-name': Flags.string({description: 'Sub project directory', required: false, default: ''}),
    'is-GCF': Flags.boolean({description: 'Use GCF instructions', required: false, exactlyOne: ['is-GCF', 'is-fission'], dependsOn: ['functions-list-file']}),
    'is-fission': Flags.boolean({description: 'Use fission instructions', required: false, exactlyOne: ['is-GCF', 'is-fission']}),
    'functions-list-file': Flags.string({description: 'GCF deployed functions list'})
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(GenerateDeploy)

    const { absoluteFunctionsPath, absoluteBasePath } = getProjectPaths(flags['project-dir'], flags['project-name'])

    if (flags["is-GCF"]) {
      let content = "#!bin/bash\n\n"

      const data = getGcfState(flags["functions-list-file"]!)

      getFunctions(absoluteFunctionsPath).forEach(item => {
        item.version = item.version.replace(/[.]/gi, "-")

        // @ts-ignore
        if (data[item.functionName] && data[item.functionName].version && data[item.functionName].version === item.version) {
          return
        }

        content += getFunctionDeploymentScript(item)
      })
      content += `\nwait\n`

      const deployScriptPath = path.join(absoluteBasePath, 'deploy.sh')
      fs.writeFileSync(deployScriptPath, content)
      this.log(chalk.green(`Generated deployment script in '${deployScriptPath}'`))
    }
  }
}
