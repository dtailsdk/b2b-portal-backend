import { Server } from '@dtails/toolbox-backend'
import { log } from '@dtails/logger'
import { ShopifyToken } from 'models'

async function getApp(req, res) {
  if (!req.query.shop || !req.query.app) {
    throw Error('Invalid parameters')
  }
  log(`Redirect from confirm step of OAuth flow for shop ${req.query.shop}`)
  const shop = await ShopifyToken.query().withGraphJoined('app').findOne({ shop: req.query.shop, identifier: req.query.app, uninstalledAt: null })
  if (!shop) {
    throw Error('Invalid parameters')
  }
  res.redirect(302, 'https://' + shop.shop + '.myshopify.com/admin/apps/' + shop.app.shopifyAppHandle + '?app=' + shop.app.identifier)
}

async function ping(req, res) {
  log('Ping!')
  return res.send('Pong')
}

export default function init() {
  const router = Server.Router()

  router
    .route('/')
    .get(getApp)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/ping')
    .get(ping)
    .all(Server.middleware.methodNotAllowed)

  return router
}