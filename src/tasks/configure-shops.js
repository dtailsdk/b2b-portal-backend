import { Server, Model } from '@dtails/toolbox-backend'
import { error } from '@dtails/logger'
import { createDefinedMetafieldsForShops } from '../lib/metafield-service'

Server.init({ withCors: false })
Server.initModel(Model, { debug: false })

/**
 * This job can be run whenever the B2B portal configuration has been set or updated for a shop
 * The job will make the necessary changes in the related Shopify shops c.f. the B2B portal configuration of the shop, e.g. create defined metafields etc.
 */
createDefinedMetafieldsForShops().catch(e => {
  error('An error occurred in the task that created the defined metafields in the Shopify shops c.f. the B2B portal configuration', e)
  process.exit(1)
}).then(_ => process.exit(0))