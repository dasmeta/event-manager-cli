import {Command, Flags, CliUx} from '@oclif/core'
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
  generateFissionMQTriggerSpecKafka,
  generateFissionMQTriggerSpecRabbitMQ,
  generateFissionPackageSpec,
  getFissionNormFunctionName,
  getGcfFunctionDeploymentScript,
  getGcfState,
  generateServerlessSpecForAws,
  generateServerlessFunctionSpecForAws,
  generateServerlessSNSTopicSpecForAws,
  generateRabbitMqSecret
} from "../../utility/deploymentHelper";
import {
  DEFAULT_RABBIT_MQ_SECRET,
  DEFAULT_ENV_NAME
} from "../../config";

export default class GenerateDeploy extends Command {
  static description = 'Generates deployment files.'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-dir': Flags.string({description: 'Project root directory', required: true}),
    'project-name': Flags.string({description: 'Sub project directory', required: false, default: ''}),
    'is-GCF': Flags.boolean({description: 'Use GCF instructions', required: false, exactlyOne: ['is-GCF', 'is-fission', 'is-serverless-aws'], dependsOn: ['functions-list-file']}),
    'is-fission': Flags.boolean({description: 'Use fission instructions', required: false, exactlyOne: ['is-GCF', 'is-fission', 'is-serverless-aws'], relationships: [{
      type: 'some', flags: ['kafka-bootstrap-server', 'rabbitmq-host']
    }]}),
    'functions-list-file': Flags.string({description: 'GCF deployed functions list'}),
    'is-serverless-aws': Flags.boolean({description: 'Use serverless instructions for AWS', required: false, exactlyOne: ['is-GCF', 'is-fission', 'is-serverless-aws'], dependsOn: ['aws-region']}),
    'kafka-bootstrap-server': Flags.string({description: 'Kafka server for Fission MQT', exclusive: ['rabbitmq-host']}),
    'rabbitmq-host': Flags.string({description: 'Rabbit host for Fission MQT', exclusive: ['kafka-bootstrap-server']}),
    'aws-region': Flags.string({description: 'AWS region'}),
    'topic': Flags.string({description: 'Topics to deploy functions for', char: 't', multiple: true, default: []}),
    'excluded-topic': Flags.string({description: 'Topics to exclude', char: 'T', multiple: true, default: []}),
    'subscription': Flags.string({description: 'Functions to deploy', char: 's', multiple: true, default: []}),
    'excluded-subscription': Flags.string({description: 'Subscription to exclude', char: 'S', multiple: true, default: []}),
    'env-file': Flags.string({description: 'Deployment environment file', char: 'e', required: true}),
    'event-manager-backend-host': Flags.string({description: 'Event manager backend host', char: 'b', required: true}),
    'fission-function-namespace': Flags.string({description: 'Fission function namespace', aliases: ['ffns'], required: false}),
    'fission-mqtrigger-namespace': Flags.string({description: 'Fission mqtrigger namespace', aliases: ['fmns'], required: false}),
    'fission-environment-namespace': Flags.string({description: 'Fission environment namespace', aliases: ['fens'], required: false}),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(GenerateDeploy)

    const { absoluteFunctionsPath, absoluteBasePath, functionsConfig } = getProjectPaths(flags['project-dir'], flags['project-name'])

