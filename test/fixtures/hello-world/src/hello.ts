import { capitalize } from 'lodash'
import { bang } from './bang'

xport const hello = (name: string) => `Hello ${capitalize(name)}${bang}`
