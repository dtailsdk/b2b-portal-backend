import { error } from '@dtails/logger'

export async function updateMetafield(shopifyApi, metafield) {
  const input = { metafields: [metafield] }
  const query = `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
      }
      userErrors {
        field
        message
      }
    }
  }`
  const result = await shopifyApi.graphql(query, input)
  if (result.metafieldsSet.userErrors.length > 0) {
    error(`\n\nAn error occurred when trying to update metafield in Shopify: ${JSON.stringify(result.metafieldsSet.userErrors)}\n\nquery: ${query}\n\ninput: ${JSON.stringify(input)}\n\n`)
    throw new Error(result.metafieldsSet.userErrors)
  }
  return result.metafieldsSet.metafields[0]
}