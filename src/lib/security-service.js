import crypto from 'crypto'
import querystring from 'querystring'

export function computeSignature(querystringFromClient, shopifyAppSecret) {
  const formattedQueryString = querystringFromClient.replace("/?", "")
    .replace(/&signature=[^&]*/, "").split("&")
    .map(x => querystring.unescape(x)).sort().join("")
  const computedSignature = crypto.createHmac('sha256', shopifyAppSecret)
    .update(formattedQueryString, 'utf-8').digest('hex')
  return computedSignature
}

export function verifyHmac(shopifyAppSecret, req, body) {
  try {
    var digest = crypto.createHmac('SHA256', shopifyAppSecret)
      .update(new Buffer.from(body, 'utf8'))
      .digest('base64')
    return digest === req.headers['x-shopify-hmac-sha256']
  } catch (error) {
    log(error, req.body)
    return false
  }
}