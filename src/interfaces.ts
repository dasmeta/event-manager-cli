interface Config {
  topic: string
  minInstances: number
  maxInstances: number
  memory: string
  timeout: number
  maxAttempts: number
}

export interface GcfConfig extends Config {
  runtime?: string
  resource?: string
  bucket?: string
  event?: string
}

export interface FissionConfig extends Config {
  env?: string
  buildImg?: string
  runtimeImg?: string
}

export interface ServerlessConfig extends Config {
  runtime?: string
}

interface GcfLabel {
  version: string
}
export interface GcfFunctionItem {
  name: string
  labels: GcfLabel
}

export type GcfFunctionList = Array<GcfFunctionItem>

export interface FunctionItem {
  // ${namespace}_${name}
  functionName: string
  // Relative path of a function {functions-dir}/{functions-group}/{function}
  path: string
  // Absolut path of a function
  absolutePath: string
  version: string
  config: GcfConfig & FissionConfig & ServerlessConfig
}

export type FunctionList = Array<FunctionItem>

//  "functionsConfig" key in package.json of the project
export interface ProjectFunctionConfig {
  dir: string
  uid: string
}

export interface ProjectMetadata {
  absoluteBasePath: string,
  absoluteFunctionsPath: string,
  dependencies: any,
  functionsConfig: ProjectFunctionConfig
}

export interface FissionEnvironmentVariable {
  name: string
  value: string
}

export interface FissionContainerEnvironment {
  name: string
  env: Array<FissionEnvironmentVariable>
}
