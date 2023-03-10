import { log, error } from '@dtails/logger'
import { getEnvironment } from '@dtails/toolbox-backend'
import { ShopifyToken } from 'models'
import { verifyHmac } from './security-service'

export async function validateWebhooks(shop) {
  const app = shop.app
  try {
    const appWebhooks = [
      { topic: 'APP_UNINSTALLED', webhookSubscription: { callbackUrl: getEnvironment('SERVER_URL') + '/app/api/webhooks/app_uninstalled?app=' + app.identifier } },
      { topic: 'PRODUCTS_CREATE', webhookSubscription: { callbackUrl: getEnvironment('SERVER_URL') + '/app/api/webhooks' } },
      { topic: 'PRODUCTS_UPDATE', webhookSubscription: { callbackUrl: getEnvironment('SERVER_URL') + '/app/api/webhooks' } }
    ]

    const shopifyApi = shop.api()
    const webhooks = await shopifyApi.webhook.get()
    for (let i = 0; i < appWebhooks.length; i++) {
      let webhookIsCreated = false
      for (let j = 0; j < webhooks.length; j++) {
        const webhook = webhooks[j]

        if (webhook.topic == appWebhooks[i].topic) {
          if (webhook.callbackUrl == appWebhooks[i].webhookSubscription.callbackUrl) {
            webhookIsCreated = true
            log(`Webhook with topic ${appWebhooks[i].topic} on callback URL ${appWebhooks[i].webhookSubscription.callbackUrl} was already installed`)
          } else {
            log(`Callback URL has changed from ${appWebhooks[i].webhookSubscription.callbackUrl} to ${webhook.callbackUrl} - going to delete old webhook`)
            await shopifyApi.webhook.delete(webhook.id)
          }
        }
      }
      if (!webhookIsCreated) {
        log(`Webhook with topic ${appWebhooks[i].topic} was not installed - going to reinstall webhook`)
        await shopifyApi.webhook.create(appWebhooks[i])
      }
    }
  } catch (e) {
    error('Cannot validate and/or create webhook for shop ' + shop.shop + ' - got error message ' + e.message)
  }
}

export function verifyShopifyWebhook(secret, req, body) {
  return verifyHmac(secret, req, body)
}

/**
 * Validates webhooks for all installed shops
 */
export async function validateAllWebhooks() {
  const dbShops = await ShopifyToken.q.withGraphFetched('app')
  for (const dbShop of dbShops) {
    log('Going to validate webhooks for shop ' + dbShop.shop)
    try {
      await validateWebhooks(dbShop)
    } catch (e) {
      error(`An error occurred while validating webhooks for shop ${dbShop.shop}`, e)
    }
  }
}