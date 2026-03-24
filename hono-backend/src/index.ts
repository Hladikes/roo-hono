import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import Database from 'better-sqlite3'
import * as z from 'zod'
import { sValidator } from '@hono/standard-validator'

const app = new Hono()

app.use('*', cors())

const db = new Database('test-db.db')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
)
`)

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(3)
})

app.post('/login',
    sValidator('json', loginSchema),

    (c) => {

        const body = c.req.valid('json')

        const user = db
            .prepare("SELECT * FROM users WHERE email = ? AND password = ?")
            .get(body.email, body.password)

        if (!user) {
            return c.json({
                success: false,
                message: "Wrong email or password"
            })
        }

        return c.json({
            success: true,
            user
        })
    })

serve(
    {
        fetch: app.fetch,
        port: 3000
    },
    (info) => {
        console.log(`Server running on http://localhost:${info.port}`)
    }
)