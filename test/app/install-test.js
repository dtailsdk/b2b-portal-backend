import test from 'ava'
const puppeteer = require('puppeteer')
const td = require('testdouble')
import { Server, Model } from '@dtails/toolbox'
require('dotenv').config({ path: './.env.test' })

const testShop = {
  storeFrontUrl: 'https://b2b-portal-automated-test.myshopify.com/'
}
/*
test.before(async t => {
  Server.init({ withCors: false })
  Server.initModel(Model, { debug: false })
})

test.after(async t => {
  td.reset()
})
*/

test('When ', async t => {


  /*
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto('https://www.google.dk', { waitUntil: 'networkidle2' })
  await page.waitForSelector('#cardholder');
  await page.$eval('#cardholder', el => el.value = 'L E');
  await page.waitForSelector('#cardnumber');
  await page.$eval('#cardnumber', el => el.value = '1000 0000 0000 0008');
  await page.waitForSelector('#expiration-month');
  await page.$eval('#expiration-month', el => el.value = '03');
  await page.waitForSelector('#expiration-year');
  await page.$eval('#expiration-year', el => el.value = '23');
  await page.waitForSelector('#cvd');
  await page.$eval('#cvd', el => el.value = '208');
  await page.waitForSelector(`[class*="btn btn-info"]`, { timeout: 0 })
  await page.click('[class*="btn btn-info"]');
  await page.waitForNavigation({
    waitUntil: 'networkidle0',
  });

  await browser.close()
  */
  t.true(true)
})