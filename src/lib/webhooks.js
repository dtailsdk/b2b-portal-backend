import crypto from 'crypto'
import { getEnvironment } from '@mekanisme/server/lib'
import { ShopifyToken } from 'models'
import { createWebhook, getWebhooks } from './shopify-api/webhooks'
import { getApiConnection } from './shopify-api/stores'
import { sendSupportErrorMail } from './mail'

export async function validateWebhooks(shop) {
  try {
    const appWebhooks = [
      { topic: 'APP_UNINSTALLED', webhookSubscription: { callbackUrl: getEnvironment('SERVER_URL') + '/app/webhooks/app_uninstalled' } },
    ]

    const shopifyApi = getApiConnection(shop)
    const webhooks = await getWebhooks(shopifyApi)
    for (let i = 0; i < appWebhooks.length; i++) {
      let webhookIsCreated = false
      for (let j = 0; j < webhooks.length; j++) {
        const webhook = webhooks[j].node

        if (webhook.topic == appWebhooks[i].topic) {
          console.log('Webhook with topic ' + appWebhooks[i].topic + ' was already installed')
          webhookIsCreated = true
          break
        }
      }
      if (!webhookIsCreated) {
        console.log('Webhook with topic ' + appWebhooks[i].topic + ' was not installed - going to reinstall webhook')
        await createWebhook(shopifyApi, appWebhooks[i])
      }
    }
  } catch (e) {
    await sendSupportErrorMail('Cannot validate and/or create webhook for shop ' + shop.shop + ' - got error message ' + e.message)
  }
}

export function verifyShopifyWebhook(secret, req, body) {
  try {
    var digest = crypto.createHmac('SHA256', secret)
      .update(new Buffer.from(body, 'utf8'))
      .digest('base64')
    return digest === req.headers['x-shopify-hmac-sha256'];
  } catch (error) {
    console.log(error, req.body)
    return false
  }
}

/**
 * Validates webhooks for all installed shops
 */
export async function validateAllWebhooks() {
  const shops = await ShopifyToken.q
  for (let i = 0; i < shops.length; i++) {
    const shop = shops[i]
    console.log('Going to validate webhooks for shop ' + shop.shop)
    try {
      await validateWebhooks(shop)
    } catch (e) {
      console.log(e)
      await sendSupportErrorMail('Cannot validate webhook for shop ' + shop.shop + ' - got error message ' + e.message)
    }
  }
}