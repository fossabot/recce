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
recce/1.8.2 darwin-x64 node-v11.1.0
$ recce --help [COMMAND]
USAGE
  $ recce COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`recce api-extract`](#recce-api-extract)
* [`recce build`](#recce-build)
* [`recce help [COMMAND]`](#recce-help-command)

## `recce api-extract`

Extract API from declaration files

```
USAGE
  $ recce api-extract

OPTIONS
  -e, --entry=entry      (required) d.ts entry point
  -h, --help             show CLI help
  -o, --output=output    [default: api.json] output json file path
  -p, --project=project  path to 'tsconfig.json', or to a folder with it

EXAMPLE
  $ recce api-extract -p [directory] -e lib/hello.d.ts
```

_See code: [lib/commands/api-extract.js](https://github.com/escapace/recce/blob/v1.8.2/lib/commands/api-extract.js)_

## `recce build`

build TypeScript library

```
USAGE
  $ recce build

OPTIONS
  -e, --entry=entry         project entry point
  -h, --help                show CLI help
  -m, --module=cjs|umd|esm  module code generation (esm is always enabled)
  -o, --output=output       [default: lib] output directory path
  -p, --project=project     path to 'tsconfig.json', or to a folder with it
  --[no-]clean              [default: true] clean output directory
  --machine-readable        enables JSON output mode
  --[no-]minimize           [default: true] minimize javascript
  --stats=stats             write JSON file(s) with compilation statistics

EXAMPLES
  $ recce build -p [directory] -m esm -e src/hello.ts
  $ recce build -p [directory] -m cjs -e src/hello.ts -e src/world.ts
  $ recce build -m cjs -m umd -m esm -e src/hello.ts -e src/world.ts
  $ recce build --no-clean --no-minimize -m umd -e src/hello.ts
```

_See code: [lib/commands/build.js](https://github.com/escapace/recce/blob/v1.8.2/lib/commands/build.js)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.4/src/commands/help.ts)_
<!-- commandsstop -->
