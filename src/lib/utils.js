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