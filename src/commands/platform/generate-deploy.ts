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
  generateServerlessSpecForAws,
  generateServerlessFunctionSpecForAws,
  generateServerlessSNSTopicSpecForAws,
} from "../../utility/deploymentHelper";

export default class GenerateDeploy extends Command {
  static description = 'Generates deployment files.'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-dir': Flags.string({description: 'Project root directory', required: true}),
    'project-name': Flags.string({description: 'Sub project directory', required: false, default: ''}),
    'is-GCF': Flags.boolean({description: 'Use GCF instructions', required: false, exactlyOne: ['is-GCF', 'is-fission', 'is-serverless-aws'], dependsOn: ['functions-list-file']}),
    'is-fission': Flags.boolean({description: 'Use fission instructions', required: false, exactlyOne: ['is-GCF', 'is-fission', 'is-serverless-aws'], dependsOn: ['kafka-bootstrap-server', 'fission-namespace']}),
    'functions-list-file': Flags.string({description: 'GCF deployed functions list'}),
    'is-serverless-aws': Flags.boolean({description: 'Use serverless instructions for AWS', required: false, exactlyOne: ['is-GCF', 'is-fission', 'is-serverless-aws'], dependsOn: ['aws-region']}),
    'kafka-bootstrap-server': Flags.string({description: 'Kafka server for Fission MQT'}),
    'aws-region': Flags.string({description: 'AWS region'}),
    'fission-namespace': Flags.string({description: 'Fission deployment namespace', required: false}),
    'topic': Flags.string({description: 'Topics to deploy functions for', char: 't', multiple: true, default: []}),
    'subscription': Flags.string({description: 'Functions to deploy', char: 's', multiple: true, default: []}),
    'env-file': Flags.string({description: 'Deployment environment file', required: true}),
    'event-manager-backend-host': Flags.string({description: 'Event manager backend host', required: true})
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(GenerateDeploy)

    const { absoluteFunctionsPath, absoluteBasePath, functionsConfig } = getProjectPaths(flags['project-dir'], flags['project-name'])

    const getFilteredFunctions = () => {
      let functions = getFunctions(absoluteFunctionsPath)
      if (0 === flags.topic.length && 0 === flags.subscription.length) {
        return functions
      }

      if(0 !== flags.topic.length) {
        functions = functions.filter((item) => {
          return item.topic && flags.topic.includes(item.topic)
        })
      }

      if(0 !== flags.subscription.length) {
        functions = functions.filter((item) => {
          return item.functionName && flags.subscription.includes(item.functionName)
        })
      }

      return functions;
    }

    if (flags["is-GCF"]) {
      let content = "#!bin/bash\n\n"

      const data = getGcfState(flags["functions-list-file"]!)

      getFilteredFunctions().forEach(item => {
        item.version = item.version.replace(/[.]/gi, "-")

        // @ts-ignore
        if (data[item.functionName] && data[item.functionName].version && data[item.functionName].version === item.version) {
          return
        }

        content += getGcfFunctionDeploymentScript(item, flags['env-file'])
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

      generateFissionDeploymentSpec(path.join(specDir, `deployment-${projectName}.yaml`), projectName, functionsConfig.uid)
      generateFissionEnvironmentSpec(
        path.join(specDir, 'env-nodejs-12.yaml'),
        path.join(absoluteBasePath, flags['env-file'])
      )

      getFilteredFunctions().forEach((item) => {
        const excludedFunctions = [
          "vocabulary_handle-image-resize"
        ];
        if (excludedFunctions.includes(item.functionName)) {
          return;
        }

        const functionName = item.functionName;
        const normFunctionName = getFissionNormFunctionName(functionName);
        const packagePath = item.path;
        const version = item.version.replace(/[.]/gi, "-");

        generateFissionPackageSpec(`${specDir}/package-${functionName}.yaml`, packagePath, normFunctionName, flags['fission-namespace']);

        generateFissionFunctionSpec(
          path.join(specDir, `function-${functionName}.yaml`),
          normFunctionName,
          "run.subscribe",
          Number.parseInt(item.memory) || 128,
          60,
          item["max-instances"] || 1,
          flags['fission-namespace']
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

    if(flags['is-serverless-aws']) {

      const specDirFunction = path.join(absoluteBasePath, 'specs', 'functions');
      await fse.ensureDir(specDirFunction);
      const specDirTopics = path.join(absoluteBasePath, 'specs', 'topics');
      await fse.ensureDir(specDirTopics);

      const topicNames: {[key: string]: boolean} = {};
      const functionPackageInstallCommands: Array<string> = [];
      const functionPackageRemoveCommands: Array<string> = [];
      const functions = getFilteredFunctions();

      functions.forEach((item) => {
        generateServerlessFunctionSpecForAws(
          item, 
          path.join('specs', 'functions')
        )
        functionPackageInstallCommands.push(`cd ${item.path} && yarn && yarn add @dasmeta/event-manager-platform-helper@1.3.0 && cd $CURRENT_DIR`)
        functionPackageRemoveCommands.push(`cd ${item.path} && yarn remove @dasmeta/event-manager-platform-helper && cd $CURRENT_DIR`)
        topicNames[item.topic] = true
      })

      Object.keys(topicNames).forEach((topic) => {
        generateServerlessSNSTopicSpecForAws(
          `${specDirTopics}/${topic}.yml`,
          topic
        )
      })

      generateServerlessSpecForAws(
        flags['aws-region'] as string,
        path.join(absoluteBasePath, flags['env-file']),
        path.join('specs', 'topics'),
        Object.keys(topicNames),
        path.join('specs', 'functions'),
        functions,
        {
          'EVENT_MANAGER_BACKEND_HOST': flags['event-manager-backend-host']
        }
      )

      const deployScriptPath = path.join(absoluteBasePath, 'deploy.sh')
      fs.writeFileSync(deployScriptPath, `#!/bin/bash
CURRENT_DIR=$(pwd)
${functionPackageInstallCommands.join('\n')}
serverless deploy
${functionPackageRemoveCommands.join('\n')}
`)

      this.log(chalk.green(`Generated deployment script in '${deployScriptPath}'`))
    }
  }
}
