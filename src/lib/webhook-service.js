import crypto from 'crypto'
import { log, error } from '@dtails/logger'
import { getEnvironment } from '@dtails/toolbox/lib'
import { ShopifyToken } from 'models'
import { createWebhook, deleteWebhook, getWebhooks } from './shopify-api/webhooks'
import { getApiConnection } from './shopify-api/stores'

export async function validateWebhooks(shop) {
  const app = shop.app
  console.log('app identifier when adding webhook: ' + app.identifier)
  try {
    const appWebhooks = [
      { topic: 'APP_UNINSTALLED', webhookSubscription: { callbackUrl: getEnvironment('SERVER_URL') + '/app/api/webhooks/app_uninstalled?app=' + app.identifier } }
    ]

    const shopifyApi = getApiConnection(shop)
    const webhooks = await getWebhooks(shopifyApi)
    for (let i = 0; i < appWebhooks.length; i++) {
      let webhookIsCreated = false
      for (let j = 0; j < webhooks.length; j++) {
        const webhook = webhooks[j].node

        if (webhook.topic == appWebhooks[i].topic) {
          if (webhook.callbackUrl == appWebhooks[i].webhookSubscription.callbackUrl) {
            webhookIsCreated = true
            log(`Webhook with topic ${appWebhooks[i].topic} on callback URL ${appWebhooks[i].webhookSubscription.callbackUrl} was already installed`)
          } else {
            log(`Callback URL has changed from ${appWebhooks[i].webhookSubscription.callbackUrl} to ${webhook.callbackUrl} - going to delete old webhook`)
            await deleteWebhook(shopifyApi, webhook.id)
          }
        }
      }
      if (!webhookIsCreated) {
        log(`Webhook with topic ${appWebhooks[i].topic} was not installed - going to reinstall webhook`)
        await createWebhook(shopifyApi, appWebhooks[i])
      }
    }
  } catch (e) {
    error('Cannot validate and/or create webhook for shop ' + shop.shop + ' - got error message ' + e.message)
  }
}

export function verifyShopifyWebhook(secret, req, body) {
  try {
    var digest = crypto.createHmac('SHA256', secret)
      .update(new Buffer.from(body, 'utf8'))
      .digest('base64')
    return digest === req.headers['x-shopify-hmac-sha256']
  } catch (error) {
    log(error, req.body)
    return false
  }
}

/**
 * Validates webhooks for all installed shops
 */
export async function validateAllWebhooks() {
  const shops = await ShopifyToken.q.withGraphFetched('app')
  for (const shop of shops) {
    log('Going to validate webhooks for shop ' + shop.shop)
    try {
      await validateWebhooks(shop)
    } catch (e) {
      error(e)
    }
  }
}