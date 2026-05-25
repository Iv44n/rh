import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod
} from '@nestjs/common'
import { BetterAuthMiddleware } from './auth.middleware'

@Module({})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(BetterAuthMiddleware).forRoutes({
      path: 'api/auth/*path',
      method: RequestMethod.ALL
    })
  }
}
