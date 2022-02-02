import {Command, Flags} from '@oclif/core'

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

    //@ts-ignore
    const {nonPersistentPublish} = require('@dasmeta/event-manager-node-api')

    await nonPersistentPublish(flags.topic, JSON.parse(flags.event))
  }
}
