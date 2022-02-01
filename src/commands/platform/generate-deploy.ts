import {Command, Flags} from '@oclif/core'
import * as chalk from 'chalk'
import * as fs from "fs"
import * as fse from "fs-extra"
import { getFunctions } from "../../utility/functionsHelper"
import { getProjectPaths } from "../../utility/commandsHelper"
import * as path from "path"
import {
  generateFissionDeploymentSpec,
  generateFissionEnvironmentSpec,
  generateFissionFunctionSpec,
  generateFissionMQTriggerSpec,
  generateFissionPackageSpec,
  getFissionNormFunctionName,
  getGcfFunctionDeploymentScript,
  getGcfState,
} from "../../utility/deploymentHelper";

export default class GenerateDeploy extends Command {
  static description = 'Generates deployment files.'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-dir': Flags.string({description: 'Project root directory', required: false, default: process.cwd()}),
    'project-name': Flags.string({description: 'Sub project directory', required: false, default: ''}),
    'is-GCF': Flags.boolean({description: 'Use GCF instructions', required: false, exactlyOne: ['is-GCF', 'is-fission'], dependsOn: ['functions-list-file']}),
    'is-fission': Flags.boolean({description: 'Use fission instructions', required: false, exactlyOne: ['is-GCF', 'is-fission'], dependsOn: ['kafka-bootstrap-server']}),
    'functions-list-file': Flags.string({description: 'GCF deployed functions list'}),
    'kafka-bootstrap-server': Flags.string({description: 'Kafka server for Fission MQT'})
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

        content += getGcfFunctionDeploymentScript(item)
      })
      content += `\nwait\n`

      const deployScriptPath = path.join(absoluteBasePath, 'deploy.sh')
      fs.writeFileSync(deployScriptPath, content)
      this.log(chalk.green(`Generated deployment script in '${deployScriptPath}'`))
    }

    if (flags['is-fission']) {
      const bootstrapServers:string = flags['kafka-bootstrap-server']!

      const specDir = path.join(absoluteBasePath, 'specs')
      await fse.ensureDir(specDir)

      const projectName:string = absoluteBasePath.split('/').pop()!

      generateFissionDeploymentSpec(path.join(specDir, `deployment-${projectName}.yaml`), projectName)
      generateFissionEnvironmentSpec(path.join(specDir, 'env-nodejs-12.yaml'), path.join(absoluteBasePath, 'env.yml'))

      //todo remove
      let i = 0;
      getFunctions(absoluteFunctionsPath).forEach((item) => {
        const excludedFunctions = [
          "vocabulary_handle-image-resize"
        ];
        if (excludedFunctions.includes(item.functionName)) {
          return;
        }

        // @todo remove limit
        i++
        if (i > 5) { return }

        const functionName = item.functionName;
        const normFunctionName = getFissionNormFunctionName(functionName);
        const packagePath = item.path;
        const version = item.version.replace(/[.]/gi, "-");

        generateFissionPackageSpec(`${specDir}/package-${functionName}.yaml`, packagePath, normFunctionName);

        generateFissionFunctionSpec(
          path.join(specDir, `function-${functionName}.yaml`),
          normFunctionName,
          "run.subscribe",
          Number.parseInt(item.memory) || 128,
          60,
          item["max-instances"] || 1
        );
        generateFissionMQTriggerSpec(
          path.join(specDir, `MQT-${functionName}.yaml`),
          item.topic,
          normFunctionName,
          normFunctionName,
          bootstrapServers
        )
      });

      this.log(chalk.green(`Generated specs in '${specDir}'`))

      const deployScriptPath = path.join(absoluteBasePath, 'deploy.sh')
      fs.writeFileSync(deployScriptPath, `#!/bin/bash
fission spec apply --wait --delete`)

      this.log(chalk.green(`Generated deployment script in '${deployScriptPath}'`))
    }
  }
}
