import * as chalk from 'chalk'
import * as path from 'path'
import {ProjectFunctionConfig, ProjectMetadata} from '../interfaces'
import {defaultFunctionsDir} from '../config'

export const getProjectPaths = (projectPath: string, projectName: string): ProjectMetadata => {
  const absoluteBasePath = path.join(projectPath, projectName)

  let functionsConfig: ProjectFunctionConfig; let dependencies: any
  try {
    ({dependencies, functionsConfig} = require(path.join(absoluteBasePath, 'package')))
  } catch {
    throw new Error(chalk.red(`"${absoluteBasePath}" is not a valid function project`))
  }

  const absoluteFunctionsPath = path.join(absoluteBasePath, functionsConfig.dir || defaultFunctionsDir)

  return {
    absoluteBasePath,
    absoluteFunctionsPath,
    dependencies,
    functionsConfig,
  }
}
