import { Server } from '@mekanisme/server'

import b2bPortalRouter from './b2b-portal-controller'
import appsRouter from './apps-controller'
import shopRouter from './shops-controller'
import webhooksRouter from './webhooks-controller'

import { validateAllWebhooks } from '../lib/webhook-service'

export default function init(shopifyOAuth) {
  Server.use('/b2b-portal', b2bPortalRouter(shopifyOAuth))
  Server.use('/app', appsRouter(shopifyOAuth))
  Server.use('/app/shops', shopRouter(shopifyOAuth))
  Server.use('/app/webhooks', webhooksRouter(shopifyOAuth))

  validateAllWebhooks()
}