import moment from 'moment'
import { log } from '@dtails/logger'
import { ShopifyToken } from 'models'
import { setShopMetafield, createDefinedMetafields } from './metafield-service'
import { validateWebhooks } from './webhook-service'

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

export async function initializeNewShop(dbShop){
  validateWebhooks(shop)
  await setShopMetafield(dbShop)
  await createDefinedMetafields(dbShop)
}