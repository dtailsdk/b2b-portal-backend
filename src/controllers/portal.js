import { Server } from '@dtails/toolbox-backend'
import { log, trace } from '@dtails/logger'
import { ShopifyToken } from 'models'
import { getEnvironment } from '@dtails/toolbox-backend'
import querystring from 'querystring'
import jwt from 'jsonwebtoken'
import { computeSignature } from '../lib/security-service'
import { getStoreByName } from '../lib/shop-service'
import { convertToDraftOrder, getShippingForOrder, createOrder } from '../lib/order-service'
import { delay } from '@dtails/toolbox-backend'
import { getCustomerById } from '../lib/customer-service'
import { getProductByHandle } from '../lib/product-service'
/**
 * Controller for the calls from the B2B portal
 */

/**
 * Validates the request and if the request is valid and the user is logged, returns a token for the user
 */
async function getToken(req, res) {
  try {
    const storeName = req.query.shop
    const dbShopName = req.query.shop.replace('.myshopify.com', '')
    const shop = await ShopifyToken.query().withGraphJoined('app').findOne({ shop: dbShopName })
    const appSecret = shop.app.shopifyAppSecret
    const originalQuerystring = req.url.substring(req.url.indexOf('?') + 1)
    const signatureFromClient = querystring.parse(originalQuerystring).signature
    const computedSignature = computeSignature(originalQuerystring, appSecret)
    if (signatureFromClient !== computedSignature || !req.query.logged_in_customer_id) {
      return res.sendStatus(401)
    }
    const signingKey = getEnvironment('SIGN_KEY')
    var token = jwt.sign({
      storeName,
      customerId: req.query.logged_in_customer_id
    }, signingKey)
    return res.send({ token })
  } catch (error) {
    log(error.message)
    trace(error)
    return res.send('ERROR')
  }
}

async function getCustomer(req, res) {
  const store = await getStoreByName(req.storeName)
  //const customer = await store.api().customer.getById(req.customerId)
  const customer = await getCustomerById(store, req.customerId)
  return res.send(customer)
}

async function getShop(req, res) {
  const store = await getStoreByName(req.storeName)
  const shop = await store.api().getShop()
  return res.send(shop)
}

async function getShipping(req, res) {
  //input: address, cart
  const { cart, address} = req.body
  const store = await getStoreByName(req.storeName)
  const customerId = req.customerId
  const customer = await getCustomerById(store, customerId)
  const draftOrder = await convertToDraftOrder(customer, cart, address, store)
  const shippingMethod = await getShippingForOrder(store.api(), draftOrder)

  res.send(shippingMethod)
}

async function getProductInfo(req, res) {
  if (!req.query.handle) {
    return res.send({status: -1, message: 'No handle provided'}).status(503)
  }
  const product = await getProductByHandle(req.query.handle)
  if (product) {
    return res.json(product)
  }
  return res.send({status: -1, message: 'No product found'}).status(503)
}

async function createOrderFromCart(req, res) {
  //input: address, cart
  const { cart, address} = req.body
  const store = await getStoreByName(req.storeName)
  const customerId = req.customerId
  const customer = await getCustomerById(store, customerId)
  const draftOrder = await convertToDraftOrder(customer, cart, address, store)
  const shipping = await getShippingForOrder(store.api(), draftOrder)
  if (shipping) {
    draftOrder.input.shippingLine = {
      shippingRateHandle: shipping.handle,
      title: shipping.title,
      //price: shipping.price.amount
    }
  }
  console.log('Creating draft order', JSON.stringify(draftOrder, null, 2))
  const orderResponse = await createOrder(store.api(), draftOrder)
  console.log('Order created', JSON.stringify(orderResponse, null, 2))

  await delay(2000) //Wait 2 seconds, to be sure the order has been created locally

  const customerUpdateQuery = `mutation customerUpdateDefaultAddress($addressId: ID!, $customerId: ID!) {
    customerUpdateDefaultAddress(addressId: $addressId, customerId: $customerId) {
      customer {
       id
      }
      userErrors {
        field
        message
      }
    }
  }`
  const input = {
    addressId: orderResponse.order.shippingAddress.id,
    customerId: `gid://shopify/Customer/${customerId}`
  }
  console.log('INPUT', JSON.stringify(input, null, 2))
  const addressResult = await store.api().runQuery(customerUpdateQuery, input)
  console.log('address result', JSON.stringify(addressResult, null, 2))

  return res.json(orderResponse)
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
    if (err) {
      console.log('error verifying token', err)
      return res.sendStatus(403)
    }
    console.log('TOKEN', payload)
    req.customerId = payload.customerId
    req.storeName = payload.storeName

    next()
  })
}

export default function init() {
  const router = Server.Router()

  router
    .route('/token')
    .get(getToken)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/ping')
    .get(ping)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/get_shop')
    .get(authenticateToken, getShop)
    .all(Server.middleware.methodNotAllowed)

  /*router
    .route('*')
    .all(authenticateToken)*/

  router
    .route('/get_customer')
    .get(authenticateToken, getCustomer)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/get_shipping')
    .post(authenticateToken, getShipping)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/create_order')
    .post(authenticateToken, createOrderFromCart)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/product')
    .get(authenticateToken, getProductInfo)
    .all(Server.middleware.methodNotAllowed)
  
  router
    .route('/products')
    .get(authenticateToken, getProducts)
    .all(Server.middleware.methodNotAllowed)

  return router
}
