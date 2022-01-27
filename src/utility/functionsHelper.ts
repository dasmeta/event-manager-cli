import * as fs from 'fs'
import {FunctionItem, FunctionList} from '../interfaces'
import * as path from 'path'

export const getFunction = (functionsPath:string, namespace:string, name:string): FunctionItem => {
  const functionDir:string = path.join(functionsPath.split('/').pop()!, namespace, name)
  const functionPath = path.join(functionsPath, namespace, name)
  const packageData = require(path.join(functionPath, 'package'))

  return {
    ...packageData.gcf,
    functionName: `${namespace}_${name}`,
    version: packageData.version,
    path: functionDir,
    absolutePath: functionPath,
  }
}

export const getFunctions = (functionsPath:string): FunctionList => {
  const functions:FunctionList = []
  const addFunctionItem = (item: FunctionItem) => {
    functions.push(item)
  }

  const namespaces = fs.readdirSync(functionsPath)

  namespaces.forEach((namespace:string) => {
    fs.readdirSync(path.join(functionsPath, namespace)).forEach((name: string) => {
      addFunctionItem(getFunction(functionsPath, namespace, name))
    })
  })

  return functions
}

export const updateProcessEnv = (enfFilePath:string|undefined):void => {
  if (enfFilePath) {
    process.env = {...process.env, ...require(enfFilePath)}
  }
}
