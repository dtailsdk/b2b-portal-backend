import { map, maxBy } from 'lodash'
import { getCustomerById } from './customer-service'
import { getProductsWithoutDiscount } from './product-service'
import { getConfigurationByShop, getMinimumOrderFee, getMinimumOrderValue } from './configuration-service'

export const MARKET_CURRENCY_MAP = { //TODO: Pull from Shopify
  'DKK' : 'DK',
  'EUR' : 'DE',
  'SEK' : 'SE',
  'NOK' : 'NO',
  'USD' : 'US'
 }

export async function convertToDraftOrder(customer, cart, address, store) {
  let shippingAddress = {
    address1: address.address1 ? address.address1 : '',
    address2: address.address2 ? address.address2 : '',
    city: address.city ? address.city : '',
    company: address.company ? address.company : '',
    countryCode: address.countryCodeV2 ? address.countryCodeV2 : '',
    firstName: address.firstName ? address.firstName : '',
    lastName: address.lastName ? address.lastName : '',
    phone: address.phone ? address.phone : '',
    province: address.province ? address.province : '',
    zip: address.zip ? address.zip : ''
  }

  const currencyCode = cart.currency.toUpperCase()
  const marketRegionCountryCode = MARKET_CURRENCY_MAP[currencyCode] ? MARKET_CURRENCY_MAP[currencyCode] : 'DK'

  const productsWithoutDiscount = await getProductsWithoutDiscount(store.id)

  const configuration = await getConfigurationByShop(store)

  let totalOrderValue = 0

  let lineItems = map(cart.items, (lineItem) => {
    let orderLineItem = {
      variantId: `gid://shopify/ProductVariant/${lineItem.variant_id}`,
      quantity: lineItem.quantity
    }
    const unitPrice = lineItem.price / 100
    const linePrice = lineItem.line_price / 100
    let lineDiscount = 0
    if (customer.discountPercentage && !disallowDiscountForVariant(lineItem.variant_id, productsWithoutDiscount)) {
      const percentage = parseFloat(customer.discountPercentage) / 100
      lineDiscount = unitPrice * percentage
      orderLineItem.appliedDiscount = {
        valueType: 'FIXED_AMOUNT',
        value: parseFloat(lineDiscount.toFixed(2)),
        title: `${customer.discountPercentage}%`,
      }
    }
    totalOrderValue += linePrice - lineDiscount

    return orderLineItem
  })

  const minimumOrderValue = await getMinimumOrderValue(store, currencyCode)
  console.log('totalOrderValue', totalOrderValue, 'minimumOrderValue', minimumOrderValue)
  if (totalOrderValue < minimumOrderValue) {
    const minimumOrderFee = await getMinimumOrderFee(store, currencyCode)
    lineItems.push({
      title: 'Minimum order fee',
      quantity: 1,
      originalUnitPrice: minimumOrderFee
    })
  }

  let draftOrderInput = {
    input: {
      customerId: customer.id,
      email: customer.email,
      marketRegionCountryCode: marketRegionCountryCode, //TODO: How do we determine the country code, is it by getting currency and finding respective market?
      lineItems,
      shippingAddress,
      billingAddress: shippingAddress,
    }
  }

  console.log('draftOrderInput', JSON.stringify(draftOrderInput, null, 2))
  return draftOrderInput
}

function disallowDiscountForVariant(variantId, productsWithoutDiscount) {
  const product = productsWithoutDiscount.find((product) => {
    return product.variants.find((variant) => {
      return variant.variantId.toString() == variantId.toString()
    })
  })
  return product !== undefined
}

export async function getShippingForOrder(shopifyApi, draftOrderInput) {
  const shippingMethods = await shopifyApi.draftOrder.calculate(draftOrderInput)
  console.log('getShippingForOrder shippingMethods', JSON.stringify(shippingMethods, null, 2))
  return maxBy(shippingMethods.calculatedDraftOrder.availableShippingRates, (rate) => { return parseFloat(rate.price.amount)})
}

export async function createOrder(shopifyApi, draftOrderInput) {
  const draftOrder = await shopifyApi.draftOrder.create(draftOrderInput)
  const completedOrder = await shopifyApi.draftOrder.complete(draftOrder)
  return completedOrder
}
