import { ShopifyToken } from 'models'
import { getConfigurationByShop, validateConfiguration } from './configuration-service'
import { log } from '@dtails/logger'

export const CUSTOMER_OWNER_TYPE = 'CUSTOMER'
export const PRODUCT_OWNER_TYPE = 'PRODUCT'
export const B2B_PORTAL_NAMESPACE = 'dtails_b2b_portal'
export const SHOP_CONFIGURATION_KEY = 'shop_configuration'
export const CUSTOMER_DISCOUNT_KEY = 'customer_discount_percentage'
export const CUSTOMER_ALLOW_SINGLE_KEY = 'allow_single_units'
export const PRODUCT_DISCOUNT_DISALLOWED_KEY = 'disallow_discount'

export const SHOP_METAFIELD = {
  namespace: B2B_PORTAL_NAMESPACE,
  key: SHOP_CONFIGURATION_KEY,
  type: 'json',
}
export const CUSTOMER_DISCOUNT_METAFIELD = {
  namespace: B2B_PORTAL_NAMESPACE,
  key: CUSTOMER_DISCOUNT_KEY,
  type: 'number_integer',
  ownerType: CUSTOMER_OWNER_TYPE,
  name: 'Customer discount percentage'
}
export const CUSTOMER_ALLOW_SINGLE_METAFIELD = {
  namespace: B2B_PORTAL_NAMESPACE,
  key: CUSTOMER_ALLOW_SINGLE_KEY,
  type: 'boolean',
  ownerType: CUSTOMER_OWNER_TYPE,
  name: 'Allow single quantity purchases'
}
export const PRODUCT_DISCOUNT_DISALLOWED_METAFIELD = {
  namespace: B2B_PORTAL_NAMESPACE,
  key: PRODUCT_DISCOUNT_DISALLOWED_KEY,
  type: 'boolean',
  ownerType: PRODUCT_OWNER_TYPE,
  name: 'Disallow discounts for product'
}

export async function updateConfigurationsInShops() {
  const dbShops = await ShopifyToken.q.whereNull('uninstalledAt').withGraphFetched('app')
  for (const dbShop of dbShops) {
    log(`Going to update shop metafield with configuration for shop ${dbShop.shop}`)
    await setShopMetafield(dbShop)
    log(`Finished updating shop metafield with configuration for shop ${dbShop.shop}`)
  }
  log(`Finished updating shop metafields for all shops`)
}

export async function setShopMetafield(dbShop) {
  const shopifyShop = await dbShop.api().getShop()
  const configuration = await getConfigurationByShop(dbShop)
  await validateConfiguration(configuration)
  const metafield = {
    namespace: SHOP_METAFIELD.namespace,
    key: SHOP_METAFIELD.key,
    ownerId: shopifyShop.id,
    type: SHOP_METAFIELD.type,
    value: JSON.stringify(configuration),
  }
  await dbShop.api().metafield.update(metafield)
}

export async function createDefinedMetafieldsForShops() {
  const dbShops = await ShopifyToken.q.whereNull('uninstalledAt').withGraphFetched('app')
  for (const dbShop of dbShops) {
    log(`Going to create defined metafields for shop ${dbShop.shop}`)
    await createDefinedMetafields(dbShop)
    log(`Created defined metafields for shop ${dbShop.shop}`)
  }
  log(`Finished creating metafields for all shop`)
}

