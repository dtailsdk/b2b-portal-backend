
import { Server, Model } from '@dtails/toolbox'
import { error } from '@dtails/logger'
import { validateAllConfigurations } from '../lib/configuration-service'
const { knexSnakeCaseMappers } = require('objection')

Server.init({ withCors: false })
Server.initModel(Model, { debug: false, ...knexSnakeCaseMappers() })

/**
 * Validates all configurations for both installed apps and new configurations for which an app has not been installed yet
 */
validateAllConfigurations().catch(e => {
  error('An error occurred in the task that validates configurations for all shops', e)
  process.exit(1)
}).then(_ => process.exit(0))