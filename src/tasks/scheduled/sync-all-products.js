import { syncAllProducts } from "../../lib/product-service";
import { Server, Model } from '@dtails/toolbox-backend'
import { ShopifyToken } from 'models'

import { error } from '@dtails/logger'

Server.init({ withCors: false })
Server.initModel(Model, { debug: false })


async function run() {
  const stores = await ShopifyToken.q
  let promises = []
  for (let i = 0; i < stores.length; i++) {
    const store = stores[i]
    promises.push(syncAllProducts(store.id))
  }
  await Promise.all(promises)
}

/**
 * Syncs products from Shopify for all stores
 * Iterate all stores and sync for each store
 */
run().catch(e => {
  error('An error occurred in the task that syncs products for all stores', e)
  process.exit(1)
}).then(_ => process.exit(0))