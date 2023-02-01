import { Server, Model } from '@dtails/toolbox-backend'
import { error } from '@dtails/logger'
import { updateConfigurationsInShops } from '../lib/metafield-service'

Server.init({ withCors: false })
Server.initModel(Model, { debug: false })

/**
 * Updates the shop metafield with the entire B2B portal configuration
 */
updateConfigurationsInShops().catch(e => {
  error('An error occurred in the task that updates the configurations in the Shopify shops', e)
  process.exit(1)
}).then(_ => process.exit(0))