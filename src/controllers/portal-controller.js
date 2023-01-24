import { Server } from '@mekanisme/server'

/**
 * Controller for the calls from the B2B portal
 */
async function ping(req, res) {
  console.log('Ping!')
  return res.send('Pong')
}

export default function init() {
  const router = Server.Router()

  router
    .route('/ping')
    .get(ping)
    .all(Server.middleware.methodNotAllowed)

  return router
}