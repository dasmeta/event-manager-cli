import { FissionContainerEnvironment, FissionEnvironmentVariable, FunctionItem, FunctionList, GcfFunctionList } from "../interfaces";
import * as fs from "fs"
import * as moment from 'moment'
import * as yaml from 'yaml'
import {isEmpty, camelCase} from 'lodash'
import {
  DEFAULT_ENV_NAME,
  DEFAULT_ENV_NAMESPACE,
  DEFAULT_FUNCTION_NAMESPACE,
  DEFAULT_KAFKA_BOOTSTRAP_SERVER,
  DEFAULT_MQ_TRIGGER_NAMESPACE,
  DEFAULT_NODE_BUILDER_IMAGE,
  DEFAULT_NODE_ENV_IMAGE,
} from "../config";

export const getGcfState = (stateFilePath:string) => {
  const list: GcfFunctionList = require(stateFilePath)

  const data = {}
  list.forEach(item => {
    const functionName: string = item.name.split("/functions/").pop()!
    if (functionName !== undefined) {
      // @ts-ignore
      data[functionName] = item.labels || {}
    }
  })

  return data
}

export const getGcfFunctionDeploymentScript = (item: FunctionItem, envFile:string = 'env.yaml') => {
  let content = ''
  content += `\ngcloud beta functions deploy "${item.functionName}" \\`
  content += `\n  --region="europe-west1" \\`
  content += `\n  --entry-point="subscribe" \\`
  content += `\n  --memory="${item.memory || "128MB"}" \\`
  content += `\n  --max-instances=${item["max-instances"] || "1"} \\`
  content += `\n  --runtime="${item.runtime || "nodejs12"}" \\`
  content += `\n  --source="${item.absolutePath}" \\`
  content += `\n  --timeout=60 \\`

  if (item.topic) {
    content += `\n  --trigger-topic="${item.topic}" \\`
  }
  if (item.bucket) {
    content += `\n  --trigger-bucket="${item.bucket}" \\`
  }
  if (item.event) {
    content += `\n  --trigger-event="${item.event}" \\`
  }
  if (item.resource) {
    content += `\n  --trigger-resource="${item.resource}" \\`
  }

  content += `\n  --update-labels="type=event,version=${item.version}" \\`
  content += `\n  --env-vars-file="${envFile}" &\n`

  return content
}

export const generateFissionPackageSpec = (
  specFile:string,
  packagePath:string,
  name:string,
  functionNamespace:string = DEFAULT_FUNCTION_NAMESPACE,
  envName:string = DEFAULT_ENV_NAME,
  envNamespace:string = DEFAULT_ENV_NAMESPACE
) => {
  const specContent = `include:
  - ${packagePath}/*
kind: ArchiveUploadSpec
name: ${name}-XYZ

---
apiVersion: fission.io/v1
kind: Package
metadata:
  creationTimestamp: null
  name: ${name}
  namespace: ${functionNamespace}
spec:
  deployment:
    checksum: {}
  environment:
    name: ${envName}
    namespace: ${envNamespace}
  source:
    checksum: {}
    type: url
    url: archive://${name}-XYZ
status:
  buildstatus: pending
  lastUpdateTimestamp: ${moment().toISOString()}
`
  fs.writeFileSync(specFile, specContent)
}

export const generateFissionDeploymentSpec = (
  specFilePath: string,
  projectName:string,
  uid:string = 'test57b4-942d-4c4c-8502-6b5510c62db5'
) => {
  const content = `# This file is generated by the 'fission spec init' command.
# See the README in this directory for background and usage information.
# Do not edit the UID below: that will break 'fission spec apply'
apiVersion: fission.io/v1
kind: DeploymentConfig
name: ${projectName}
uid: ${uid}
`

  fs.writeFileSync(specFilePath, content)
}

export const generateFissionEnvironmentSpec = (
  specFilePath:string,
  envFilePath:string,
  envName:string = DEFAULT_ENV_NAME,
  envNamespace:string = DEFAULT_ENV_NAMESPACE,
  envImage:string = DEFAULT_NODE_ENV_IMAGE,
  builderImage:string = DEFAULT_NODE_BUILDER_IMAGE
) => {
  const content = `apiVersion: fission.io/v1
kind: Environment
metadata:
  creationTimestamp: null
  name: ${envName}
  namespace: ${envNamespace}
spec:
  builder:
    command: build
    image: ${builderImage}
  imagepullsecret: ""
  keeparchive: false
  poolsize: 3
  resources: {}
  runtime:
    image: ${envImage}
    podspec:
      containers: ~
  version: 2
`
  const spec = yaml.parse(content)

  const nodeContainer:FissionContainerEnvironment = {
    name: envName,
    env: []
  }

  const keyValue:Array<Array<string>> = Object.entries(
    yaml.parse(fs.readFileSync(envFilePath, 'utf8'))
  )

  const addVariable = (variable: FissionEnvironmentVariable):void => {
    nodeContainer.env.push(variable)
  }
  for (const [key, value] of keyValue) {
    addVariable({
      name: yaml.parse(key),
      value: yaml.parse(value)
    })
  }
  spec.spec.runtime.podspec.containers = [nodeContainer];

  const specContent = yaml.stringify(spec, {})
  fs.writeFileSync(specFilePath, specContent)
}

