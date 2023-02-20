import * as Sentry from "@sentry/node"
import { Server } from '@dtails/toolbox-backend'
import { log } from '@dtails/logger'
import { verifyShopifyWebhook } from '../lib/webhook-service'
import { deleteShopData, softDeleteShopData } from '../lib/shop-service'
import { ShopifyToken, App, Webhook } from 'models'
import { QueueType, Priority } from '@dtails/queue-backend'
import { QueueSender } from "@dtails/queue-backend"
import { getEnvironment } from '@dtails/toolbox-backend'
import moment from "moment"

async function appUninstalled(req, res) {
  const shop = await verifyWebhook(req, req.rawBody, req.query.app)
  log(`On uninstall, DB shop is ${shop.shop}`, req.headers['x-shopify-shop-domain'])
  await softDeleteShopData(shop)
  Sentry.captureMessage(`dtails B2B portal app was uninstalled for shop ${shop.shop} - app data is soft deleted`)
  return res.sendStatus(200)
}

async function redactShopDataRequested(req, res) {
  const shop = await verifyWebhook(req, req.rawBody, req.query.app)
  log('On shop redact request, DB shop is ', shop, req.headers['x-shopify-shop-domain'])
  await deleteShopData(shop)
  Sentry.captureMessage(`dtails B2B portal app was requested redacted by Shopify webhook caused by app uninstall 48 hours ago for shop ${shop.shop} - app data is permanently deleted`)
  return res.sendStatus(200)
}

async function customersRedact(req, res) {
  const shop = await verifyWebhook(req, req.rawBody, req.query.app)
  log('Customers redact requested for customer, DB shop is ', shop.id, req.headers['x-shopify-shop-domain'])
  Sentry.captureMessage(`Customer data redact requested via GDPR webhook - data was requested redacted for customer: ${req.rawBody}`)
  return res.sendStatus(200)
}

async function customersDataRequest(req, res) {
  const shop = await verifyWebhook(req, req.rawBody, req.query.app)
  log('Customer data requested for customer, DB shop is ', shop.id, req.headers['x-shopify-shop-domain'])
  Sentry.captureMessage(`Customer data requested via GDPR webhook - data was requested redacted for customer: ${req.rawBody}`)
  return res.sendStatus(200)
}

let queueSender = null

async function queueWebhook(req, res) {
  const store_name = req.header('x-shopify-shop-domain')
  const topic = req.header('x-shopify-topic')
  const hmac = req.header('x-shopify-hmac-sha256')
  const shopifyWebhookId = req.header('x-shopify-webhook-id')
  const entityId = req.body.id
  const data = req.body

  const shopName = store_name.split('.')[0]
  const shop = await ShopifyToken.query().findOne({ shop: shopName }).whereNull('uninstalledAt').withGraphJoined('app')
  const appSecret = shop.app.shopifyAppSecret
  
  if (!verifyShopifyWebhook(appSecret, req, req.rawBody)) {
    return res.status(401)
  }
  
  if (!queueSender) {
    queueSender = new QueueSender(getEnvironment('DATABASE_URL'))
  }
  const webhook = {
    store_name,
    store_id: shop.id,
    topic,
    hmac,
    data
  }
  let webhookEvent = await Webhook.q.where({ topic, hmac }).first()
  if (webhookEvent) {
    console.log('Webhook event already exists: '. topic, data.id)
    return res.status(200)
  }
  
  webhookEvent = await Webhook.q.insert(webhook)
  let jobData = {
    store_name,
    store_id: shop.id,
    webhookId: webhookEvent.id,
    topic,
    entityId: data.id
  }
  if (topic.indexOf('product') > -1) {
    const singletonKey = `${shop.id}-${data.id}`
    const result = await queueSender.send(QueueType.Product, jobData, singletonKey)
    console.log('queueSender result', result)
  }

  webhookEvent.queuedAt = moment()
  await Webhook.q.patch(webhookEvent).where({id: webhookEvent.id})
  res.status(200)

}

async function verifyWebhook(req, rawBody, appIdentifier) {
  if (!appIdentifier) {
    throw Error('App query parameter is not defined in webhook call from Shopify')
  }
  log('Verify webhook for app identifier ' + appIdentifier)
  const fullShopName = req.headers['x-shopify-shop-domain']
  const shopName = fullShopName.split('.')[0]
  const app = await App.query().findOne({ identifier: appIdentifier })
  const shop = await ShopifyToken.query().findOne({ shop: shopName, appId: app.id }).whereNull('uninstalledAt')
  log('Verifying webhook', appIdentifier, app, shop)
  if (shop) {
    if (!verifyShopifyWebhook(app.shopifyAppSecret, req, rawBody)) {
      throw new Error('Webhook was not verified for shop ' + shopName)
    }
    return shop
  } else {
    logger.warn(`Did not find shop for shop name ${fullShopName} and app ${appIdentifier} - ignoring webhook`)
    return null
  }
}

async function ping(req, res) {
  log('Ping!')
  return res.send('Pong')
}

export default function init() {
  const router = Server.Router()

  router
    .route('/')
    .post(queueWebhook)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/app_uninstalled')
    .post(appUninstalled)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/customers_redact')
    .post(customersRedact)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/customers_data_request')
    .post(customersDataRequest)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/shop_redact')
    .post(redactShopDataRequested)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/ping')
    .get(ping)
    .all(Server.middleware.methodNotAllowed)

  return router
}