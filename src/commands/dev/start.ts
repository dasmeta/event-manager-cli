import {Command, Flags} from '@oclif/core'
import * as chalk from 'chalk'
import * as path from 'path'
import {getFunctions, updateProcessEnv} from '../../utility/functionsHelper'
import {getProjectPaths} from '../../utility/commandsHelper'

export default class Start extends Command {
  static description = 'Starts consumers in local environment'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-dir': Flags.string({description: 'Project root directory', required: true}),
    'project-name': Flags.string({description: 'Sub project directory', required: false, default: ''}),
    topic: Flags.string({char: 't', description: 'Topics to consume', multiple: true, default: []}),
    'excluded-topic': Flags.string({char: 'T', description: 'Topics to exclude consuming', multiple: true, default: []}),
    subscription: Flags.string({char: 's', description: 'Subscription to consume', multiple: true, default: []}),
    'excluded-subscription': Flags.string({char: 'S', description: 'Subscription to exclude consuming', multiple: true, default: []}),
    'default-max-attempt': Flags.integer({description: 'Default function execution attempts count', default: 3}),
    'env-file': Flags.string({description: 'Environment variables file with JSON format'}),
    force: Flags.boolean({description: 'Ignore issues and run anyway'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Start)

    // requires @tutorbot/microservice upgrade and ts types declaration
    if (!flags.force) {
      this.error(chalk.red('Command is not implemented.'))
    }

    // dummy subscriber
    // @todo import function from @dasmeta/event-manager-node-api former @tutorbot/microservice
    const registerSubscriber = (
      topic: string,
      functionName: string,
      handler: Function,
      maxAttempt: number,
    ) => {
      console.log({topic, functionName, maxAttempt, handler})
    }

    const {absoluteFunctionsPath} = getProjectPaths(flags['project-dir'], flags['project-name'])

    updateProcessEnv(flags['env-file'])

    for (const item of getFunctions(absoluteFunctionsPath)) {
      const handler = require(path.join(item.absolutePath, 'handler'))

      if (
        !item.topic ||
        (flags.topic.length > 0 && !flags.topic.includes(item.topic)) ||
        flags['excluded-topic'].includes(item.topic) ||
        (flags.subscription.length > 0 && !flags.subscription.includes(item.functionName)) ||
        flags['excluded-subscription'].includes(item.functionName)
      ) {
        continue
      }

      let handlerIndex: Function = handler
      if (!(handler instanceof Function)) {
        handlerIndex = handler.handler
      }

      registerSubscriber(
        item.topic,
        item.functionName,
        handlerIndex,
        item.maxAttempts || flags['default-max-attempt'],
      )
    }
  }
}
