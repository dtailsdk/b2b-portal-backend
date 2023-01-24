import { Server, Model } from '@dtails/toolbox'
import { error } from '@dtails/logger'
import { updateConfigurationsInShops } from '../lib/shop-service'

Server.init({ withCors: false })
Server.initModel(Model, { debug: false })

updateConfigurationsInShops().catch(e => {
  error('An error occurred in the task that updates the configurations in the Shopify shops', e)
  process.exit(1)
}).then(_ => process.exit(0))