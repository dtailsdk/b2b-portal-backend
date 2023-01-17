import { ShopifyToken } from 'models'

export async function softDeleteShopData(shop) {
  if (shop != null) {
    console.log('Shop exists in DB - going to mark shop as deleted', shop)
    await ShopifyToken.q.where({ id: shop.id }).update({uninstalledAt: Date.now()})
  } else {
    console.log('Shop does not exist in DB')
  }
}

export async function deleteShopData(shop) {
  if (shop != null) {
    console.log('Shop exists in DB - going to delete all related data for shop', shop)
    await ShopifyToken.q.where({ id: shop.id }).del()
  } else {
    console.log('Shop does not exist in DB - data has previously been deleted')
  }
}