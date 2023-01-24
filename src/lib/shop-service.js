import moment from 'moment'
import { log } from '@dtails/logger'
import { ShopifyToken } from 'models'
import { getConfigurationByShop } from './configuration-service'
import { getApiConnection, getShop } from './shopify-api/stores'
import { updateMetafield } from './shopify-api/metafields'
import { B2B_PORTAL_NAMESPACE, SHOP_CONFIGURATION_KEY } from './constants'

export async function softDeleteShopData(shop) {
  if (shop != null) {
    log('Shop exists in DB - going to mark shop as deleted', shop)
    await ShopifyToken.q.where({ id: shop.id }).update({ uninstalledAt: moment() })
  } else {
    log('Shop does not exist in DB')
  }
}

export async function deleteShopData(shop) {
  if (shop != null) {
    log('Shop exists in DB - going to delete all related data for shop', shop)
    await ShopifyToken.q.where({ id: shop.id }).whereNotNull('uninstalledAt').del()
  } else {
    log('Shop does not exist in DB - data has previously been deleted, or the uninstalledAt field has been manually set to null')
  }
}

export async function updateConfigurationsInShops() {
  const dbShops = await ShopifyToken.q.whereNull('uninstalledAt').withGraphFetched('app')
  for (const dbShop of dbShops) {
    await setConfigurationInShop(dbShop)
  }
}

export async function setConfigurationInShop(dbShop) {
  const shopifyApi = getApiConnection(dbShop)
  const shopifyShop = await getShop(shopifyApi)
  const configuration = await getConfigurationByShop(dbShop)
  const metafield = {
    namespace: B2B_PORTAL_NAMESPACE,
    key: SHOP_CONFIGURATION_KEY,
    ownerId: shopifyShop.id,
    type: 'json',
    value: JSON.stringify(configuration),
  }
  await updateMetafield(shopifyApi, metafield)
}