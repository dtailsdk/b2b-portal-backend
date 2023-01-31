import { Server, Model } from '@dtails/toolbox'
import { error } from '@dtails/logger'
import { validateAllWebhooks } from '../../lib/webhook-service'
const { knexSnakeCaseMappers } = require('objection')

Server.init({ withCors: false })
Server.initModel(Model, { debug: false, ...knexSnakeCaseMappers() })

/**
 * Validates webhooks in all shops
 * Webhooks are configured in webhook-service.js
 * Webhooks that are not in the configuration but in Shopify will be deleted from Shopify
 * Webhooks that are in the configuration but not in Shopify will be created in Shopify
 */
validateAllWebhooks().catch(e => {
  error('An error occurred in the task that validates webhooks for all shops', e)
  process.exit(1)
}).then(_ => process.exit(0))