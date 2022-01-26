interface GcfConfig {

}

export interface FunctionItem {
  gcf: GcfConfig
  functionName: string
  // Relative path of a function {functions-dir}/{functions-group}/{function}
  path: string
  // Absolut path of a function
  absolutePath: string
  topic: string
  maxAttempts: number
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
