import { Server, Model, ShopifyOAuth } from '@mekanisme/server'
import { getEnvironment } from '@mekanisme/server/lib'
import {
  ShopifyToken
} from 'models'
import uuidv4 from 'uuid/v4'

Server.init({ 
  withCors: true,
  credentials: true,
  corsBlacklist: ['/', '/app/shopify/auth/confirm', '/app/webhooks/app_uninstalled', '/app/webhooks/customers_redact',  '/app/webhooks/customers_data_request',  '/app/webhooks/shop_redact', '/favicon.ico'],
  bodyParser: {
    parseRawBody: true,
    rawBodyUrls: ['/app/webhooks/app_uninstalled', '/app/webhooks/shop_redact', '/app/webhooks/customers_redact',  '/app/webhooks/customers_data_request', '/settings'],
    type: ['text/plain', 'application/json']
  }
})

const knex_debug_mode = getEnvironment('KNEX_DEBUG_MODE') === 'true'
Server.initModel(Model, { debug: knex_debug_mode })

//Shopify GraphQL bug requires write_orders for webhooks ORDER_CREATED etc.
const shopifyOAuth = new ShopifyOAuth({
  key: getEnvironment('SHOPIFY_APP_KEY'),
  secret: getEnvironment('SHOPIFY_APP_SECRET'),
  tokenModel: ShopifyToken,
  knex_debug_mode,
  models: [],
  tenant_migrations: [],
  scope: [
    'read_products',
    'write_products',
  ],
  embedded: true,
  create_additional_token_data: token => ({ ...token, shoptimist_api_key: uuidv4() }),
})

shopifyOAuth.mount(Server, { redirectRoute: '/' })

//Do not do anything restricted here, as shop is only a query parameter (i.e. can be set by unauthorized users)
Server.get('/', async (req, res) => {
  console.log('Redirect from confirm step of OAuth flow for shop', req.query.shop)
  res.redirect(302, 'https://' + req.query.shop + '.myshopify.com/admin/apps/' + getEnvironment('SHOPIFY_APP_NAME'))
})

import controllers from 'controllers'
controllers(shopifyOAuth)

Server.listen()

Server.useNotFound()
Server.useErrorHandler()

//TODO Enable Sentry via Raven