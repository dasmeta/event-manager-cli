import {Command, Flags} from '@oclif/core'
import {getProjectPaths} from '../../utility/commandsHelper'
import {getFunctions} from "../../utility/functionsHelper";
import * as chalk from "chalk";

export default class ListTopics extends Command {
  static description = 'Lists topics'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    'project-dir': Flags.string({description: 'Project root directory', required: true}),
    'project-name': Flags.string({description: 'Sub project directory', required: false, default: ''}),
    'dump': Flags.boolean({description:'Dump as command option'})
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(ListTopics)

    const {absoluteFunctionsPath} = getProjectPaths(flags['project-dir'], flags['project-name'])

    const topics = new Set()
    getFunctions(absoluteFunctionsPath).forEach(item => {
      item.config.topic && topics.add(item.config.topic)
    })

    this.log(chalk.green('Topics:'))
    if (flags.dump) {
      this.log('-t ' + [...topics].join(" -t "))
    } else {
      this.log('\t' + [...topics].join('\n\t'))
    }
  }
}
