import { runAttentionCron } from '../server/attention/cronClient.js'

const result = await runAttentionCron()
console.log(JSON.stringify(result))
