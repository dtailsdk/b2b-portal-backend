import { Server } from '@mekanisme/server'

import appsRouter from './apps-controller'
import shopRouter from './shops'
import webhooksRouter from './webhooks'

import { validateAllWebhooks } from '../lib/webhooks'

export default function init(shopifyOAuth) {
  Server.use('/app', appsRouter(shopifyOAuth))
  Server.use('/app/shops', shopRouter(shopifyOAuth))
  Server.use('/app/webhooks', webhooksRouter(shopifyOAuth))

  validateAllWebhooks()
}