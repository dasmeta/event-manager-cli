import {Command, Flags} from '@oclif/core'
import * as chalk from 'chalk'
import { EventStatsApi } from '@dasmeta/event-manager-node-api'
import { getFunctions } from "../../utility/functionsHelper"
import { getProjectPaths } from "../../utility/commandsHelper"

export default class UpdateStats extends Command {
  static description = 'Update events list in backend'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-dir': Flags.string({description: 'Project root directory', required: true}),
    'project-name': Flags.string({description: 'Sub project directory', required: false, default: ''}),
    'topic': Flags.string({description: 'Topics to deploy functions for', char: 't', multiple: true, default: []}),
    'excluded-topic': Flags.string({char: 'T', description: 'Topics to exclude', multiple: true, default: []}),
    'subscription': Flags.string({description: 'Functions to deploy', char: 's', multiple: true, default: []}),
    'excluded-subscription': Flags.string({char: 'S', description: 'Subscription to exclude', multiple: true, default: []}),
    'event-manager-backend-host': Flags.string({description: 'Event manager backend host', required: true}),
    'headers': Flags.string({description: 'Headers to send for update (JSON string)', required: false, default: "{}"})
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UpdateStats)

    const api = new EventStatsApi({ basePath: flags['event-manager-backend-host'], baseOptions: { headers: JSON.parse(flags['headers']) } })

    const { absoluteFunctionsPath } = getProjectPaths(flags['project-dir'], flags['project-name'])

    const getFilteredFunctions = () => {
      let functions = getFunctions(absoluteFunctionsPath)

      if (0 === flags.topic.length && 0 === flags.subscription.length &&
          0 === flags['excluded-topic'].length && 0 === flags['excluded-subscription'].length) {
        return functions
      }

      if(0 !== flags['excluded-topic'].length) {
        functions = functions.filter((item) => {
          return item.topic && !flags['excluded-topic'].includes(item.topic);
        })
      }

      if(0 !== flags['excluded-subscription'].length) {
        functions = functions.filter((item) => {
          return item.functionName && !flags['excluded-subscription'].includes(item.functionName);
        })
      }

      if(0 !== flags.topic.length) {
        functions = functions.filter((item) => {
          return item.topic && flags.topic.includes(item.topic)
        })
      }

      if(0 !== flags.subscription.length) {
        functions = functions.filter((item) => {
          return item.functionName && flags.subscription.includes(item.functionName)
        })
      }

      return functions;
    }

    const list = getFilteredFunctions()
    const response = await api.eventStatsGet(Number.MAX_SAFE_INTEGER);

    const data = response.data as Array<any>

    let total = 0;
    let created = 0;
    
    for(const functionItem of list) {
        if(!functionItem.topic) {
          continue
        }
        const found = data.find(item => item.topic === functionItem.topic && item.subscription === functionItem.functionName)
        if(found) {
          this.log(chalk.gray(`topic: ${functionItem.topic}, subscription: ${functionItem.functionName} already exists`))
        } else {
          await api.eventStatsPost({
            topic: functionItem.topic,
            subscription: functionItem.functionName,
            error: 0,
            fail: 0,
            missing: 0,
            success: 0,
            preconditionFail: 0,
            subscriptionCount: 0,
            topicCount: 0,
            total: 0
          });
          created++;
          this.log(chalk.green(`topic: ${functionItem.topic}, subscription: ${functionItem.functionName} created`))
        }
        total++;
    }
    this.log(chalk.green(`Done. Total: ${total} Created: ${created}`))
  }
}
