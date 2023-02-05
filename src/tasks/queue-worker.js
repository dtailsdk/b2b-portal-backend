import { Server, Model } from '@dtails/toolbox-backend'
import { QueueWorker, QueueType } from '@dtails/queue-backend'
import { getEnvironment } from '@dtails/toolbox-backend'
import { processProductJobs } from '../lib/product-service'

Server.init({ withCors: false })
Server.initModel(Model, { debug: false })

async function registerQueues() {
  console.log('initializing queue')
  //const queue = await initQueue()
  const worker = new QueueWorker(getEnvironment('DATABASE_URL'))
  console.log('queue initialized')
  //await worker.process(QueueType.Product, doSomeWork, {includeMetadata: true})
  await worker.processBatch(QueueType.Product, processProductJobs, 200, {newJobCheckIntervalSeconds: 15}) //TODO: SET Number of seconds for checking queue
}

registerQueues()