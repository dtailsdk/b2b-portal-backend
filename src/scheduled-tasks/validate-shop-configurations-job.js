import { Server, Model } from '@mekanisme/server'
import { error } from '@dtails/logger'
import { validateAllConfigurations } from '../lib/configuration-service'

Server.init({ withCors: false })
Server.initModel(Model, { debug: false })

validateAllConfigurations().catch(e => {
  error('An error occurred in the task that validates configurations for all shops', e)
  process.exit(1)
}).then(_ => process.exit(0))