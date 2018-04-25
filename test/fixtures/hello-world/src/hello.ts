import { capitalize } from 'lodash'
import { bang } from './bang'

export const hello = (name: string) => `Hello ${capitalize(name)}${bang}`
