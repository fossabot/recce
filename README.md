# Recce

[![build status](https://travis-ci.org/escapace/recce.svg?branch=master)](https://travis-ci.org/escapace/recce)
[![code coverage](https://codecov.io/gh/escapace/recce/branch/master/graph/badge.svg)](https://codecov.io/gh/escapace/recce)
[![license](https://img.shields.io/badge/license-Mozilla%20Public%20License%20Version%202.0-blue.svg)]()

<!-- toc -->
* [Recce](#recce)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g recce
$ recce COMMAND
running command...
$ recce (-v|--version|version)
recce/0.0.2 linux-x64 node-v9.5.0
$ recce --help [COMMAND]
USAGE
  $ recce COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`recce build`](#recce-build)
* [`recce help [COMMAND]`](#recce-help-command)

## `recce build`

TypeScript library build tool

```
USAGE
  $ recce build

OPTIONS
  -c, --context=context     project directory
  -e, --entry=entry         project entry point
  -h, --help                show CLI help
  -o, --output=output       [default: lib] output directory path
  -q, --quiet               don't output anything
  -t, --target=cjs|umd|esm  types of module systems
  --clean                   [default: true] clean output directory
  --minimize                [default: true] minimize javascript

EXAMPLES
  $ recce build -c [directory] -t esm -e src/hello.ts

  $ recce build -c [directory] -t cjs -e src/hello.ts -e src/world.ts

  $ recce build -t cjs -t umd -t esm -e src/hello.ts -e src/world.ts

  $ recce build --no-clean -no-minimize -t umd -e src/hello.ts
```

_See code: [src/commands/build.ts](https://github.com/escapace/recce/blob/v0.0.2/src/commands/build.ts)_

## `recce help [COMMAND]`

display help for recce

```
USAGE
  $ recce help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v1.2.4/src/commands/help.ts)_
<!-- commandsstop -->
