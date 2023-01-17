import { Server } from '@mekanisme/server'
import { ShopifyToken } from 'models'
import { getTheProducts } from '../lib/products'

//Service that does not require authorization used to decide whether to start OAuth flow for shops where app is not installed yet
async function getShop(req, res) {
  const dbShopName = req.query.shop.replace('.myshopify.com', '')
  const shop = await ShopifyToken.query().withGraphJoined('app').findOne({ shop: dbShopName, identifier: req.query.app, uninstalledAt: null })
  return res.send({
    shop: {
      name: dbShopName
    },
    appInstalled: (shop && shop.uninstalledAt == null) ? true : false
  })
}

//Example of a service that needs to be called with an authorization header (Shopify token)
async function needsAuth(req, res) {
  const shop = req.shopFromToken
  return res.send({
    shop: {
      name: shop.shop
    },
    appInstalled: typeof shop !== 'undefined'
  })
}

async function getProducts(req, res) {
  const shop = req.shopFromToken
  const products = await getTheProducts(shop)
  return res.send(products)
}

async function ping(req, res) {
  console.log('Ping!')
  return res.send('Pong')
}

export default function init(shopifyOAuth) {
  const router = Server.Router()

  router
    .route('/')
    .get(getShop)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/needs_auth')
    .get(shopifyOAuth.withAuthorizedShop(), needsAuth)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/products')
    .get(shopifyOAuth.withAuthorizedShop(), getProducts)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/ping')
    .get(ping)
    .all(Server.middleware.methodNotAllowed)

  return router
}