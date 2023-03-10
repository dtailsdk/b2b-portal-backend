import moment from 'moment'
import { log } from '@dtails/logger'
import { ShopifyToken } from 'models'
import { setShopMetafield, createDefinedMetafields } from './metafield-service'
import { validateWebhooks } from './webhook-service'

export async function getStoreByName(storeName) {
  const store = await ShopifyToken.q.where({ shop: storeName.replace('.myshopify.com', '') }).withGraphJoined('app').first()
  return store
}

export async function softDeleteShopData(dbShop) {
  if (dbShop != null) {
    log(`Shop exists in DB - going to mark shop ${dbShop.shop} as uninstalled`)
    await ShopifyToken.q.where({ id: dbShop.id }).update({ uninstalledAt: moment() })
  } else {
    log('Shop does not exist in DB')
  }
}

export async function deleteShopData(dbShop) {
  if (dbShop != null) {
    log(`Shop exists in DB - going to delete all related data for shop ${dbShop.shop}`)
    await ShopifyToken.q.where({ id: dbShop.id }).whereNotNull('uninstalledAt').del()
  } else {
    log('Shop does not exist in DB - data has previously been deleted, or the uninstalledAt field has been manually set to null')
  }
}

export async function initializeNewShop(dbShop) {
  await validateWebhooks(dbShop)
  await setShopMetafield(dbShop)
  await createDefinedMetafields(dbShop)
}

export function getAppScopes() {
  return [
    'read_markets',
    'read_orders',
    'write_products',
    'write_draft_orders',
    'read_shipping',
    'write_customers',
    'unauthenticated_read_metaobjects',
    'unauthenticated_read_product_listings'
  ]
}

export async function getInstalledShop(dbShopName, app) {
  const shop = await ShopifyToken.query().withGraphJoined('app').findOne({ shop: dbShopName, identifier: app, uninstalledAt: null })
  const scopesUpdated = shop.scope == getAppScopes().join(',')
  if (!scopesUpdated) {
    log(`Scopes are NOT up to date for shop ${dbShopName} - going to request confirmation of new scopes`)
  }
  return {
    shop: {
      name: dbShopName
    },
    installedAndUpdated: (shop && scopesUpdated) ? true : false
  }
}