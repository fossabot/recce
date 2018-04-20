const path = require('path')
process.env.TS_NODE_PROJECT = path.resolve('test/tsconfig.json')
// process.env.TEST_OUTPUT = 1

require('@oclif/errors').config.errorLogger = { flush: () => {} }
