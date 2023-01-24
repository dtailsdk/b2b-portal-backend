import { Server } from '@dtails/toolbox'

import appsRouter from './apps-controller'
import shopRouter from './shops-controller'
import webhooksRouter from './webhooks-controller'

import { validateAllWebhooks } from '../lib/webhook-service'

export default function init(shopifyOAuth) {
  Server.use('/app', appsRouter(shopifyOAuth))
  Server.use('/app/shops', shopRouter(shopifyOAuth))
  Server.use('/app/webhooks', webhooksRouter(shopifyOAuth))

  validateAllWebhooks()
}