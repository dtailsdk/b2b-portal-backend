import moment from 'moment'
import { Api } from '@dtails/shopify-api'

export async function getCustomer(store, customerId) {
  const customer = await store.api().customer.getById(customerId)
  return customer
}