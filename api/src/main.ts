import { NestFactory } from '@nestjs/core'
import { env } from '@shared/config/env'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(env.PORT)

  app.enableCors({
    origin: env.TRUSTED_ORIGINS,
    credentials: true
  })
}

bootstrap()
