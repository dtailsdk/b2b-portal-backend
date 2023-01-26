import { Server } from '@dtails/toolbox'
import * as Sentry from "@sentry/node"
import appsRouter from './apps-controller'
import portalRouter from './portal-controller'
import shopRouter from './shops-controller'
import webhooksRouter from './webhooks-controller'

import { validateAllConfigurations } from '../lib/configuration-service'

export default function init(shopifyOAuth) {
  Server.use('/app/api', appsRouter(shopifyOAuth))
  Server.use('/app/api/shops', shopRouter(shopifyOAuth))
  Server.use('/app/api/webhooks', webhooksRouter(shopifyOAuth))
  
  Server.use('/portal/api', portalRouter())

  try {
    validateAllConfigurations()
  } catch (error) {
    Sentry.captureException(e)
  }
}