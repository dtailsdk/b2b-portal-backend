import { Server, Model, ShopifyOAuth } from '@mekanisme/server'
import { getEnvironment } from '@mekanisme/server/lib'
import { App, ShopifyToken } from 'models'
import { validateWebhooks } from './lib/webhooks'
import controllers from 'controllers'

Server.init({
  withCors: true,
  credentials: true,
  corsBlacklist: ['/', '/app/shopify/auth/confirm', '/app/webhooks/app_uninstalled', '/app/webhooks/customers_redact', '/app/webhooks/customers_data_request', '/app/webhooks/shop_redact', '/favicon.ico'],
  bodyParser: {
    parseRawBody: true,
    rawBodyUrls: ['/app/webhooks/app_uninstalled', '/app/webhooks/shop_redact', '/app/webhooks/customers_redact', '/app/webhooks/customers_data_request'],
    type: ['text/plain', 'application/json']
  }
})

const knex_debug_mode = getEnvironment('KNEX_DEBUG_MODE') === 'true'
Server.initModel(Model, { debug: knex_debug_mode })

const createAdditionalTokenData = async (tokenData, appIdentifier) => {
  const app = await App.query().findOne({ identifier: appIdentifier })
  tokenData.app_id = app.id
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
        'read_products',
      ],
      embedded: true,
      create_additional_token_data: createAdditionalTokenData,
      onShopInstalled: (shop, app) => { console.log('App was installed - registering webhooks for shop ' + shop.shop + ' and app "' + app); validateWebhooks(shop, app) },
      get_shop_by_name: async (req, shopName) => {
        const app = await App.query().findOne({ identifier: req.query.app })
        return await ShopifyToken.query().findOne({ shop: shopName, app_id: app.id }).whereNull('uninstalledAt')
      }
    })

    shopifyOAuth.mount(Server, { redirectRoute: '/app' })

    controllers(shopifyOAuth)

    Server.listen()
    Server.useNotFound()
    Server.useErrorHandler()
  }
)