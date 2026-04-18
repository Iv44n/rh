import { env } from '@shared/config/env'
import { Elysia } from 'elysia'

const app = new Elysia().get('/', () => 'Hello Elysia').listen(env.PORT)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
