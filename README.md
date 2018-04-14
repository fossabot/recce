recce
=====

[![Version](https://img.shields.io/npm/v/recce.svg)](https://npmjs.org/package/recce)
[![CircleCI](https://circleci.com/gh/escapace/recce/tree/master.svg?style=shield)](https://circleci.com/gh/escapace/recce/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/escapace/recce?branch=master&svg=true)](https://ci.appveyor.com/project/escapace/recce/branch/master)
[![Codecov](https://codecov.io/gh/escapace/recce/branch/master/graph/badge.svg)](https://codecov.io/gh/escapace/recce)
[![License](https://img.shields.io/npm/l/recce.svg)](https://github.com/escapace/recce/blob/master/package.json)
[![Build Status](https://travis-ci.org/escapace/recce.svg?branch=master)](https://travis-ci.org/escapace/recce)

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
* [recce hello [FILE]](#recce-hello-file)
* [recce help [COMMAND]](#recce-help-command)

## recce hello [FILE]

describe the command here

```
USAGE
  $ recce hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ recce hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/escapace/recce/blob/v0.0.2/src/commands/hello.ts)_

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
