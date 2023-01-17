import { Server } from '@mekanisme/server'

async function getB2bPortal(req, res) {
  return res.send('Cool Vue B2B portal here')
}

async function ping(req, res) {
  console.log('Ping!')
  return res.send('Pong')
}

export default function init() {
  const router = Server.Router()

  router
    .route('/')
    .get(getB2bPortal)
    .all(Server.middleware.methodNotAllowed)

  router
    .route('/ping')
    .get(ping)
    .all(Server.middleware.methodNotAllowed)

  return router
}