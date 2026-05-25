import { AuthModule } from '@modules/auth/auth.module'
import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'

@Module({
  imports: [AuthModule],
  controllers: [HealthController],
  providers: []
})
export class AppModule {}
