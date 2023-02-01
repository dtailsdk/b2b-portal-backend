import test from 'ava'
const puppeteer = require('puppeteer')
const td = require('testdouble')
import { Server, Model } from '@dtails/toolbox-backend'
require('dotenv').config({ path: './.env.test' })
import { delay } from '@dtails/toolbox-backend'


const testShop = {
  storeFrontUrl: 'https://b2b-portal-automated-test.myshopify.com/',
  storeFrontLoginUrl: 'https://b2b-portal-automated-test.myshopify.com/account/login',
  apiProxyUrl: 'https://b2b-portal-automated-test.myshopify.com/apps/tokens',
  appInstallLink: 'https://b2b-portal-automated-test.myshopify.com/admin/oauth/install_custom_app?client_id=29bad205539945372ebe1418f1cb4c5d&signature=eyJfcmFpbHMiOnsibWVzc2FnZSI6ImV5SmxlSEJwY21WelgyRjBJam94TmpjMU9EVTRNalUzTENKd1pYSnRZVzVsYm5SZlpHOXRZV2x1SWpvaVlqSmlMWEJ2Y25SaGJDMWhkWFJ2YldGMFpXUXRkR1Z6ZEM1dGVYTm9iM0JwWm5rdVkyOXRJaXdpWTJ4cFpXNTBYMmxrSWpvaU1qbGlZV1F5TURVMU16azVORFV6TnpKbFltVXhOREU0WmpGallqUmpOV1FpTENKd2RYSndiM05sSWpvaVkzVnpkRzl0WDJGd2NDSjkiLCJleHAiOiIyMDIzLTAyLTE1VDEyOjEwOjU3LjI4NFoiLCJwdXIiOm51bGx9fQ%3D%3D--c2e7f68561b88a27b74c55f9525539d533102aa0',
  storeFrontPassword: 'automated_test',
  customerEmail: 'support@dtails.dk',
  customerPassword: 'test123'
}

test('When customer logs into Shopfiy, then a JWT is set', async t => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto(testShop.storeFrontUrl, { waitUntil: 'networkidle2' })
  await page.type('#password', testShop.storeFrontPassword)
  const button = await page.waitForSelector('[type="submit"]')
  await Promise.all([
    button.click(),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ])

  await page.goto(testShop.storeFrontLoginUrl, { waitUntil: 'networkidle2' })
  await page.type('#CustomerEmail', testShop.customerEmail)
  await page.type('#CustomerPassword', testShop.customerPassword)

  await Promise.all([
    page.keyboard.press('Enter'),
    page.waitForNavigation({ waitUntil: 'load', timeout: 100000 })
  ])

  await page.goto(testShop.apiProxyUrl, { waitUntil: 'load', timeout: 100000 })
  const found = (await page.content()).match(/token/gi)
  t.true(found.length == 1)
})