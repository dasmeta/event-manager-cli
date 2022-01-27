import {Command, Flags} from '@oclif/core'
import * as path from 'path'
import * as fse from 'fs-extra'
import {jsonWriteOptions} from '../../config'
import {validateName} from '../../utility/validator'
import {getProjectPaths} from '../../utility/commandsHelper'

export default class Create extends Command {
  static description = 'Create Function blueprint'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-dir': Flags.string({description: 'Project root directory', required: false, default: process.cwd()}),
    'project-name': Flags.string({description: 'Sub project directory', required: false, default: ''}),
    namespace: Flags.string({description: 'Function namespace', required: true}),
    name: Flags.string({description: 'Function name', required: true}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Create)

    const functionNamespace = flags.namespace
    if (!validateName(functionNamespace)) {
      this.error('--namespace is invalid')
    }

    const functionName = flags.name
    if (!validateName(functionName)) {
      this.error('--name is invalid')
    }

    const {absoluteFunctionsPath, dependencies} = getProjectPaths(flags['project-dir'], flags['project-name'])

    const folderPath = path.join(absoluteFunctionsPath, functionNamespace)
    await fse.ensureDir(folderPath)

    const functionPath = path.join(folderPath, functionName)
    await fse.ensureDir(functionPath)

    // package.json
    const packageJsonPath = path.join(functionPath, 'package.json')
    const packageJsonContent = {
      name: functionName,
      version: '1.0.0',
      main: 'run.js',
      dependencies,
      gcf: {
        topic: 'topic',
      },
    }
    await fse.writeJSON(packageJsonPath, packageJsonContent, jsonWriteOptions)

    // run.js
    const packageRunPath = path.join(functionPath, 'run.js')
    const packageRunContent = `exports.subscribe = require("@tutorbot/gcf-helper")(require("./handler"));

exports.fissionHttpHandler = require("@tutorbot/fission-helper")(require("./handler"));
`
    await fse.writeFile(packageRunPath, packageRunContent)

    // handler.js
    const packageHandlerPath = path.join(functionPath, 'handler.js')
    const packageHandlerContent = `// const { someMethod } = require("@tutorbot/api-client/src/api/SomeApi");

module.exports = async data => {
    console.log('handler input data', data)
    // const {  } = data;

    // do something
    // someMethod();
    // ...
};
`
    await fse.writeFile(packageHandlerPath, packageHandlerContent)

    // test.js
    const packageTestPath = path.join(functionPath, 'test.js')
    const packageTestContent = `const { it, describe } = require("mocha");
const proxyquire = require("proxyquire");
const { stub } = require("simple-mock");
const { strictEqual, deepStrictEqual } = require("assert");

describe("${functionName}", () => {
    it("With Correct data", async () => {
        // Init Data

        // Init Mocks
        const someMethod = stub();
        const requires = {
            "@tutorbot/api-client/src/api/SomeApi": { someMethod },
        };
        // Run
        const handler = proxyquire("./handler", requires);
        await handler(data);

        // Expectations
        strictEqual(someMethod.called, true);
        strictEqual(someMethod.callCount, 1);
        deepStrictEqual(someMethod.lastCall.args, []);
    });
});
`
    await fse.writeFile(packageTestPath, packageTestContent)

    this.log('path', `${absoluteFunctionsPath}/${functionNamespace}/${functionName}`)
    this.log('please run')
    this.log(`git add ${absoluteFunctionsPath}/${functionNamespace}/${functionName}/*`)
  }
}
