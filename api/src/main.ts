import { NestFactory } from '@nestjs/core'
import { env } from '@shared/config/env'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: env.TRUSTED_ORIGINS,
    credentials: true
  })

  await app.listen(env.PORT)
}

bootstrap()
