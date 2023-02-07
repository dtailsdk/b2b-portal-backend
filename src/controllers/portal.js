import { Server } from '@dtails/toolbox-backend'
import { log, trace } from '@dtails/logger'
import { ShopifyToken } from 'models'
import { getEnvironment } from '@dtails/toolbox-backend'
import querystring from 'querystring'
import jwt from 'jsonwebtoken'
import { computeSignature } from '../lib/security-service'

/**
 * Controller for the calls from the B2B portal
 */

/**
 * Validates the request and if the request is valid and the user is logged, returns a token for the user
 */
async function getToken(req, res) {
  try {
    const dbShopName = req.headers['x-shop-domain'].replace('.myshopify.com', '')
    const shop = await ShopifyToken.query().withGraphJoined('app').findOne({ shop: dbShopName })
    const appSecret = shop.app.shopifyAppSecret

    const originalQuerystring = req.url.substring(req.url.indexOf('?') + 1)
    const signatureFromClient = querystring.parse(originalQuerystring).signature
    const computedSignature = computeSignature(originalQuerystring, appSecret)

    if (signatureFromClient !== computedSignature || !req.query.logged_in_customer_id) {
      return res.status(401)
    }

    const signingKey = getEnvironment('SIGN_KEY')
    var token = jwt.sign({
      userId: req.query.logged_in_customer_id
    }, signingKey)
    return res.send({ token })
  } catch (error) {
    log(error.message)
    trace(error)
  }

}

async function getProducts(req, res) {
  log('TODO!')
  return res.send('TODO')
}

async function ping(req, res) {
  log('Ping!')
  return res.send('Pong')
}

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

export default function init() {
  const router = Server.Router()

  router
    .route('/tokens')
    .get(getToken)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/products')
    .get(authenticateToken, getProducts)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/ping')
    .get(ping)
    .all(Server.middleware.methodNotAllowed)

  return router
}