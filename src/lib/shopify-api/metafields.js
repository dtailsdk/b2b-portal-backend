import axios from 'axios'
import { log, error } from '@dtails/logger'
import { delay } from '@dtails/toolbox-backend'

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

export async function createMetafieldDefinition(shopifyApi, metafield) {
  const input = { definition: metafield }
  const query = `mutation metafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
  `
  const result = await shopifyApi.graphql(query, input)
  if (result.metafieldDefinitionCreate.userErrors.length > 0) {
    error('An error occurred when trying to create metafield definition in Shopify', input, result.metafieldDefinitionCreate.userErrors)
    throw new Error(result.metafieldDefinitionCreate.userErrors)
  }
  return result.metafieldDefinitionCreate.createdDefinition
}

export async function getMetafieldDefinitions(shopifyApi, ownerTypes) {
  let metafieldQueries = ''
  for (const ownerType of ownerTypes) {
    metafieldQueries += `${ownerType.toLowerCase()}: metafieldDefinitions(ownerType:${ownerType}){
      edges{
        node{
          id
          namespace
          key
          type{
            name
          }
        }
      }
    }`
  }
  const query = `mutation {
    bulkOperationRunQuery(
      query: """
      {
        ${metafieldQueries}
      }
      
      """
    )  {
      bulkOperation {
        id
        status
      }
      userErrors {
        field
        message
      }
    }
  }`
  const createBulkOperation = await shopifyApi.graphql(query)
  //TODO Handle error when creating bulk job
  let queryUrl = null
  while (!queryUrl) {
    //TODO Use callback when job is done instead
    queryUrl = await getBulkOperation(shopifyApi)
    log('Querying bulk job status')
    await delay(2000)
  }
  if (queryUrl == 'N/A') {
    return null
  }
  const result = await axios.get(queryUrl)
  return result.data
}

export async function getBulkOperation(shopifyApi) {
  const query = `query {
    currentBulkOperation {
      id
      status
      errorCode
      createdAt
      completedAt
      objectCount
      fileSize
      url
      partialDataUrl
    }
  }`

  const bulkOperation = await shopifyApi.graphql(query)
  if (bulkOperation.currentBulkOperation.status == 'COMPLETED') {
    if (!bulkOperation.currentBulkOperation.url) {
      return 'N/A'
    }
    return bulkOperation.currentBulkOperation.url
  }
  if (bulkOperation.currentBulkOperation.status == 'FAILED') {
    return 'N/A'
  }
  return null
}