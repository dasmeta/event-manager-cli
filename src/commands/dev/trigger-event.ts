import {Command, Flags} from '@oclif/core'
import { EventApi } from '@dasmeta/event-manager-node-api'

export default class TriggerEvent extends Command {
  static description = 'Publishes Event.'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'kafka-bootstrap-server': Flags.string({description: 'Kafka server for Fission MQT', required:true}),
    topic: Flags.string({char: 't', description: 'Topic to run', required: true}),
    event: Flags.string({char: 'e', description: 'Topic body', required: true}),
    debug: Flags.boolean({description: 'Activate debug mode.'})
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(TriggerEvent)

    process.env.DEV_SKIP_PUBLISH=''
    if (flags.debug) {
      process.env.PUBLISH_DEBUG_MODE='1'
    }
    process.env.MQ_CLIENT_NAME='Kafka'
    process.env.KAFKA_BROKERS=flags["kafka-bootstrap-server"]

    const api = new EventApi({ basePath: process.env.EVENT_MANAGER_BACKEND_URL })
    await api.eventsNonPersistentPublishPost({
      topic: flags.topic,
      data: JSON.parse(flags.event)
    })
  }
}
