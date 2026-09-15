import { Arcton } from '@arcton/core'
import { cors } from '@arcton/cors'
import { openapi } from '@arcton/openapi'
import { auth } from '#modules/auth/config'
import { env } from '#shared/config/env'
import { log } from '#shared/config/logger'

const app = Arcton()

app.use(
  cors({
    origin: env.APP_URL,
    credentials: true
  })
)

app.use(log)

app.all('/api/auth/*path', ctx => auth.handler(ctx.request))

app.get('/health', () => 'OK')

app.listen({
  port: env.PORT,
  openapi: openapi({
    info: {
      title: 'RH API',
      version: '1.0.0',
      description: 'Documentation of the RH API'
    }
  })
})
