import { expose } from 'threads/worker'

import { preprocessItems } from '../utils/table'

expose(preprocessItems)
