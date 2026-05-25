import { Controller, Get } from '@nestjs/common'

@Controller()
export class HealthController {
  @Get('/health')
  health() {
    return {
      status: 'ok',
      service: 'all services are running',
      timestamp: new Date().toISOString()
    }
  }
}
