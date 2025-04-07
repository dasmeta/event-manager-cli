import {Command, Flags} from '@oclif/core'
import * as path from 'path'
import {getFunctions, updateProcessEnv} from '../../utility/functionsHelper'
import {getProjectPaths} from '../../utility/commandsHelper'
import { EventSubscriptionApi } from '@dasmeta/event-manager-node-api'
//@ts-ignore
const {queue} = require('@dasmeta/event-manager-utils')


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

    const {absoluteFunctionsPath} = getProjectPaths(flags['project-dir'], flags['project-name'])

    updateProcessEnv(flags['env-file'])

    for (const item of getFunctions(absoluteFunctionsPath)) {
      const handler = require(path.join(item.absolutePath, 'handler'))

      if (
        !item.config.topic ||
        (flags.topic.length > 0 && !flags.topic.includes(item.config.topic)) ||
        flags['excluded-topic'].includes(item.config.topic) ||
        (flags.subscription.length > 0 && !flags.subscription.includes(item.functionName)) ||
        flags['excluded-subscription'].includes(item.functionName)
      ) {
        continue
      }

      let handlerIndex: Function = handler
      if (!(handler instanceof Function)) {
        handlerIndex = handler.handler
      }

      const api = new EventSubscriptionApi({ basePath: process.env.EVENT_MANAGER_BACKEND_URL })

      queue.registerSubscriber(
        item.config.topic,
        item.functionName,
        handlerIndex,
        item.config.maxAttempts || flags['default-max-attempt'],
        async (data: any) => api.eventSubscriptionsRecordStartPost(data), 
        async (data: any) => api.eventSubscriptionsRecordSuccessPost(data), 
        async (data: any) => api.eventSubscriptionsRecordFailurePost({...data, error: { stack: data.error.stack, message: data.error.message }}), 
        async (data: any) => api.eventSubscriptionsRecordPreconditionFailurePost(data), 
        async ({ topic, subscription, eventId, maxAttempts }: any) => 
          (await api.eventSubscriptionsHasReachedMaxAttemptsGet(topic, subscription, eventId, maxAttempts)).data.result
      )
    }
  }
}
