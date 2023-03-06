import { Product, ProductVariant, Webhook, ShopifyToken } from 'models'
import { groupBy } from 'lodash'
import { DB_PRODUCT_MODEL } from '@dtails/shopify-api'

export async function processProductJobs(jobs) {
  //1. Fetch all webhooks
  //2. Group jobs on store_name
  //3. Do async for each group
    //2.1 Fetch relevant webhooks and products_ids
    //2.2 Fetch all products based on product_ids
    //2.3 Run createdOrUpdateProduct for each
  const webhookIds = jobs.map((job) => { console.log(job); return job.data.webhookId })
  const webhooks = await Webhook.q.whereIn('id', webhookIds)

  const jobsByStoreName = groupBy(jobs, 'data.store_name')
  console.log('Processing jobs')


  let promises = []
  for (const storeName in jobsByStoreName) {
    const jobList = jobsByStoreName[storeName]
    const productIds = jobList.map((job) => {
      const data = job.data
      return data.entityId
    })
    console.log('jobList[0]', jobList[0])
    const storeId = jobList[0].data.store_id
    promises.push(updateProductsForStore(storeId, productIds)
    .then((result) => {
      console.log('job done', result)
      for (let i = 0; i < jobList.length; i++) {
        const job = jobList[i]
        job.done(false)
      }
    })
    .catch((error) => {
      console.log('Error', error)
      for (let i = 0; i < jobList.length; i++) {
        const job = jobList[i]
        job.done(error)
      }
      //TODO: Log error in logger library
    }))
  }

  await Promise.all(promises)
  console.log('Jobs processed')
  
  /*for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]
    let jobError = false
    try {
      //await createOrUpdateProduct()
      job.done(jobError)
    } catch (error) {
      jobError = true
      job.done(jobError, error)
      //TODO: Log error in logger library
    }
  }*/
}

export async function getProductsWithoutDiscount(storeId) {
  const products = await Product.q.where({'products.store_id': storeId}).whereJsonSupersetOf('products.data:metafields', [{key: 'disallow_discount'}, {value: 'true'}]).withGraphJoined('variants')
  return products
}

export async function getMinimumFeeProduct(storeId) {
  const product = await Product.q.where({'products.store_id': storeId, handle: 'minimum-order-fee'}).withGraphJoined('variants').first()
  console.log('PRODUCT', product)
  return product
}

async function updateProductsForStore(storeId, productIds) {
  const store = await ShopifyToken.q.findOne({ id: storeId })
  const idQuery = productIds.map((id) => { return `id:${id}`}).join(' OR ')
  const preparedBulkQuery = store.api().product.prepareBulkQuery('products', DB_PRODUCT_MODEL, idQuery)
  const products = await store.api().product.runBulkQuery(preparedBulkQuery, true, 'Product')
  console.log('PRODUCTS JSON ', JSON.stringify(products, null, 2))

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    try {
      await createOrUpdateProduct(store, product)
    } catch (error) {
      console.log('error updating product', JSON.stringify(product, null,2 ), error)
    }
  } 
}

export async function syncAllProducts(storeId) {
  const store = await ShopifyToken.q.findOne({ id: storeId })
  const preparedBulkQuery = store.api().product.prepareBulkQuery('products', DB_PRODUCT_MODEL)
  console.log(`Fetching all products from store: ${store.shop}`)
  const products = await store.api().product.runBulkQuery(preparedBulkQuery, true, 'Product')
  console.log('PRODUCTS JSON ', JSON.stringify(products, null, 2))
  console.log(`Found ${products.length} products, now syncing`)
  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    try {
      await createOrUpdateProduct(store, product)
    } catch (error) {
      console.log('error updating product', JSON.stringify(product, null,2 ), error)
    }
  } 
}

export async function getProductByHandle(handle) {
  const product = await Product.q.where({handle}).first()
  return product
}

export async function createOrUpdateProduct(store, product) {
  const productId = product.id.split('/').pop()
  const dbProduct = await Product.q.findOne({ store_id: store.id, product_id: productId })
  const variants = product.variants
  if (dbProduct) {
    await Product.q.update({
      store_id: store.id,
      product_id: productId,
      handle: product.handle,
      title: product.title,
      tags: product.tags,
      data: JSON.stringify(product),
    }).where({ product_id: productId })

    for (const variant of variants) {
      const variantId = variant.id.split('/').pop()
      let existingVariant = await ProductVariant.q.where({store_id: store.id, variant_id: variantId}).first()
      if (existingVariant) {
        await ProductVariant.q.update({
          store_id: store.id,
          product_id: productId,
          variant_id: variantId,
          sku: variant.sku,
          product_title: variant.title,
          barcode: variant.barcode,
          data: JSON.stringify(variant)
        }).where({ variant_id: variantId })
      } else {
        await ProductVariant.q.insert({
          store_id: store.id,
          product_id: productId,
          variant_id: variantId,
          sku: variant.sku,
          product_title: variant.title,
          barcode: variant.barcode,
          data: JSON.stringify(variant)
        })
      }
    }
  } else {
    await Product.q.insert({
      store_id: store.id,
      product_id: productId,
      handle: product.handle,
      title: product.title,
      tags: product.tags,
      data: JSON.stringify(product),
    })

    for (const variant of variants) {
      const variantId = variant.id.split('/').pop()
      await ProductVariant.q.insert({
        store_id: store.id,
        product_id: productId,
        variant_id: variantId,
        sku: variant.sku,
        product_title: variant.title,
        barcode: variant.barcode,
        data: JSON.stringify(variant)
      })
    }
  }
}