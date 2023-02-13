import { map, maxBy } from 'lodash'

export const MARKET_CURRENCY_MAP = { //TODO: Pull from Shopify
  'DKK' : 'DK',
  'EUR' : 'DE',
  'SEK' : 'SE',
  'NOK' : 'NO',
  'USD' : 'US' 
 }

export function convertToDraftOrder(customerId, email, cart, address) {
  let shippingAddress = {
    address1: address.address1 ? address.address1 : '',
    address2: address.address2 ? address.address2 : '',
    city: address.city ? address.city : '',
    company: address.company ? address.company : '',
    countryCode: address.countryCode ? address.countryCode : '',
    firstName: address.firstName ? address.firstName : '',
    lastName: address.lastName ? address.lastName : '',
    phone: address.phone ? address.phone : '',
    province: address.province ? address.province : '',
    zip: address.zip ? address.zip : ''
  }

  let totalDiscount = 0
  let totalProductDiscount = 0

  const orderTotal = (cart.total_price - totalDiscount) / 100
  const currencyCode = cart.currency.toUpperCase()

  const marketRegionCountryCode = MARKET_CURRENCY_MAP[currencyCode] ? MARKET_CURRENCY_MAP[currencyCode] : 'DK'

  let lineItems = map(cart.items, (lineItem) => {
    const lineItemDiscount = lineItem.line_price - lineItem.final_line_price
    totalDiscount += lineItemDiscount
    const listLinePrice = lineItem.line_price //Before discount
    const linePrice = lineItem.final_line_price
    let productDiscount = 0
    if (lineItem.properties && lineItem.properties.onSale && lineItem.properties.compareAtPrice) {
      productDiscount = (parseFloat(lineItem.properties.compareAtPrice) * lineItem.quantity) - linePrice
      totalProductDiscount += productDiscount
    }

    let orderLineItem = { 
      variantId: `gid://shopify/ProductVariant/${lineItem.variant_id}`,
      quantity: lineItem.quantity
    }
    if (listLinePrice > linePrice) {
      orderLineItem.appliedDiscount = {
        valueType: 'PERCENTAGE',
        value: customerDiscount,
        title: `${customerDiscount}% discount`,
      }
    }

    return orderLineItem
  })

  let draftOrderInput = {
    input: {
      customerId: `gid://shopify/Customer/${customerId}`,
      email: email,
      marketRegionCountryCode: marketRegionCountryCode, //TODO: How do we determine the country code, is it by getting currency and finding respective market?
      lineItems,
      shippingAddress,
      billingAddress: shippingAddress,
    }
  }
  return draftOrderInput
}

export async function getShippingForOrder(shopifyApi, draftOrderInput) {
  const shippingMethods = await shopifyApi.draftOrder.calculate(draftOrderInput)
  return maxBy(shippingMethods.calculatedDraftOrder.availableShippingRates, (rate) => { return parseFloat(rate.price.amount)})
}

export async function createOrder(shopifyApi, draftOrderInput) {
  const draftOrder = await shopifyApi.draftOrder.create(draftOrderInput)
  const completedOrder = await shopifyApi.draftOrder.complete(draftOrder)
  return completedOrder
}