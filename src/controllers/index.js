import { Server } from '@mekanisme/server'

import appsRouter from './apps-controller'
import portalRouter from './portal-controller'
import shopRouter from './shops-controller'
import webhooksRouter from './webhooks-controller'

import { validateAllConfigurations } from '../lib/configuration-service'

export default function init(shopifyOAuth) {
  Server.use('/app', appsRouter(shopifyOAuth))
  Server.use('/app/shops', shopRouter(shopifyOAuth))
  Server.use('/app/webhooks', webhooksRouter(shopifyOAuth))
  Server.use('/portal', portalRouter())

  validateAllConfigurations()
}