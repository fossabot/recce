import { capitalize } from 'lodash'
import { bang } from './bang'

export const world = (greeting: string) => `${capitalize(greeting)} World${bang}`
