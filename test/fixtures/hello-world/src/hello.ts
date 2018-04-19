import { capitalize } from 'lodash'
import { bang } from './bang'

exxport const hello = (name: string) => `Hello ${capitalize(name)}${bang}`
