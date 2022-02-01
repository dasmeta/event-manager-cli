import {Command, Flags} from '@oclif/core'
import * as fse from 'fs-extra'
import * as path from 'path'
import * as chalk from 'chalk'
import { v4 as uuid } from 'uuid'
import {defaultFunctionsDir, jsonWriteOptions} from '../../../config'

export default class Generate extends Command {
  static description = 'Create Function project'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-dir': Flags.string({description: 'Project root directory', required: false, default: process.cwd()}),
    'functions-dir': Flags.string({description: 'Functions root directory', required: false, default: defaultFunctionsDir}),
  }

  static args = [
    {name: 'name', description: 'Project name', required: true},
  ]

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Generate)

    const getProjectChildPath = (relativePath:string) => {
      return path.join(flags['project-dir'], args.name, relativePath)
    }

    // Creates project file structure
    await fse.ensureDir(getProjectChildPath(flags['functions-dir']))

    // Adds project configs
    const prettierrc = {
      useTabs: false,
      printWidth: 120,
      tabWidth: 4,
      singleQuote: false,
      trailingComma: 'es5',
      jsxBracketSameLine: false,
      parser: 'babylon',
    }
    await fse.writeJSON(getProjectChildPath('.prettierrc'), prettierrc, jsonWriteOptions)

    const gitignore = `# IDE
.idea/
.vscode/

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

*.lock

# Dependency directories
node_modules/

# Test
.nyc*

# DEPLOY
deploy.sh
list.json
specs

.DS_Store`
    await fse.writeFile(getProjectChildPath('.gitignore'), gitignore)

    const packageJson = {
      name: args.name,
      version: '0.0.0',
      license: 'MIT',
      scripts: {
        function: 'emc function create --project-dir=$(pwd)',
        dev: "PUBSUB_EMULATOR_HOST='localhost:8085' PUBSUB_PROJECT_ID='my-project-id' GCLOUD_PROJECT='my-project-id' emc dev start --project-dir=$(pwd)",
        'dev:check': 'emc function validate --project-dir=$(pwd)',
        'dev:upgrade': 'emc function sync-dependencies --project-dir=$(pwd)',
        'dev:version': 'emc function sync-version --project-dir=$(pwd)',
        'gen:deploy-gcf': 'emc platform generate-deploy --project-dir=$(pwd) --is-GCF --functions-list-file=$(pwd)/list.json',
        'gen:deploy-fission': 'emc platform generate-deploy --project-dir=$(pwd) --is-fission',
        prettier: "prettier --write '**/*.js'",
        test: "NODE_ENV=test yarn nyc mocha './functions/**/*test.js'",
        postinstall: "echo '#!/bin/sh\\\\n\\\\nyarn dev:upgrade && yarn dev:version\\\\n\\\\nx=$?\\\\nexit $x\\\\n' > .git/hooks/pre-commit && chmod 0755 .git/hooks/pre-commit",
        'run-function': 'emc help dev run function --project-dir=$(pwd) --env-file=$(pwd)/src/env.json --test-data-file=$(pwd)/src/test-data.json',
        'run-topic': 'emc help dev run topic --project-dir=$(pwd) --env-file=$(pwd)/src/env.json --test-data-file=$(pwd)/src/test-data.json',
      },
      dependencies: {
        '@dasmeta/event-manager-platform-helper': '^1.0.1',
        '@tutorbot/api-client': '^2.0.94',
        '@tutorbot/course-finder-api-client': '^1.1.2',
      },
      devDependencies: {
        '@google-cloud/storage': '^2.5.0',
        'dotenv-yaml': '^0.1.4',
        eslint: '^5.16.0',
        'eslint-config-airbnb-base': '^13.1.0',
        'eslint-plugin-import': '^2.17.2',
        'fetch-mock': '^9.0.0-beta.2',
        'isomorphic-fetch': '^2.2.1',
        lodash: '^4.17.11',
        mocha: '^6.1.4',
        moment: '^2.24.0',
        'moment-timezone': '^0.5.25',
        'node-fetch': '^2.6.0',
        nyc: '^14.1.0',
        prettier: '^1.18.2',
        proxyquire: '^2.1.1',
        semver: '^6.3.0',
        sharp: '^0.22.1',
        'simple-mock': '^0.8.0',
        yaml: '^1.10.2',
      },
      nyc: {
        include: [
          'functions/*/*/handler.js',
          'functions/*/*/*.js',
        ],
        exclude: [
          '.circleci/*',
          'node_modules/*',
          'src/*',
          'functions/*/*/run.js',
          'functions/*/*/test.js',
          'functions/*/*/*Test.js',
        ],
      },
      functionsConfig: {
        dir: flags['functions-dir'],
        deploymentUid: uuid()
      },
    }
    await fse.writeJSON(getProjectChildPath('package.json'), packageJson, jsonWriteOptions)

    const testData = {
      topic: {
        key: 'topic event key',
      },
      event_1_happened: {
        key: 'value',
      },
    }
    await fse.writeJSON(getProjectChildPath('test-data.json'), packageJson, jsonWriteOptions)
    this.log(chalk.green(`Successfully created Project at ${getProjectChildPath('')}`))
  }
}
