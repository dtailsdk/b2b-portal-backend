import { ShopifyToken } from 'models'
import configurations from '../../configurations.json'

const VALID_CHECKOUT_TYPES = ['B2B_PORTAL', 'SHOPIFY']

export async function validateAllConfigurations() {
  const shops = await ShopifyToken.q.whereNull('uninstalledAt').withGraphFetched('app')
  console.log(`Found ${shops.length} shops to validate`)
  for (const shop of shops) {
    console.log(`Going to validate configuration for shop ${shop.shop} with identifier ${shop.app.identifier}`)
    await validateConfiguration(configurations[shop.app.identifier])
    console.log(`Successfully validated configuration for shop ${shop.shop} with identifier ${shop.app.identifier}`)
  }
}

export async function validateConfiguration(configuration) {
  if (!configuration) {
    throw Error(`configuration is not defined`)
  }
  if (!VALID_CHECKOUT_TYPES.includes(configuration.checkoutConfiguration.type)) {
    throw Error(`configuration.checkoutConfiguration must be one of [${VALID_CHECKOUT_TYPES}] but was ${configuration.checkoutConfiguration.type}`)
  }
  //TODO Validate remaining parameters when they have been defined
}