export const generateFissionFunctionSpec = (
  specFilePath:string,
  name:string,
  entryPoint:string,
  maxMemory:number = 128,
  timeout:number = 60,
  maxInstances:number = 1,
  functionNamespace:string = DEFAULT_FUNCTION_NAMESPACE,
  envName:string = DEFAULT_ENV_NAME,
  envNamespace:string = DEFAULT_ENV_NAMESPACE
) => {
  const content = `apiVersion: fission.io/v1
kind: Function
metadata:
  creationTimestamp: null
  name: ${name}
  namespace: ${functionNamespace}
spec:
  InvokeStrategy:
    ExecutionStrategy:
      ExecutorType: poolmgr
      MaxScale: ${maxInstances}
      MinScale: 0
      SpecializationTimeout: 120
      TargetCPUPercent: 0
    StrategyType: execution
  concurrency: 1
  environment:
    name: ${envName}
    namespace: ${envNamespace}
  functionTimeout: ${timeout}
  idletimeout: 120
  package:
    functionName: ${entryPoint}
    packageref:
      name: ${name}
      namespace: ${functionNamespace}
  requestsPerPod: 1
  resources:
    limits:
      memory: ${maxMemory}Mi`;

  fs.writeFileSync(specFilePath, content)
}

export const generateFissionMQTriggerSpec = (
  specFilePath:string,
  topic:string,
  triggerName:string,
  functionName:string,
  bootstrapServers:string = DEFAULT_KAFKA_BOOTSTRAP_SERVER,
  triggerNamespace:string = DEFAULT_MQ_TRIGGER_NAMESPACE
) => {
  const content = `apiVersion: fission.io/v1
kind: MessageQueueTrigger
metadata:
  creationTimestamp: null
  name: ${triggerName}
  namespace: ${triggerNamespace}
spec:
  contentType: application/json
  cooldownPeriod: 30
  errorTopic: error-topic
  functionref:
    functionweights: null
    name: ${functionName}
    type: name
  maxReplicaCount: 1
  maxRetries: 1
  messageQueueType: kafka
  metadata:
    bootstrapServers: ${bootstrapServers}
    consumerGroup: ${triggerName}
    topic: ${topic}
  minReplicaCount: 0
  mqtkind: keda
  pollingInterval: 5
  respTopic: response-topic
  topic: ${topic}
`
  fs.writeFileSync(specFilePath, content)
}

export const getFissionNormFunctionName = (fname:string) => {
  return fname.replace('_', '0')
}

export const generateServerlessSpecForAws = (
  awsRegion: string,
  envFilePath: string,
  topicsSpecFilePath:string,
  topics:Array<string>,
  functionsSpecFilePath:string,
  functions: FunctionList,
  additionalEnvironment: {[key: string]: string} = {}
) => {
  const content = `service: eventManager
app: eventmanager
provider:
  name: aws
  region: ${awsRegion}
`
  const spec = yaml.parse(content)

  const keyValue:Array<Array<string>> = Object.entries(
    yaml.parse(fs.readFileSync(envFilePath, 'utf8'))
  )

  const variables: {[key: string]: any} = {};
  for (const [key, value] of keyValue) {
    variables[`${yaml.parse(key)}`] = yaml.parse(value);
  }

  if(!isEmpty(variables)) {
    spec.provider.environment = {...additionalEnvironment, ...variables};
  }

  if(!isEmpty(topics)) {
    spec.resources = [];
  }
  topics.forEach(name => {
    spec.resources.push(`$\{file(./${topicsSpecFilePath}/${name}.yml)\}`)
  })

  if(!isEmpty(functions)) {
    spec.functions = [];
  }
  functions.forEach(item => {
    spec.functions.push(`$\{file(./${functionsSpecFilePath}/${item.functionName}.yml)\}`)
  })

  const specContent = yaml.stringify(spec, {})

  fs.writeFileSync('serverless.yml', specContent)
}

export const generateServerlessFunctionSpecForAws = (
  functionItem: FunctionItem,
  specFilePath:string
) => {

  const content = `em-${camelCase(functionItem.functionName)}:
  name: ${functionItem.functionName}
  handler: ${functionItem.path}/run.subscribe
  events:
    - sns:
        arn: !Ref em${camelCase(functionItem.topic)}
        topicName: ${camelCase(functionItem.topic)}
  tags:
    version: ${functionItem.version}
  runtime: ${functionItem.runtime || 'nodejs14'}.x
  memorySize: ${parseInt(functionItem.memory) || '128'}
  timeout: 60
  reservedConcurrency: ${functionItem["max-instances"] || '1'}
  package:
    individually: true
    patterns:
      - '!./**'
      - './${functionItem.path}/**'
      - '!./${functionItem.path}/yarn.lock'
`
  fs.writeFileSync(`${specFilePath}/${functionItem.functionName}.yml`, content)

  const runContent = 'exports.subscribe = require("@dasmeta/event-manager-platform-helper").wrapHandler(require("./handler"), "aws")'
  fs.writeFileSync(`./${functionItem.path}/run.js`, runContent)
}

export const generateServerlessSNSTopicSpecForAws = (
  specFilePath:string,
  topicName:string
) => {
  const topic = camelCase(topicName);
  const content = `Resources:
  em${topic}:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: ${topic}
`
  fs.writeFileSync(specFilePath, content)
}
