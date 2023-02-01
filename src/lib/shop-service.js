import moment from 'moment'
import { log } from '@dtails/logger'
import { ShopifyToken } from 'models'
import { setShopMetafield, createDefinedMetafields } from './metafield-service'
import { validateWebhooks } from './webhook-service'

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