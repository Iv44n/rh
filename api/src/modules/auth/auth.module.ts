import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod
} from '@nestjs/common'
import { BetterAuthMiddleware } from './auth.middleware'
import { InvitationListAccessMiddleware } from './invitation-access.middleware'

@Module({})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(InvitationListAccessMiddleware).forRoutes({
      path: 'api/auth/organization/list-invitations',
      method: RequestMethod.GET
    })

    consumer.apply(BetterAuthMiddleware).forRoutes({
      path: 'api/auth/*path',
      method: RequestMethod.ALL
    })
  }
}
