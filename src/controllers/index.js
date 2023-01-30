import { Server } from '@dtails/toolbox'
import * as Sentry from "@sentry/node"
import jwt from 'jsonwebtoken'

import appsRouter from './apps-controller'
import portalRouter from './portal-controller'
import shopRouter from './shops-controller'
import webhooksRouter from './webhooks-controller'
import frontendRouter from './frontend-controller'
import { getEnvironment } from '@dtails/toolbox/lib'

import { validateAllConfigurations } from '../lib/configuration-service'

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  const signingKey = getEnvironment('SIGN_KEY')

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, signingKey, async (err, payload) => {
    if (err) return res.sendStatus(403)
    next()
  })
}

export default function init(shopifyOAuth) {
  Server.use('/app/api', appsRouter(shopifyOAuth))
  Server.use('/app/api/shops', shopRouter(shopifyOAuth))
  Server.use('/app/api/webhooks', webhooksRouter())
  
  Server.use('/portal/api', authenticateToken, portalRouter())
  Server.use('/app/frontend', frontendRouter())

  try {
    validateAllConfigurations()
  } catch (error) {
    Sentry.captureException(e)
  }
}