import { getApiConnection } from './shopify-api/stores'
import { getFirstFive } from './shopify-api/products'

export async function getTheProducts(shop) {
  const shopifyApi = getApiConnection(shop)
  const firstFiveProducts = await getFirstFive(shopifyApi)
  return firstFiveProducts.products && firstFiveProducts.products.edges.length > 0 ? firstFiveProducts.products.edges : []
}