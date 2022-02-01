event-manager-cli
=================

CLI to deal with resources under event-manager namespace.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @dasmeta/event-manager-cli
$ emc COMMAND
running command...
$ emc (--version)
@dasmeta/event-manager-cli/1.0.3 linux-x64 node-v12.22.5
$ emc --help [COMMAND]
USAGE
  $ emc COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`emc autocomplete [SHELL]`](#emc-autocomplete-shell)
* [`emc config init`](#emc-config-init)
* [`emc dev run function`](#emc-dev-run-function)
* [`emc dev run topic`](#emc-dev-run-topic)
* [`emc dev start`](#emc-dev-start)
* [`emc function create`](#emc-function-create)
* [`emc function package generate NAME`](#emc-function-package-generate-name)
* [`emc function sync-dependencies`](#emc-function-sync-dependencies)
* [`emc function sync-version`](#emc-function-sync-version)
* [`emc function validate`](#emc-function-validate)
* [`emc help [COMMAND]`](#emc-help-command)
* [`emc platform generate-deploy`](#emc-platform-generate-deploy)
* [`emc plugins`](#emc-plugins)
* [`emc plugins:inspect PLUGIN...`](#emc-pluginsinspect-plugin)
* [`emc plugins:install PLUGIN...`](#emc-pluginsinstall-plugin)
* [`emc plugins:link PLUGIN`](#emc-pluginslink-plugin)
* [`emc plugins:uninstall PLUGIN...`](#emc-pluginsuninstall-plugin)
* [`emc plugins update`](#emc-plugins-update)

## `emc autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ emc autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  display autocomplete installation instructions

EXAMPLES
  $ emc autocomplete

  $ emc autocomplete bash

  $ emc autocomplete zsh

  $ emc autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v1.1.1/src/commands/autocomplete/index.ts)_

## `emc config init`

Initializes configurations.

```
USAGE
  $ emc config init [-f]

FLAGS
  -f, --force  restore all default configs

DESCRIPTION
  Initializes configurations.

EXAMPLES
  $ emc config init
```

## `emc dev run function`

Run function in local environment

```
USAGE
  $ emc dev run function --function-namespace <value> --function-name <value> --test-data-file <value> [--project-dir
    <value>] [--project-name <value>] [--env-file <value>]

FLAGS
  --env-file=<value>            Environment variables file with JSON format
  --function-name=<value>       (required) Function name
  --function-namespace=<value>  (required) Function namespace
  --project-dir=<value>         [default: /home/gmargaryan/Development/event-manager-cli] Project root directory
  --project-name=<value>        Sub project directory
  --test-data-file=<value>      (required) Test data file

DESCRIPTION
  Run function in local environment

EXAMPLES
  $ emc dev run function
```

## `emc dev run topic`

Run topic in local environment

```
USAGE
  $ emc dev run topic --test-data-file <value> -t <value> [--project-dir <value>] [--project-name <value>]
    [--env-file <value>]

FLAGS
  -t, --topic=<value>       (required) Topic to run
  --env-file=<value>        Environment variables file with JSON format
  --project-dir=<value>     [default: /home/gmargaryan/Development/event-manager-cli] Project root directory
  --project-name=<value>    Sub project directory
  --test-data-file=<value>  (required) Test data file

DESCRIPTION
  Run topic in local environment

EXAMPLES
  $ emc dev run topic
```

## `emc dev start`

Starts consumers in local environment

```
USAGE
  $ emc dev start [--project-dir <value>] [--project-name <value>] [-t <value>] [-T <value>] [-s <value>] [-S
    <value>] [--default-max-attempt <value>] [--env-file <value>] [--force]

FLAGS
  -S, --excluded-subscription=<value>...  [default: ] Subscription to exclude consuming
  -T, --excluded-topic=<value>...         [default: ] Topics to exclude consuming
  -s, --subscription=<value>...           [default: ] Subscription to consume
  -t, --topic=<value>...                  [default: ] Topics to consume
  --default-max-attempt=<value>           [default: 3] Default function execution attempts count
  --env-file=<value>                      Environment variables file with JSON format
  --force                                 Ignore issues and run anyway
  --project-dir=<value>                   [default: /home/gmargaryan/Development/event-manager-cli] Project root
                                          directory
  --project-name=<value>                  Sub project directory

DESCRIPTION
  Starts consumers in local environment

EXAMPLES
  $ emc dev start
```

## `emc function create`

Create Function blueprint

```
USAGE
  $ emc function create --namespace <value> --name <value> [--project-dir <value>] [--project-name <value>]

FLAGS
  --name=<value>          (required) Function name
  --namespace=<value>     (required) Function namespace
  --project-dir=<value>   [default: /home/gmargaryan/Development/event-manager-cli] Project root directory
  --project-name=<value>  Sub project directory

DESCRIPTION
  Create Function blueprint

EXAMPLES
  $ emc function create
```

## `emc function package generate NAME`

Create Function project

```
USAGE
  $ emc function package generate [NAME] [--project-dir <value>] [--functions-dir <value>]

ARGUMENTS
  NAME  Project name

FLAGS
  --functions-dir=<value>  [default: functions] Functions root directory
  --project-dir=<value>    [default: /home/gmargaryan/Development/event-manager-cli] Project root directory

DESCRIPTION
  Create Function project

EXAMPLES
  $ emc function package generate
```

## `emc function sync-dependencies`

Syncs all detected functions dependencies to match to project one.

```
USAGE
  $ emc function sync-dependencies [--project-dir <value>] [--project-name <value>]

FLAGS
  --project-dir=<value>   [default: /home/gmargaryan/Development/event-manager-cli] Project root directory
  --project-name=<value>  Sub project directory

DESCRIPTION
  Syncs all detected functions dependencies to match to project one.

EXAMPLES
  $ emc function sync-dependencies
```

## `emc function sync-version`

Syncs all detected changed functions versions.

```
USAGE
  $ emc function sync-version [--project-dir <value>] [--project-name <value>]

FLAGS
  --project-dir=<value>   [default: /home/gmargaryan/Development/event-manager-cli] Project root directory
  --project-name=<value>  Sub project directory

DESCRIPTION
  Syncs all detected changed functions versions.

EXAMPLES
  $ emc function sync-version
```

## `emc function validate`

Validates functions in the project

```
USAGE
  $ emc function validate [--project-dir <value>] [--project-name <value>]

FLAGS
  --project-dir=<value>   [default: /home/gmargaryan/Development/event-manager-cli] Project root directory
  --project-name=<value>  Sub project directory

DESCRIPTION
  Validates functions in the project

EXAMPLES
  $ emc function validate
```

## `emc help [COMMAND]`

Display help for emc.

```
USAGE
  $ emc help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for emc.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.10/src/commands/help.ts)_

## `emc platform generate-deploy`

Generates deployment files.

```
USAGE
  $ emc platform generate-deploy [--project-dir <value>] [--project-name <value>] [--is-GCF --functions-list-file <value>]
    [--is-fission --kafka-bootstrap-server <value>] [-t <value>]

FLAGS
  -t, --topic=<value>...            [default: ] Topics to deploy functions for
  --functions-list-file=<value>     GCF deployed functions list
  --is-GCF                          Use GCF instructions
  --is-fission                      Use fission instructions
  --kafka-bootstrap-server=<value>  Kafka server for Fission MQT
  --project-dir=<value>             [default: /home/gmargaryan/Development/event-manager-cli] Project root directory
  --project-name=<value>            Sub project directory

DESCRIPTION
  Generates deployment files.

EXAMPLES
  $ emc platform generate-deploy
```

## `emc plugins`

List installed plugins.

```
USAGE
  $ emc plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ emc plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.0.12/src/commands/plugins/index.ts)_

## `emc plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ emc plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ emc plugins:inspect myplugin
```

## `emc plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ emc plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ emc plugins add

EXAMPLES
  $ emc plugins:install myplugin 

  $ emc plugins:install https://github.com/someuser/someplugin

  $ emc plugins:install someuser/someplugin
```

## `emc plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ emc plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLES
  $ emc plugins:link myplugin
```

## `emc plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ emc plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ emc plugins unlink
  $ emc plugins remove
```

## `emc plugins update`

Update installed plugins.

```
USAGE
  $ emc plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
