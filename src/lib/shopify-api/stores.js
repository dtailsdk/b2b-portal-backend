import Shopify from 'shopify-api-node'

export function getApiConnection(token) {
  const shopify = new Shopify({
    shopName: token.shop,
    accessToken: token.token,
    apiVersion: '2023-01',
  })
  return shopify
}

export async function getShop(shopifyApi) {
  const query = `{
    shop{
      id
    }
  }`
  const result = await shopifyApi.graphql(query)
  return result.shop
}