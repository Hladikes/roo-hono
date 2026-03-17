import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { SSEStreamingApi, streamSSE } from 'hono/streaming'
import { cors } from 'hono/cors'

const app = new Hono()
app.use(cors())

let items: string[] = []
const activeConnections = new Set<SSEStreamingApi>()

app.get('/event-stream', (c) => {
  return streamSSE(c, async (stream) => {
    activeConnections.add(stream)
    while (!stream.aborted) {
      if (items.length > 0) {
        activeConnections.forEach(async (connection) => {
          await connection.writeSSE({
            data: JSON.stringify(items),
          })
        })

        items = []
      }

      await stream.sleep(1000)
    }
    activeConnections.delete(stream)
  })
})

app.post('/item', async (c) => {
  const body = await c.req.json()
  items.push(body.item)

  return c.text(body.item)
})

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)
