import { error } from '@dtails/logger'

export async function createWebhook(shopifyApi, input) {
  const createWebhookInput = { topic: input.topic, webhookSubscription: input.webhookSubscription }
  const query = `mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      userErrors {
        field
        message
      }
      webhookSubscription {
        id
      }
    }
  }`
  const result = await shopifyApi.graphql(query, createWebhookInput)
  if (result.webhookSubscriptionCreate.userErrors.length > 0) {
    error(`\n\nAn error occurred when trying to create webhook in Shopify: ${JSON.stringify(result.webhookSubscriptionCreate.userErrors)}\n\nquery: ${query}\n\ninput: ${JSON.stringify(createWebhookInput)}\n\n`)
    throw new Error(result.webhookSubscriptionCreate.userErrors)
  }
  return result.webhookSubscriptionCreate
}

export async function deleteWebhook(shopifyApi, shopifyWebhookGid) {
  const deleteWebhookInput = { id: shopifyWebhookGid }
  const query = `mutation webhookSubscriptionDelete($id: ID!) {
    webhookSubscriptionDelete(id: $id) {
      deletedWebhookSubscriptionId
      userErrors {
        field
        message
      }
    }
  }`
  const result = await shopifyApi.graphql(query, deleteWebhookInput)
  if (result.webhookSubscriptionDelete.userErrors.length > 0) {
    error(`\n\nAn error occurred when trying to delete webhook in Shopify: ${JSON.stringify(result.webhookSubscriptionDelete.userErrors)}\n\nquery: ${query}\n\ninput: ${JSON.stringify(deleteWebhookInput)}\n\n`)
    throw new Error(result.webhookSubscriptionDelete.userErrors)
  }
  return result.webhookSubscriptionDelete
}

export async function getWebhooks(shopifyApi) {
  const query = `{
    webhookSubscriptions(first:10) {
      edges {
        node {
          id
          topic
          callbackUrl
        }
      }
    }
  }`
  const result = await shopifyApi.graphql(query)
  return result.webhookSubscriptions.edges
}