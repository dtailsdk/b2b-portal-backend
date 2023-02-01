import { Server } from '@dtails/toolbox-backend'
import * as Sentry from "@sentry/node"

import appsRouter from './apps'
import portalRouter from './portal'
import shopRouter from './shops'
import webhooksRouter from './webhooks'

import { validateAllConfigurations } from '../lib/configuration-service'

export default function init(shopifyOAuth) {
  Server.use('/app/api', appsRouter(shopifyOAuth))
  Server.use('/app/api/shops', shopRouter(shopifyOAuth))
  Server.use('/app/api/webhooks', webhooksRouter())
  
  Server.use('/portal/api', portalRouter())

  /*
  try {
    validateAllConfigurations()
  } catch (error) {
    Sentry.captureException(e)
  }
  */
}