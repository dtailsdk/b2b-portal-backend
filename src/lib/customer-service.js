import moment from 'moment'
import { Api } from '@dtails/shopify-api'
import { B2B_PORTAL_NAMESPACE } from './metafield-service'
import { getConfigurationByShop } from './configuration-service'
import { getProductsWithoutDiscount } from './product-service'

export async function getCustomerById(store, customerId) {
  let customer = await store.api().customer.getById(customerId)
  customer = customer.customer

  const configuration = await getConfigurationByShop(store)

  const productsWithoutDiscount = await getProductsWithoutDiscount(store.id)
  customer.productsWithoutDiscount = productsWithoutDiscount
  customer.discountPercentage = 0
  if (configuration.discountConfiguration.customerDiscount.enable) {
    const percentageMetafield = configuration.discountConfiguration.customerDiscount.percentageMetafield
    const discountPercentage = getMetafieldValue(customer.metafields, percentageMetafield.metafieldKey, percentageMetafield.metafieldNamespace)
    if (discountPercentage) {
      customer.discountPercentage = parseInt(discountPercentage)
    }
  }
  return customer
}

function getMetafieldValue(metafields, key, namespace) {
  const metafield = metafields.find((metafield) => {
    return metafield.key == key && metafield.namespace == namespace
  })
  return metafield != null ? metafield.value : ''
}