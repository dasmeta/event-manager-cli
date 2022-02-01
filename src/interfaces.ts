interface GcfConfig {

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
  gcf: GcfConfig
  functionName: string
  // Relative path of a function {functions-dir}/{functions-group}/{function}
  path: string
  // Absolut path of a function
  absolutePath: string
  topic: string
  maxAttempts: number
  version: string
  memory: string
  'max-instances': number
  bucket: string
  event: string
  resource: string
}

export type FunctionList = Array<FunctionItem>

//  "functionsConfig" key in package.json of the project
export interface ProjectFunctionConfig {
  dir: string
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
