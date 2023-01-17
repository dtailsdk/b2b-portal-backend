import { getEnvironment } from '@mekanisme/server/lib'
import { ShopifyToken } from 'models'

export function getAppRootUrl(shopName) {
  return 'https://' + shopName + '.myshopify.com/admin/apps/' + getEnvironment('SHOPIFY_APP_NAME')
}

export async function deleteShopData(shop) {
  if (shop != null) {
    console.log('Shop exists in DB - going to delete all related data for shop', shop)
    await ShopifyToken.q.where({ id: shop.id }).del()
  } else {
    console.log('Shop does not exist in DB - data has previously been deleted')
  }
}