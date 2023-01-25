import { ShopifyToken } from 'models'
import { getConfigurationByShop } from './configuration-service'
import { getApiConnection, getShop } from './shopify-api/stores'
import { updateMetafield, createMetafieldDefinition, getMetafieldDefinitions } from './shopify-api/metafields'
import { log } from '@dtails/logger'

export const B2B_PORTAL_NAMESPACE = 'dtails_b2b_portal'
export const SHOP_CONFIGURATION_KEY = 'shop_configuration'
export const CUSTOMER_DISCOUNT_KEY = 'customer_discount_percentage'
export const CUSTOMER_ALLOW_SINGLE_KEY = 'allow_single_units'
export const CUSTOMER_DISALLOW_INVOICE_KEY = 'disallow_invoice_payment'
export const CUSTOMER_DISALLOW_CARD_KEY = 'disallow_card_payment'

export const SHOP_METAFIELD = {
  namespace: B2B_PORTAL_NAMESPACE,
  key: SHOP_CONFIGURATION_KEY,
  type: 'json',
}
export const CUSTOMER_DISCOUNT_METAFIELD = {
  namespace: B2B_PORTAL_NAMESPACE,
  key: CUSTOMER_DISCOUNT_KEY,
  type: 'number_integer',
  ownerType: 'CUSTOMER',
  name: 'Customer discount percentage'
}
export const CUSTOMER_ALLOW_SINGLE_METAFIELD = {
  namespace: B2B_PORTAL_NAMESPACE,
  key: CUSTOMER_ALLOW_SINGLE_KEY,
  type: 'boolean',
  ownerType: 'CUSTOMER',
  name: 'Allow single quantity purchases'
}
export const CUSTOMER_DISALLOW_INVOICE_METAFIELD = {
  namespace: B2B_PORTAL_NAMESPACE,
  key: CUSTOMER_DISALLOW_INVOICE_KEY,
  type: 'boolean',
  ownerType: 'CUSTOMER',
  name: 'Disallow payment by invoice'
}
export const CUSTOMER_DISALLOW_CARD_METAFIELD = {
  namespace: B2B_PORTAL_NAMESPACE,
  key: CUSTOMER_DISALLOW_CARD_KEY,
  type: 'boolean',
  ownerType: 'CUSTOMER',
  name: 'Disallow payment by credit card'
}

export async function updateConfigurationsInShops() {
  const dbShops = await ShopifyToken.q.whereNull('uninstalledAt').withGraphFetched('app')
  for (const dbShop of dbShops) {
    await setShopMetafield(dbShop)
  }
}

export async function setShopMetafield(dbShop) {
  const shopifyApi = getApiConnection(dbShop)
  const shopifyShop = await getShop(shopifyApi)
  const configuration = await getConfigurationByShop(dbShop)
  console.log('configuration in set shop metafield', dbShop, configuration)
  const metafield = {
    namespace: SHOP_METAFIELD.namespace,
    key: SHOP_METAFIELD.key,
    ownerId: shopifyShop.id,
    type: SHOP_METAFIELD.type,
    value: JSON.stringify(configuration),
  }
  await updateMetafield(shopifyApi, metafield)
}

export async function createDefinedMetafieldsForShops() {
  const dbShops = await ShopifyToken.q.whereNull('uninstalledAt').withGraphFetched('app')
  for (const dbShop of dbShops) {
    log(`Going to create defined metafields for shop ${dbShop.shop}`)
    await createDefinedMetafields(dbShop)
  }
}

export async function createDefinedMetafields(dbShop) {
  const shopifyApi = getApiConnection(dbShop)
  const configuration = await getConfigurationByShop(dbShop)
  const existingMetafields = await getDefinedMetafields(shopifyApi, 'CUSTOMER')

  if (configuration.discountConfiguration.customerDiscount.enableCustomerDiscount) {
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

  if (configuration.checkoutConfiguration.paymentMethodConfiguration.enableCardMethod) {
    log(`Disallow card payment is enabled in configuration - will create metafield if it does not already exist`)
    const configurationMetafield = configuration.checkoutConfiguration.paymentMethodConfiguration.customerConfiguration.disallowCardMetafield
    const metafield = {
      namespace: configurationMetafield.metafieldNamespace,
      key: configurationMetafield.metafieldKey,
      type: CUSTOMER_DISALLOW_CARD_METAFIELD.type,
      ownerType: CUSTOMER_DISALLOW_CARD_METAFIELD.ownerType,
      name: CUSTOMER_DISALLOW_CARD_METAFIELD.name
    }
    await createIfMissing(shopifyApi, metafield, existingMetafields)
  }

  const configurationMetafield = configuration.checkoutConfiguration.paymentMethodConfiguration.customerConfiguration.disallowInvoiceMetafield
  const metafield = {
    namespace: configurationMetafield.metafieldNamespace,
    key: configurationMetafield.metafieldKey,
    type: CUSTOMER_DISALLOW_INVOICE_METAFIELD.type,
    ownerType: CUSTOMER_DISALLOW_INVOICE_METAFIELD.ownerType,
    name: CUSTOMER_DISALLOW_INVOICE_METAFIELD.name
  }
  await createIfMissing(shopifyApi, metafield, existingMetafields)
}

async function createIfMissing(shopifyApi, metafield, existingMetafields) {
  if (alreadyExists(metafield, existingMetafields)) {
    log(`Metafield definition with namespace ${metafield.namespace} and key ${metafield.key} already exists`)
  } else {
    await createMetafieldDefinition(shopifyApi, metafield)
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

async function getDefinedMetafields(shopifyApi, ownerType) {
  const metafields = []
  const bulkJobResult = await getMetafieldDefinitions(shopifyApi, ownerType)
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