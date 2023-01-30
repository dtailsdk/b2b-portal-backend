import { Server } from '@dtails/toolbox'
import { log } from '@dtails/logger'

import { ShopifyToken } from 'models'
import querystring from 'querystring'
import jwt from 'jsonwebtoken'
import { computeSignature } from '../lib/utils'
import { getEnvironment } from '@dtails/toolbox/lib'

/**
 * Validates the request and if the request is valid and the user is logged, returns a token for the user
 */
async function getToken(req, res) {
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
  
  res.send({token})
}

export default function init() {
  const router = Server.Router()

  router
    .route('/get_token')
    .get(getToken)
    .all(Server.middleware.methodNotAllowed)

  return router
}