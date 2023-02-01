import test from 'ava'
import { Server, Model } from '@dtails/toolbox-backend'
import { ShopifyToken, App } from 'models'
require('dotenv').config({ path: './.env.test' })
import { softDeleteShopData } from '../../src/lib/shop-service'

test.before(async t => {
  Server.init({ withCors: false })
  Server.initModel(Model, { debug: false })
  await ShopifyToken.q.del()
})

test('When shop is soft deleted, then shop uninstall at timestamp is set', async t => {
  const shopCountBefore = (await ShopifyToken.q).length
  const dbApp = await App.q.insert({ identifier: 'some-identifier', shopify_app_key: 'some-key', shopify_app_key: 'some-secret', shopify_app_handle: 'some-handle' })
  const dbShop = await ShopifyToken.q.insert({ shop: 'some-shop', token: 'some-token', scope: 'some-scope', appId: dbApp.id })
  const shopCountAfter = (await ShopifyToken.q).length
  t.is(shopCountAfter, shopCountBefore + 1)
  t.is(dbShop.uninstalledAt, undefined)
  await softDeleteShopData(dbShop)
  const softDeletedShop = await ShopifyToken.q.findOne({ id: dbShop.id })
  t.not(softDeletedShop.uninstalledAt, undefined)
  t.true(true)
})
