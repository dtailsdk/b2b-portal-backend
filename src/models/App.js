import { Model } from '@mekanisme/server'

class App extends Model {
  static tableName = 'apps'
  static hasTimestamps = true
}

export default App
