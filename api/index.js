import { createApp } from '../server/app.js'
import { createServerlessStore } from '../server/serverless-store.js'

// One store + app per serverless instance, initialized on cold start.
// No realtime hub here: serverless functions can't hold WebSockets open,
// so the client falls back to HTTP polling automatically.
const appPromise = createServerlessStore().then((store) => createApp(store, null))

export default async function handler(req, res) {
  const app = await appPromise
  app(req, res)
}
