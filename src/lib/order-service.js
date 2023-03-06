import { map, maxBy } from 'lodash'
import { getCustomerById } from './customer-service'
import { getProductsWithoutDiscount, getMinimumFeeProduct } from './product-service'
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
        valueType: 'PERCENTAGE',
        value: customer.discountPercentage,
        title: `${customer.discountPercentage}%`,
      }
    }
    totalOrderValue += linePrice - lineDiscount

    return orderLineItem
  })

  const minimumOrderValue = await getMinimumOrderValue(store, currencyCode)
  console.log('totalOrderValue', totalOrderValue, 'minimumOrderValue', minimumOrderValue)
  if (totalOrderValue < minimumOrderValue) {
    //const minimumOrderFee = await getMinimumOrderFee(store, currencyCode)
    const minimumOrderFeeProduct = await getMinimumFeeProduct(store.id)
    lineItems.push({
      variantId: `gid://shopify/ProductVariant/${minimumOrderFeeProduct.variants[0].variantId}`,
      quantity: 1,
    })
  }

  let draftOrderInput = {
    input: {
      customerId: customer.id,
      email: customer.email,
      presentmentCurrencyCode: currencyCode,
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

const currencyRates = {USD:1,EUR:1.06442,GBP:1.20366,CAD:.734906,ARS:.00504343,AUD:.676459,BRL:.192296,CLP:.00124584,CNY:.144766,CYP:.397899,CZK:.0452735,DKK:.142933,EEK:.0706676,HKD:.127407,HUF:.00280461,ISK:.00708588,INR:.012242,JMD:.00645762,JPY:.00736325,LVL:1.57329,LTL:.320236,MTL:.293496,MXN:.0556518,NZD:.622447,NOK:.0963449,PLN:.225893,SGD:.743599,SKK:21.5517,SIT:175.439,ZAR:.0551369,KRW:771182e-9,SEK:.0956226,CHF:1.06824,TWD:.0327313,UYU:.025519,MYR:.223491,BSD:1,CRC:.00178326,RON:.21584,PHP:.0182611,AED:.272294,VEB:4115e-13,IDR:653403e-10,TRY:.0530994,THB:.0289323,TTD:.148804,ILS:.27286,SYP:398006e-9,XCD:.370366,COP:208965e-9,RUB:.01321,HRK:.141273,KZT:.00231998,TZS:427804e-9,XPT:976.52,SAR:.266667,NIO:.0274762,LAK:590219e-10,OMR:2.59742,AMD:.00258112,CDF:500006e-9,KPW:.00111111,SPL:6,KES:.00783476,ZWD:.00276319,KHR:246876e-9,MVR:.0647017,GTQ:.127961,BZD:.496225,BYR:39604e-9,LYD:.207177,DZD:.00730737,BIF:482329e-9,GIP:1.20366,BOB:.144221,XOF:.0016227,STD:433842e-10,NGN:.00217189,PGK:.284067,ERN:.0666667,MWK:98307e-8,CUP:.0417978,GMD:.016368,CVE:.00965286,BTN:.012242,XAF:.0016227,UGX:26954e-8,MAD:.0963673,MNT:283667e-9,LSL:.0551369,XAG:21.25,TOP:.420502,SHP:1.20366,RSD:.00906666,HTG:.00655908,MGA:231158e-9,MZN:.0156776,FKP:1.20366,BWP:.0754902,HNL:.0406636,PYG:138857e-9,JEP:1.20366,EGP:.0324501,LBP:667843e-10,ANG:.559503,WST:.3723,TVD:.676459,GYD:.00475959,GGP:1.20366,NPR:.00764764,KMF:.0021636,IRR:238061e-10,XPD:1451.73,SRD:.0299075,TMM:571306e-10,SZL:.0551369,MOP:.123696,BMD:1,XPF:.00891984,ETB:.0186182,JOD:1.41044,MDL:.0532579,MRO:.00274648,YER:.00399675,BAM:.54423,AWG:.558659,PEN:.265203,VEF:4115e-10,SLL:489478e-10,KYD:1.21951,AOA:.00198456,TND:.319336,TJS:.0915193,SCR:.0713085,LKR:.00290948,DJF:.00561625,GNF:116256e-9,VUV:.00847307,SDG:.0017661,IMP:1.20366,GEL:.383756,FJD:.451451,DOP:.0180642,XDR:1.32994,MUR:.0215742,MMK:477195e-9,LRD:.00635562,BBD:.5,ZMK:497509e-10,XAU:1855.31,VND:421672e-10,UAH:.027287,TMT:.285653,IQD:685095e-9,BGN:.54423,KGS:.011439,RWF:917927e-9,BHD:2.65957,UZS:878735e-10,PKR:.00362381,MKD:.0171952,AFN:.0112385,NAD:.0551369,BDT:.00941895,AZN:.588238,SOS:.00175892,QAR:.274725,PAB:1,CUC:1,SVC:.114286,SBD:.121,ALL:.00922622,BND:.743599,KWD:3.24693,GHS:.0812344,ZMW:.0497509,XBT:22175.1,NTD:.0337206,BYN:.39604,CNH:.144989,MRU:.0274648,STN:.0433842,VES:.04115,MXV:.428346,VED:.04115,SLE:.0489478}

function convert(amount,fromCurrencyCode,toCurrencyCode) {
  return amount * fromCurrencyCode[fromCurrencyCode] / toCurrencyCode[toCurrencyCode]
}


export async function getShippingForOrder(shopifyApi, draftOrderInput) {
  const shippingMethods = await shopifyApi.draftOrder.calculate(draftOrderInput)
  console.log('getShippingForOrder shippingMethods', JSON.stringify(shippingMethods, null, 2))
  const applicableMethod = maxBy(shippingMethods.calculatedDraftOrder.availableShippingRates, (rate) => { return parseFloat(rate.price.amount)})
  if (applicableMethod && applicableMethod.price.currencyCode !== shippingMethods.calculatedDraftOrder.presentmentCurrencyCode) {
    applicableMethod.price.amount =  convert(parseFloat(applicableMethod.price.amount), applicableMethod.price.currencyCode, shippingMethods.calculatedDraftOrder.presentmentCurrencyCode)
    applicableMethod.price.amount = Math.round(applicableMethod.price.amount)
  }
  return applicableMethod
}

export async function createOrder(shopifyApi, draftOrderInput) {
  const draftOrder = await shopifyApi.draftOrder.create(draftOrderInput)
  const completedOrder = await shopifyApi.draftOrder.complete(draftOrder)
  return completedOrder
}
