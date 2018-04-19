recce
=====

<!-- toc -->
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
* [recce build](#recce-build)
* [recce help [COMMAND]](#recce-help-command)

## recce build

describe the command here

```
USAGE
  $ recce build

OPTIONS
  -c, --context=context     the root directory for resolving entry point
  -e, --entry=entry         library entrypoint
  -h, --help                show CLI help
  -o, --output=output       [default: lib] directory to place build files into
  -q, --quiet               prevent output from being displayed in stdout
  -t, --target=cjs|umd|esm  the type for exposing the exports of the entry
  -v, --verbose             show more details
  --clean                   remove ouput path before build
  --minimize                minimize javascript

EXAMPLE
  $ recce hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/build.ts](https://github.com/escapace/recce/blob/v0.0.2/src/commands/build.ts)_

## recce help [COMMAND]

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
