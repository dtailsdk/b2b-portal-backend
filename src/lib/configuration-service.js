import { ShopifyToken } from 'models'
import { log } from '@dtails/logger'

import { getEnvironment } from '@dtails/toolbox/lib'
import fs from 'fs-extra'

const VALID_CHECKOUT_TYPES = ['B2B_PORTAL', 'SHOPIFY']
let configurations = null

export async function validateAllConfigurations() {
  const shops = await ShopifyToken.q.whereNull('uninstalledAt').withGraphFetched('app')
  log(`Found ${shops.length} shops to validate`)
  const allConfigurations = await getConfigurations()
  for (const shop of shops) {
    await validateConfiguration(allConfigurations[shop.app.identifier])
    log(`Successfully validated configuration for shop ${shop.shop} with identifier ${shop.app.identifier}`)
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

export async function getConfigurations() {
  if (!configurations) {
    log('Lazy loading configurations')
    const fileName = getEnvironment('CONFIGURATIONS_FILE_NAME')
    const filePath = `${__dirname}/../../${fileName}`
    const fileContent = await fs.readFile(filePath, { encoding: 'utf8' })
    configurations = JSON.parse(fileContent)
  }
  return configurations
}