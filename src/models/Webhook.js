import { Model } from '@dtails/toolbox-backend'

class Webhook extends Model {
  static tableName = 'webhooks'
  static hasTimestamps = true
}

export default Webhook