export async function createDefinedMetafields(dbShop) {
  const configuration = await getConfigurationByShop(dbShop)
  const shopifyApi = dbShop.api()
  const existingMetafields = await getDefinedMetafields(shopifyApi, [CUSTOMER_OWNER_TYPE, PRODUCT_OWNER_TYPE])

  if (configuration.discountConfiguration.customerDiscount.enable) {
    log(`Customer discount is enabled in configuration - will create metafield if it does not already exist`)
    const configurationMetafield = configuration.discountConfiguration.customerDiscount.percentageMetafield
    const metafield = {
      namespace: configurationMetafield.metafieldNamespace,
      key: configurationMetafield.metafieldKey,
      type: CUSTOMER_DISCOUNT_METAFIELD.type,
      ownerType: CUSTOMER_DISCOUNT_METAFIELD.ownerType,
      name: CUSTOMER_DISCOUNT_METAFIELD.name
    }
    await createIfMissing(shopifyApi, metafield, existingMetafields)
  }

  if (configuration.discountConfiguration.productDiscount.enable) {
    log(`Disallow discunts for products is enabled in configuration - will create metafield if it does not already exist`)
    const configurationMetafield = configuration.discountConfiguration.productDiscount.discountDisallowedMetafield
    const metafield = {
      namespace: configurationMetafield.metafieldNamespace,
      key: configurationMetafield.metafieldKey,
      type: PRODUCT_DISCOUNT_DISALLOWED_METAFIELD.type,
      ownerType: PRODUCT_DISCOUNT_DISALLOWED_METAFIELD.ownerType,
      name: PRODUCT_DISCOUNT_DISALLOWED_METAFIELD.name
    }
    await createIfMissing(shopifyApi, metafield, existingMetafields)
  }

  if (configuration.cartConfiguration.customerConfiguration.enableSingleUnits) {
    log(`Allow single units purchase is enabled in configuration - will create metafield if it does not already exist`)
    const configurationMetafield = configuration.cartConfiguration.customerConfiguration.singleUnitsMetafield
    const metafield = {
      namespace: configurationMetafield.metafieldNamespace,
      key: configurationMetafield.metafieldKey,
      type: CUSTOMER_ALLOW_SINGLE_METAFIELD.type,
      ownerType: CUSTOMER_ALLOW_SINGLE_METAFIELD.ownerType,
      name: CUSTOMER_ALLOW_SINGLE_METAFIELD.name
    }
    await createIfMissing(shopifyApi, metafield, existingMetafields)
  }
}

async function createIfMissing(shopifyApi, metafield, existingMetafields) {
  if (alreadyExists(metafield, existingMetafields)) {
    log(`Metafield definition with namespace ${metafield.namespace} and key ${metafield.key} already exists`)
  } else {
    await shopifyApi.metafield.createDefinition(metafield)
    log(`Created metafield definition with namespace ${metafield.namespace} and key ${metafield.key}`)
  }
}

function alreadyExists(metafield, existingMetafields) {
  for (const existingMetafield of existingMetafields) {
    if (existingMetafield.namespace == metafield.namespace && existingMetafield.key == metafield.key) {
      return true
    }
  }
  return false
}

async function getDefinedMetafields(shopifyApi, ownerTypes) {
  const metafields = []
  const bulkJobResult = await shopifyApi.metafield.getDefinitions(ownerTypes)
  const isSingleMetafield = typeof bulkJobResult === 'object'

  if (!bulkJobResult || (!isSingleMetafield && bulkJobResult.indexOf('{') == -1)) {
    log('No JSON lines in bulk job file with metafields, abort')
    return metafields
  }

  if (isSingleMetafield) {
    await handleMetafield(bulkJobResult, metafields)
  } else {
    const lines = bulkJobResult.split('\n')
    log('Bulk job fetching metafields finished, there are ' + lines.length + ' metafields to sync')

    for (let i = 0; i < lines.length; i++) {
      if (i % 100 == 0) {
        log('Parsing line number ' + i)
      }
      const line = lines[i]
      if (line.indexOf('{') == -1 || line.indexOf('}') == -1) {
        log('Not json:', line)
        continue
      }
      const lineJson = JSON.parse(line)
      await handleMetafield(lineJson, metafields)
    }
  }
  return metafields
}

async function handleMetafield(lineJson, metafields) {
  if (lineJson.id.indexOf('gid://shopify/Metafield') > -1) {
    metafields.push(lineJson)
  } else {
    log('Unexpected line type:', lineJson)
  }
}