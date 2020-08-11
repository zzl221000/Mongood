import { expose } from 'threads/worker'

import { stringify } from '../utils/ejson'

expose(stringify)