    const getFilteredFunctions = () => {
      let functions = getFunctions(absoluteFunctionsPath)

      if(0 === flags.topic.length && 0 === flags.subscription.length &&
         0 === flags['excluded-topic'].length && 0 === flags['excluded-subscription'].length) {
        return functions
      }

      if(0 !== flags['excluded-topic'].length) {
        functions = functions.filter((item) => {
          return item.config.topic && !flags['excluded-topic'].includes(item.config.topic);
        })
      }

      if(0 !== flags['excluded-subscription'].length) {
        functions = functions.filter((item) => {
          return item.functionName && !flags['excluded-subscription'].includes(item.functionName);
        })
      }

      if(0 !== flags.topic.length) {
        functions = functions.filter((item) => {
          return item.config.topic && flags.topic.includes(item.config.topic)
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
      const rabbitMqHostConfig:string = flags['rabbitmq-host']!

      let rabbitMqHost=`amqp://${rabbitMqHostConfig}/`;
      let rabbitMqSecret = DEFAULT_RABBIT_MQ_SECRET;

      if(rabbitMqHostConfig) {
        const setupRedisSecret = await CliUx.ux.prompt('Would you like to create secret for rabbitmq? (y/n)', { default: 'n' });
        if(setupRedisSecret === 'y') {
          const secretName = await CliUx.ux.prompt('Secret name', { default: 'rabbitmq-secret' });
          const username = await CliUx.ux.prompt('Rabbitmq username', { required: false });
          const password = await CliUx.ux.prompt('Rabbitmq password', { required: false });
  
          if(!!username && !!password) {
            rabbitMqHost=`amqp://${username}:${password}@${rabbitMqHostConfig}/`;
          }

          rabbitMqSecret = secretName;
  
          generateRabbitMqSecret(path.join(absoluteBasePath, `rabbitmq-secret.yaml`), secretName, rabbitMqHost, flags['fission-mqtrigger-namespace'])
  
          this.log(chalk.green(`rabbitmq-secret.yaml file was generated`))
          this.log(chalk.gray(`run "kubectl apply -f rabbitmq-secret.yaml" to apply the secret`))
        }
      }

      const specDir = path.join(absoluteBasePath, 'specs')
      await fse.ensureDir(specDir)

      const projectName:string = absoluteBasePath.split('/').pop()!

      // get unique environments
      const uniqueEnvironments: Record<string, any> = {};
      getFilteredFunctions().forEach(item => {
        if(!uniqueEnvironments[item.config.env || DEFAULT_ENV_NAME]) {
          uniqueEnvironments[item.config.env || DEFAULT_ENV_NAME] = {
            'build': item.config.buildImg,
            'runtime': item.config.runtimeImg
          }
        }
      })

      generateFissionDeploymentSpec(path.join(specDir, `deployment-${projectName}.yaml`), projectName, functionsConfig.uid)

      Object.keys(uniqueEnvironments).forEach((env) => {
        generateFissionEnvironmentSpec(
          path.join(specDir, `env-${env}.yaml`),
          path.join(absoluteBasePath, flags['env-file']),
          env,
          flags['fission-environment-namespace'],
          uniqueEnvironments[env]['runtime'],
          uniqueEnvironments[env]['build'],
        )
      })

      const functionApplyCommands: Array<string> = [];

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
        
        generateFissionPackageSpec(
          `${specDir}/package-${functionName}.yaml`, 
          packagePath, 
          normFunctionName, 
          flags['fission-function-namespace'],
          item.config.env,
          flags['fission-environment-namespace']
        );

        generateFissionFunctionSpec(
          path.join(specDir, `function-${functionName}.yaml`),
          normFunctionName,
          "run.subscribe",
          Number.parseInt(item.config.memory) || 128,
          60,
          item.config.maxInstances || 1,
          flags['fission-function-namespace'],
          item.config.env,
          flags['fission-environment-namespace']
        );

        if(bootstrapServers) {
          generateFissionMQTriggerSpecKafka(
            path.join(specDir, `MQT-${functionName}.yaml`),
            item.config.topic,
            normFunctionName,
            normFunctionName,
            bootstrapServers,
            flags['fission-mqtrigger-namespace']
          )
        }

        if(rabbitMqHostConfig) {
          generateFissionMQTriggerSpecRabbitMQ(
            path.join(specDir, `MQT-${functionName}.yaml`),
            item.config.topic,
            normFunctionName,
            normFunctionName,
            rabbitMqSecret,
            flags['fission-mqtrigger-namespace']
          )
        }

        functionApplyCommands.push(`
### ${functionName}
cp specs-all/function-${functionName}.yaml specs/function-${functionName}.yaml
cp specs-all/MQT-${functionName}.yaml specs/MQT-${functionName}.yaml
cp specs-all/package-${functionName}.yaml specs/package-${functionName}.yaml
fission spec apply --wait
rm specs/function-${functionName}.yaml
rm specs/MQT-${functionName}.yaml
rm specs/package-${functionName}.yaml
###`)
      });

      this.log(chalk.green(`Generated specs in '${specDir}'`))

      const deployScriptPath = path.join(absoluteBasePath, 'deploy.sh')
      fs.writeFileSync(deployScriptPath, `#!/bin/bash
mkdir specs-all
cp -r specs/* specs-all/
rm specs/function-*
rm specs/MQT-*
rm specs/package-*
${functionApplyCommands.join('\n')}
cp -r specs-all/* specs/
fission spec apply --wait --delete

rm -rf specs-all
`)

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
        functionPackageInstallCommands.push(`cd ${item.path} && yarn && yarn add @dasmeta/event-manager-platform-helper@1.3.1 && cd $CURRENT_DIR`)
        functionPackageRemoveCommands.push(`cd ${item.path} && yarn remove @dasmeta/event-manager-platform-helper && cd $CURRENT_DIR`)
        topicNames[item.config.topic] = true
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
