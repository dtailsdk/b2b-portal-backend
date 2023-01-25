import { Server, Model, ShopifyOAuth } from '@dtails/toolbox'
import { getEnvironment } from '@dtails/toolbox/lib'
import { log } from '@dtails/logger'
import { App, ShopifyToken } from 'models'
import { initializeNewShop } from './lib/shop-service'
import controllers from './controllers'

Server.init({
  withCors: true,
  credentials: true,
  corsBlacklist: ['/', '/app/api/shopify/auth/confirm', '/app/api/webhooks/app_uninstalled', '/app/api/webhooks/customers_redact', '/app/api/webhooks/customers_data_request', '/app/api/webhooks/shop_redact', '/favicon.ico'],
  bodyParser: {
    parseRawBody: true,
    rawBodyUrls: ['/app/api/webhooks/app_uninstalled', '/app/api/webhooks/shop_redact', '/app/api/webhooks/customers_redact', '/app/api/webhooks/customers_data_request'],
    type: ['text/plain', 'application/json']
  }
})

const knex_debug_mode = getEnvironment('KNEX_DEBUG_MODE') === 'true'
Server.initModel(Model, { debug: knex_debug_mode })

const createAdditionalTokenData = async (tokenData, appIdentifier) => {
  const app = await App.query().findOne({ identifier: appIdentifier })
  tokenData.app_id = app.id
  tokenData.app = app
  return tokenData
}

App.query().then(
  (apps) => {
    const appsConfiguration = {}
    for (const app of apps) {
      appsConfiguration[app.identifier] = app
    }
    const shopifyOAuth = new ShopifyOAuth({
      key: null,
      secret: null,
      multipleApps: appsConfiguration,
      tokenModel: ShopifyToken,
      knex_debug_mode,
      models: [],
      tenant_migrations: [],
      scope: [
        'write_products',
        'write_draft_orders',
        'read_shipping',
        'write_customers'
      ],
      embedded: true,
      create_additional_token_data: createAdditionalTokenData,
      onShopInstalled: (shop, app) => { log(shop); log('App was installed - registering webhooks for shop ' + shop.shop + ' and app "' + app); initializeNewShop(shop) },
      get_shop_by_name: async (req, shopName) => {
        const app = await App.query().findOne({ identifier: req.query.app })
        return await ShopifyToken.query().findOne({ shop: shopName, app_id: app.id }).whereNull('uninstalledAt')
      }
    })

    shopifyOAuth.mount(Server, { redirectRoute: '/app/api' })

    controllers(shopifyOAuth)

    Server.listen()
    Server.useNotFound()
    Server.useErrorHandler()
  }
)